import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Hardcode this flag to enable/disable markdown rendering for assistant messages.
const ENABLE_ASSISTANT_MARKDOWN = true;

const RUN_STEPS_IN_PROGRESS: RunStatus[] = ['PENDING', 'THINKING', 'STREAMING'];

const RUN_STATUS_LABEL: Record<RunStatus, string> = {
    PENDING: 'Queued...',
    THINKING: 'Thinking...',
    STREAMING: 'Responding...',
    DONE: 'Completed',
    ERROR: 'Failed',
    CANCELLED: 'Cancelled',
    STALE: 'Outdated'
};

const USER_MSG_STATUS_LABEL: Partial<Record<UserMsgStatus, string>> = {
    DRAFT: 'Draft',
    SENDING: 'Sending...',
    FAILED: 'Failed to send',
    REJECTED_RUN_IN_PROGRESS: 'Rejected: assistant is still replying',
    DUPLICATE: 'Duplicate message'
};

const FakeStreamingFinalReply = [
    'Sure, I can help you create a lesson plan.',
    '',
    '### Lesson Plan',
    '- Warm up: 5-minute recap',
    '- Core activity: pair discussion with examples',
    '- Exit ticket: 3 quick checks',
    '',
    'If you want, I can turn this into a 45-minute timeline.'
].join('\n');

// New conversation template
const DefaultConversation: Conversation = {
    courseId: '123456',
    conversationId: null,
    activeRunId: null,
    title: 'New Conversation',
    messages: [],
    updatedAt: new Date().toISOString()
};

const FakeOldConversations: Conversation = {
    courseId: '123456',
    conversationId: 'UUID',
    activeRunId: null,
    title: 'Old Conversation',
    messages: [
        {
            role: 'user',
            clientMessageId: 'client_UUID',
            content: 'What is the homework for today?',
            createdAt: new Date().toISOString(),
            messageIdLocal: 1,
            conversationId: 'UUID',
            status: 'SENT',
            sendAttemptCount: 1
        },
        {
            role: 'assistant',
            runId: 'RUN_ID_1',
            content:
                'The homework for today is to read chapter 5 and solve the exercises at the end of the chapter.',
            messageIdLocal: 2,
            conversationId: 'UUID',
            status: 'DONE',
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            firstTokenAt: new Date().toISOString(),
            lastEventId: 'EVENT_ID_1'
        }
    ],
    updatedAt: new Date().toISOString()
};

const FakeOldConversationInProgress: Conversation = {
    courseId: '123456',
    conversationId: 'RUNNING_UUID',
    activeRunId: 'RUN_ID_IN_PROGRESS',
    title: 'Old Conversation (In Progress)',
    messages: [
        {
            role: 'user',
            clientMessageId: 'client_RUNNING_UUID',
            content: 'Can you draft a quick lesson plan for me?',
            createdAt: new Date().toISOString(),
            messageIdLocal: 1,
            conversationId: 'RUNNING_UUID',
            status: 'SENT',
            sendAttemptCount: 1
        },
        {
            role: 'assistant',
            runId: 'RUN_ID_IN_PROGRESS',
            content: FakeStreamingFinalReply.slice(0, 72),
            messageIdLocal: 2,
            conversationId: 'RUNNING_UUID',
            status: 'STREAMING',
            startedAt: new Date().toISOString(),
            finishedAt: null,
            firstTokenAt: new Date().toISOString(),
            lastEventId: 'EVENT_ID_PARTIAL'
        }
    ],
    updatedAt: new Date().toISOString()
};

// For simplicity, we are using the same Conversation interface for both old and new conversations.
export interface Conversation {
    courseId: string;
    conversationId: string | null; //null = first time
    activeRunId: string | null; //null = not started
    title: string; // default: 'New Conversation'
    messages: (UserMessage | AssistantMessage)[];
    updatedAt: string; // ISO string
}

// RunStatus represents the lifecycle of an assistant message generation process,
// from the moment it's initiated (PENDING) to its completion (DONE) or failure (ERROR).
export type RunStatus =
    | 'PENDING'
    | 'THINKING'
    | 'STREAMING'
    | 'DONE'
    | 'ERROR'
    | 'CANCELLED'
    | 'STALE';

// UserMsgStatus represents the various states a user message can be in,
// from its initial creation (DRAFT) to its successful sending (SENT) or failure (FAILED).
export type UserMsgStatus =
    | 'DRAFT'
    | 'SENDING'
    | 'SENT'
    | 'FAILED'
    | 'REJECTED_RUN_IN_PROGRESS'
    | 'DUPLICATE';

// UserMessage represents a message sent by the user, including its content,
// status, and metadata such as timestamps and error information if sending fails.
export interface UserMessage {
    clientMessageId: string;
    role: 'user';
    content: string;
    createdAt: string;
    messageIdLocal: number;
    conversationId: string | null; // null = first time
    status: UserMsgStatus;
    sendAttemptCount: number;
    lastError?: AppError | null;
}

// AssistantMessage represents a message generated by the assistant, including its content,
// generation status, and metadata such as timestamps and error information if generation fails.
export interface AssistantMessage {
    role: 'assistant';
    runId: string;
    content: string;
    messageIdLocal: number;
    conversationId: string;
    status: RunStatus;
    startedAt: string | null; // null = PENDING
    finishedAt: string | null; // null = STREAMING or earlier
    firstTokenAt: string | null; //null = THINKING or earlier
    lastEventId: string | null; // null = PENDING
    error?: AppError | null;
}

// AppError is a standardized error format used across the application to represent errors in a consistent way.
type AppError = {
    code?: string; // e.g. RUN_IN_PROGRESS, NETWORK_ERROR
    message: string;
    detail?: unknown; // raw error payload
    httpStatus?: number;
    retryable?: boolean;
};

type InlineToken =
    | { type: 'text'; value: string }
    | { type: 'bold'; value: string }
    | { type: 'code'; value: string };

function nowISO() {
    return new Date().toISOString();
}

function isAssistantMessage(
    message: UserMessage | AssistantMessage
): message is AssistantMessage {
    return message.role === 'assistant';
}

function isRunInProgressStatus(status: RunStatus) {
    return RUN_STEPS_IN_PROGRESS.includes(status);
}

function parseInlineMarkdown(raw: string): InlineToken[] {
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
    const tokens: InlineToken[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ( (match = tokenRegex.exec(raw)) !== null ) {
        if ( match.index > cursor ) {
            tokens.push({type: 'text', value: raw.slice(cursor, match.index)});
        }

        const chunk = match[0];
        if ( chunk.startsWith('**') && chunk.endsWith('**') ) {
            tokens.push({type: 'bold', value: chunk.slice(2, -2)});
        } else if ( chunk.startsWith('`') && chunk.endsWith('`') ) {
            tokens.push({type: 'code', value: chunk.slice(1, -1)});
        } else {
            tokens.push({type: 'text', value: chunk});
        }

        cursor = match.index + chunk.length;
    }

    if ( cursor < raw.length ) {
        tokens.push({type: 'text', value: raw.slice(cursor)});
    }

    return tokens;
}

function buildConversationTitle(userInput: string) {
    const trimmed = userInput.trim();
    return trimmed.length <= 36 ? trimmed : `${trimmed.slice(0, 36)}...`;
}

function getNextMessageLocalId(messages: (UserMessage | AssistantMessage)[]) {
    if ( messages.length === 0 ) return 1;
    return (
        messages.reduce(
            (max, message) => Math.max(max, message.messageIdLocal),
            messages[0].messageIdLocal
        ) + 1
    );
}

function buildMockAssistantReply(userInput: string) {
    return [
        `I received your message: **${userInput.trim()}**`,
        '',
        '### Suggested next steps',
        '- Break the problem into smaller tasks',
        '- Validate one assumption at a time',
        '- Share constraints if you want a more specific answer',
        '',
        'I can also generate a full example solution if you want.'
    ].join('\n');
}

function shouldOpenInProgressConversation(conversationId: string) {
    const lowerCaseConversationId = conversationId.toLowerCase();
    return (
        lowerCaseConversationId.includes('running') ||
        lowerCaseConversationId.includes('active') ||
        lowerCaseConversationId.includes('stream')
    );
}

function hydrateConversationTemplate(params: {
    template: Conversation;
    courseId: string;
    conversationId: string | null;
}) {
    const resolvedConversationId =
        params.conversationId ?? params.template.conversationId;

    return {
        ...params.template,
        courseId: params.courseId,
        conversationId: resolvedConversationId,
        updatedAt: nowISO(),
        messages: params.template.messages.map((message) => {
            if ( message.role === 'user' ) {
                return {
                    ...message,
                    conversationId: resolvedConversationId
                };
            }

            return {
                ...message,
                conversationId: resolvedConversationId ?? 'PENDING_CONVERSATION_ID'
            };
        })
    } as Conversation;
}

function MarkdownAssistantMessage({
                                      content,
                                      textColor
                                  }: {
    content: string;
    textColor: string;
}) {
    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    const codeFontFamily = Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace'
    });

    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let nodeIndex = 0;

    const renderInline = (line: string, keyPrefix: string) =>
        parseInlineMarkdown(line).map((token, index) => {
            if ( token.type === 'bold' ) {
                return (
                    <Text key={`${keyPrefix}-bold-${index}`} style={styles.inlineBold}>
                        {token.value}
                    </Text>
                );
            }

            if ( token.type === 'code' ) {
                return (
                    <Text
                        key={`${keyPrefix}-code-${index}`}
                        style={[
                            styles.inlineCode,
                            {fontFamily: codeFontFamily, color: textColor}
                        ]}
                    >
                        {token.value}
                    </Text>
                );
            }

            return <Text key={`${keyPrefix}-text-${index}`}>{token.value}</Text>;
        });

    const flushCodeBlock = () => {
        if ( codeBuffer.length === 0 ) return;

        blocks.push(
            <Text
                key={`md-code-${nodeIndex}`}
                style={[
                    styles.codeBlock,
                    {color: textColor, fontFamily: codeFontFamily}
                ]}
            >
                {codeBuffer.join('\n')}
            </Text>
        );
        nodeIndex += 1;
        codeBuffer = [];
    };

    lines.forEach((line) => {
        if ( line.trim().startsWith('```') ) {
            if ( inCodeBlock ) {
                inCodeBlock = false;
                flushCodeBlock();
            } else {
                inCodeBlock = true;
            }
            return;
        }

        if ( inCodeBlock ) {
            codeBuffer.push(line);
            return;
        }

        const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
        if ( headingMatch ) {
            const headingLevel = headingMatch[1].length;
            const headingContent = headingMatch[2];
            const headingStyle =
                headingLevel === 1
                    ? styles.markdownHeading1
                    : headingLevel === 2
                        ? styles.markdownHeading2
                        : styles.markdownHeading3;

            blocks.push(
                <Text key={`md-heading-${nodeIndex}`} style={headingStyle}>
                    {renderInline(headingContent, `heading-${nodeIndex}`)}
                </Text>
            );
            nodeIndex += 1;
            return;
        }

        if ( line.startsWith('- ') || line.startsWith('* ') ) {
            const bulletText = line.slice(2);
            blocks.push(
                <View key={`md-bullet-${nodeIndex}`} style={styles.markdownBulletRow}>
                    <Text style={styles.markdownBullet}>•</Text>
                    <Text style={styles.markdownBulletText}>
                        {renderInline(bulletText, `bullet-${nodeIndex}`)}
                    </Text>
                </View>
            );
            nodeIndex += 1;
            return;
        }

        if ( line.trim().length === 0 ) {
            blocks.push(<View key={`md-space-${nodeIndex}`} style={styles.mdSpacer}/>);
            nodeIndex += 1;
            return;
        }

        blocks.push(
            <Text key={`md-paragraph-${nodeIndex}`} style={styles.markdownParagraph}>
                {renderInline(line, `paragraph-${nodeIndex}`)}
            </Text>
        );
        nodeIndex += 1;
    });

    if ( inCodeBlock ) {
        flushCodeBlock();
    }

    return <View style={styles.markdownContainer}>{blocks}</View>;
}

/**
 * ConversationScreen is the main screen for displaying a conversation between a user and an assistant.
 * It retrieves the courseId and conversationId from the URL parameters and displays them.
 * If conversationId is not provided, it defaults to a new conversation.
 * @constructor
 */
export default function ConversationScreen() {
    const {courseId, conversationId} = useLocalSearchParams<{
        courseId: string;
        conversationId?: string;
    }>();
    const navigation = useNavigation();

    const backgroundColor = useColor('background');
    const cardColor = useColor('card');
    const borderColor = useColor('border');
    const textColor = useColor('text');
    const mutedColor = useColor('textMuted');
    const dangerColor = useColor('red');

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [draft, setDraft] = useState('');
    const [loadingConversation, setLoadingConversation] = useState(true);
    const [composerError, setComposerError] = useState<AppError | null>(null);

    const scrollRef = useRef<ScrollView>(null);
    const conversationRef = useRef<Conversation | null>(null);
    const runWarmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const runStreamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const userAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const simulatedRunIdRef = useRef<string | null>(null);
    const runTargetByRunIdRef = useRef<Record<string, string>>({});

    const clearUserAckTimer = useCallback(() => {
        if ( userAckTimerRef.current ) {
            clearTimeout(userAckTimerRef.current);
            userAckTimerRef.current = null;
        }
    }, []);

    const clearRunTimers = useCallback(() => {
        if ( runWarmupTimerRef.current ) {
            clearTimeout(runWarmupTimerRef.current);
            runWarmupTimerRef.current = null;
        }
        if ( runStreamTimerRef.current ) {
            clearInterval(runStreamTimerRef.current);
            runStreamTimerRef.current = null;
        }
        simulatedRunIdRef.current = null;
    }, []);

    const completeAssistantRun = useCallback(
        (runId: string, status: Extract<RunStatus, 'DONE' | 'CANCELLED' | 'ERROR'>) => {
            const eventTime = nowISO();
            setConversation((previousConversation) => {
                if ( !previousConversation ) return previousConversation;

                return {
                    ...previousConversation,
                    activeRunId:
                        previousConversation.activeRunId === runId
                            ? null
                            : previousConversation.activeRunId,
                    updatedAt: eventTime,
                    messages: previousConversation.messages.map((message) => {
                        if ( !isAssistantMessage(message) || message.runId !== runId ) {
                            return message;
                        }

                        const nextMessage: AssistantMessage = {
                            ...message,
                            status,
                            finishedAt: eventTime,
                            lastEventId: `EVENT_${Date.now()}`
                        };

                        if ( status === 'CANCELLED' ) {
                            nextMessage.error = {
                                code: 'CANCELLED_BY_USER',
                                message: 'The assistant run was cancelled by the user.',
                                retryable: true
                            };
                        }

                        return nextMessage;
                    })
                };
            });
        },
        []
    );

    const startRunLifecycle = useCallback(
        (runId: string) => {
            clearRunTimers();

            const activeConversation = conversationRef.current;
            if ( !activeConversation ) return;

            const assistantMessage = activeConversation.messages.find(
                (message): message is AssistantMessage =>
                    isAssistantMessage(message) && message.runId === runId
            );
            if ( !assistantMessage ) return;
            simulatedRunIdRef.current = runId;

            const runTarget =
                runTargetByRunIdRef.current[runId] ?? assistantMessage.content;

            const startStreaming = () => {
                const latestAssistantMessage = conversationRef.current?.messages.find(
                    (message): message is AssistantMessage =>
                        isAssistantMessage(message) && message.runId === runId
                );

                let cursor = latestAssistantMessage?.content.length ?? 0;

                setConversation((previousConversation) => {
                    if ( !previousConversation ) return previousConversation;

                    const eventTime = nowISO();
                    return {
                        ...previousConversation,
                        updatedAt: eventTime,
                        messages: previousConversation.messages.map((message) => {
                            if ( !isAssistantMessage(message) || message.runId !== runId ) {
                                return message;
                            }

                            return {
                                ...message,
                                status: 'STREAMING',
                                startedAt: message.startedAt ?? eventTime
                            };
                        })
                    };
                });

                runStreamTimerRef.current = setInterval(() => {
                    if ( conversationRef.current?.activeRunId !== runId ) {
                        clearRunTimers();
                        return;
                    }

                    if ( cursor >= runTarget.length ) {
                        clearRunTimers();
                        completeAssistantRun(runId, 'DONE');
                        return;
                    }

                    const chunkSize = 2 + Math.floor(Math.random() * 8);
                    const nextCursor = Math.min(runTarget.length, cursor + chunkSize);
                    const chunk = runTarget.slice(cursor, nextCursor);
                    cursor = nextCursor;

                    setConversation((previousConversation) => {
                        if ( !previousConversation ) return previousConversation;
                        const eventTime = nowISO();

                        return {
                            ...previousConversation,
                            updatedAt: eventTime,
                            messages: previousConversation.messages.map((message) => {
                                if ( !isAssistantMessage(message) || message.runId !== runId ) {
                                    return message;
                                }

                                return {
                                    ...message,
                                    status: 'STREAMING',
                                    content: `${message.content}${chunk}`,
                                    firstTokenAt: message.firstTokenAt ?? eventTime,
                                    lastEventId: `EVENT_${Date.now()}`
                                };
                            })
                        };
                    });
                }, 75);
            };

            const startThinking = () => {
                setConversation((previousConversation) => {
                    if ( !previousConversation ) return previousConversation;
                    const eventTime = nowISO();

                    return {
                        ...previousConversation,
                        updatedAt: eventTime,
                        messages: previousConversation.messages.map((message) => {
                            if ( !isAssistantMessage(message) || message.runId !== runId ) {
                                return message;
                            }

                            return {
                                ...message,
                                status: 'THINKING',
                                startedAt: message.startedAt ?? eventTime
                            };
                        })
                    };
                });
            };

            if ( assistantMessage.status === 'PENDING' ) {
                runWarmupTimerRef.current = setTimeout(() => {
                    if ( conversationRef.current?.activeRunId !== runId ) return;
                    startThinking();

                    runWarmupTimerRef.current = setTimeout(() => {
                        if ( conversationRef.current?.activeRunId !== runId ) return;
                        startStreaming();
                    }, 600);
                }, 380);
                return;
            }

            if ( assistantMessage.status === 'THINKING' ) {
                runWarmupTimerRef.current = setTimeout(() => {
                    if ( conversationRef.current?.activeRunId !== runId ) return;
                    startStreaming();
                }, 500);
                return;
            }

            if ( assistantMessage.status === 'STREAMING' ) {
                startStreaming();
            }
        },
        [clearRunTimers, completeAssistantRun]
    );

    // Keep refs synced with React state so timers can always read latest values.
    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);

    // Fetch conversation data when the component mounts or when courseId/conversationId changes.
    useEffect(() => {
        let active = true;
        setLoadingConversation(true);
        setComposerError(null);
        setDraft('');
        clearRunTimers();
        clearUserAckTimer();

        const loadingTimer = setTimeout(() => {
            if ( !active ) return;

            let nextConversation: Conversation;

            if ( conversationId ) {
                const template = shouldOpenInProgressConversation(conversationId)
                    ? FakeOldConversationInProgress
                    : FakeOldConversations;

                nextConversation = hydrateConversationTemplate({
                    template,
                    conversationId,
                    courseId
                });

                if (
                    nextConversation.activeRunId &&
                    shouldOpenInProgressConversation(conversationId)
                ) {
                    runTargetByRunIdRef.current[nextConversation.activeRunId] =
                        FakeStreamingFinalReply;
                }
            } else {
                nextConversation = hydrateConversationTemplate({
                    template: DefaultConversation,
                    conversationId: null,
                    courseId
                });
            }

            setConversation(nextConversation);
            setLoadingConversation(false);
        }, 480);

        return () => {
            active = false;
            clearTimeout(loadingTimer);
        };
    }, [conversationId, courseId, clearRunTimers, clearUserAckTimer]);

    // Resume an unfinished run when opening an old conversation.
    useEffect(() => {
        if ( !conversation?.activeRunId ) return;
        if ( simulatedRunIdRef.current === conversation.activeRunId ) return;

        const activeRunMessage = conversation.messages.find(
            (message): message is AssistantMessage =>
                isAssistantMessage(message) && message.runId === conversation.activeRunId
        );
        if ( !activeRunMessage ) return;
        if ( !isRunInProgressStatus(activeRunMessage.status) ) return;

        startRunLifecycle(conversation.activeRunId);
    }, [conversation, startRunLifecycle]);

    // Update the screen title based on the conversation title.
    useEffect(() => {
        if ( !conversation?.title ) return;
        navigation.setOptions({title: conversation.title});
    }, [conversation?.title, navigation]);

    // Cleanup all timers when the component unmounts.
    useEffect(() => {
        return () => {
            clearRunTimers();
            clearUserAckTimer();
        };
    }, [clearRunTimers, clearUserAckTimer]);

    const runIsInProgress = useMemo(() => {
        if ( !conversation?.activeRunId ) return false;

        const activeRunMessage = conversation.messages.find(
            (message): message is AssistantMessage =>
                isAssistantMessage(message) && message.runId === conversation.activeRunId
        );
        if ( !activeRunMessage ) return false;

        return isRunInProgressStatus(activeRunMessage.status);
    }, [conversation]);

    const sendDisabled =
        !conversation || loadingConversation || draft.trim().length === 0;

    const handleCancelRun = useCallback(() => {
        const runId = conversationRef.current?.activeRunId;
        if ( !runId ) return;

        clearRunTimers();
        completeAssistantRun(runId, 'CANCELLED');
    }, [clearRunTimers, completeAssistantRun]);

    const handleSendMessage = useCallback(() => {
        const trimmedMessage = draft.trim();
        if ( !trimmedMessage ) return;

        const currentConversation = conversationRef.current;
        if ( !currentConversation ) return;

        if ( runIsInProgress ) {
            const now = nowISO();
            const rejectedMessageId = getNextMessageLocalId(currentConversation.messages);
            const rejectedClientMessageId = `client_rejected_${Date.now()}`;
            const rejectionError: AppError = {
                code: 'RUN_IN_PROGRESS',
                message:
                    'Assistant is still replying. Stop current run before sending a new message.',
                retryable: true
            };

            setConversation((previousConversation) => {
                if ( !previousConversation ) return previousConversation;

                const rejectedMessage: UserMessage = {
                    clientMessageId: rejectedClientMessageId,
                    role: 'user',
                    content: trimmedMessage,
                    createdAt: now,
                    messageIdLocal: rejectedMessageId,
                    conversationId: previousConversation.conversationId,
                    status: 'REJECTED_RUN_IN_PROGRESS',
                    sendAttemptCount: 1,
                    lastError: rejectionError
                };

                return {
                    ...previousConversation,
                    updatedAt: now,
                    messages: [...previousConversation.messages, rejectedMessage]
                };
            });
            setComposerError(rejectionError);
            return;
        }

        setComposerError(null);
        setDraft('');

        const now = nowISO();
        const nextConversationId =
            currentConversation.conversationId ?? `conv_${Date.now()}`;
        const nextRunId = `run_${Date.now()}`;
        const nextLocalMessageId = getNextMessageLocalId(currentConversation.messages);
        const clientMessageId = `client_${Date.now()}`;
        runTargetByRunIdRef.current[nextRunId] = buildMockAssistantReply(trimmedMessage);

        setConversation((previousConversation) => {
            if ( !previousConversation ) return previousConversation;

            const userMessage: UserMessage = {
                role: 'user',
                clientMessageId,
                content: trimmedMessage,
                createdAt: now,
                messageIdLocal: nextLocalMessageId,
                conversationId: nextConversationId,
                status: 'SENDING',
                sendAttemptCount: 1
            };

            const assistantMessage: AssistantMessage = {
                role: 'assistant',
                runId: nextRunId,
                content: '',
                messageIdLocal: nextLocalMessageId + 1,
                conversationId: nextConversationId,
                status: 'PENDING',
                startedAt: null,
                finishedAt: null,
                firstTokenAt: null,
                lastEventId: null,
                error: null
            };

            return {
                ...previousConversation,
                conversationId: nextConversationId,
                activeRunId: nextRunId,
                title:
                    previousConversation.title === 'New Conversation'
                        ? buildConversationTitle(trimmedMessage)
                        : previousConversation.title,
                updatedAt: now,
                messages: [...previousConversation.messages, userMessage, assistantMessage]
            };
        });

        // Simulate user message delivery acknowledgement from server.
        clearUserAckTimer();
        userAckTimerRef.current = setTimeout(() => {
            const ackTime = nowISO();
            setConversation((previousConversation) => {
                if ( !previousConversation ) return previousConversation;

                return {
                    ...previousConversation,
                    updatedAt: ackTime,
                    messages: previousConversation.messages.map((message) => {
                        if (
                            message.role !== 'user' ||
                            message.clientMessageId !== clientMessageId ||
                            message.status !== 'SENDING'
                        ) {
                            return message;
                        }

                        return {
                            ...message,
                            status: 'SENT'
                        };
                    })
                };
            });
            userAckTimerRef.current = null;
        }, 220);

    }, [clearUserAckTimer, draft, runIsInProgress]);

    const renderMessage = useCallback(
        (message: UserMessage | AssistantMessage) => {
            if ( message.role === 'user' ) {
                return (
                    <View
                        key={`user-${message.messageIdLocal}`}
                        style={styles.userMessageContainer}
                    >
                        <Card style={styles.userMessageCard}>
                            <Text style={styles.userMessageText}>{message.content}</Text>
                        </Card>
                        {message.status !== 'SENT' ? (
                            <Text variant="caption" style={[styles.userStatus, {color: mutedColor}]}>
                                {USER_MSG_STATUS_LABEL[message.status] ?? message.status}
                            </Text>
                        ) : null}
                        {message.lastError ? (
                            <Text variant="caption" style={[styles.userStatus, {color: dangerColor}]}>
                                {message.lastError.message}
                            </Text>
                        ) : null}
                    </View>
                );
            }

            const assistantText =
                message.content.trim().length > 0
                    ? message.content
                    : message.status === 'PENDING' || message.status === 'THINKING'
                        ? '...'
                        : '';

            return (
                <View
                    key={`assistant-${message.messageIdLocal}`}
                    style={styles.assistantMessageContainer}
                >
                    {ENABLE_ASSISTANT_MARKDOWN ? (
                        <MarkdownAssistantMessage content={assistantText} textColor={textColor}/>
                    ) : (
                        <Text style={styles.assistantMessageText}>{assistantText}</Text>
                    )}

                    {message.status !== 'DONE' ? (
                        <Text variant="caption" style={styles.assistantStatus}>
                            {RUN_STATUS_LABEL[message.status]}
                        </Text>
                    ) : null}

                    {message.error ? (
                        <Text variant="caption" style={[styles.assistantStatus, {color: dangerColor}]}>
                            {message.error.message}
                        </Text>
                    ) : null}
                </View>
            );
        },
        [dangerColor, mutedColor, textColor]
    );

    return (
        <SafeAreaView
            style={[styles.container, {backgroundColor}]}
            edges={['left', 'right', 'bottom']}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({animated: true})
                    }
                    keyboardShouldPersistTaps="handled"
                >
                    {loadingConversation ? (
                        <Text variant="caption" style={styles.placeholderText}>
                            Loading conversation...
                        </Text>
                    ) : conversation && conversation.messages.length > 0 ? (
                        conversation.messages.map(renderMessage)
                    ) : (
                        <Text variant="caption" style={styles.placeholderText}>
                            Start your first message below.
                        </Text>
                    )}
                </ScrollView>

                <View
                    style={[
                        styles.composerSection,
                        {borderTopColor: borderColor, backgroundColor}
                    ]}
                >
                    {composerError ? (
                        <Text variant="caption" style={[styles.composerError, {color: dangerColor}]}>
                            {composerError.message}
                        </Text>
                    ) : null}

                    <View
                        style={[
                            styles.composerBox,
                            {
                                backgroundColor: cardColor,
                                borderColor
                            }
                        ]}
                    >
                        <TextInput
                            value={draft}
                            onChangeText={setDraft}
                            multiline
                            placeholder="輸入訊息..."
                            placeholderTextColor={mutedColor}
                            style={[styles.composerInput, {color: textColor}]}
                            editable={!loadingConversation}
                        />

                        <Button
                            size="sm"
                            style={styles.primaryActionButton}
                            variant={runIsInProgress ? 'destructive' : 'default'}
                            onPress={runIsInProgress ? handleCancelRun : handleSendMessage}
                            disabled={runIsInProgress ? false : sendDisabled}
                        >
                            {runIsInProgress ? '停止' : '傳送'}
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    messagesScroll: {
        flex: 1
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
        gap: 12
    },
    placeholderText: {
        textAlign: 'center',
        marginTop: 24
    },
    userMessageContainer: {
        alignItems: 'flex-end',
        gap: 4
    },
    userMessageCard: {
        alignSelf: 'flex-end',
        width: 'auto',
        maxWidth: '86%',
        paddingVertical: 10,
        paddingHorizontal: 14
    },
    userMessageText: {
        lineHeight: 22
    },
    userStatus: {
        marginRight: 4,
        textAlign: 'right'
    },
    assistantMessageContainer: {
        alignItems: 'flex-start',
        gap: 4
    },
    assistantMessageText: {
        lineHeight: 22
    },
    assistantStatus: {
        marginTop: 2
    },
    composerSection: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12
    },
    composerError: {
        marginBottom: 8
    },
    composerBox: {
        borderWidth: 1,
        borderRadius: 20,
        paddingLeft: 12,
        paddingRight: 8,
        paddingTop: 8,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8
    },
    composerInput: {
        flex: 1,
        minHeight: 22,
        maxHeight: 120,
        fontSize: 16,
        lineHeight: 22,
        paddingTop: 0,
        paddingBottom: 0
    },
    primaryActionButton: {
        height: 38,
        paddingHorizontal: 14
    },
    markdownContainer: {
        width: '100%',
        gap: 6
    },
    markdownHeading1: {
        fontSize: 22,
        lineHeight: 30,
        fontWeight: '700'
    },
    markdownHeading2: {
        fontSize: 19,
        lineHeight: 27,
        fontWeight: '700'
    },
    markdownHeading3: {
        fontSize: 17,
        lineHeight: 24,
        fontWeight: '700'
    },
    markdownParagraph: {
        lineHeight: 22
    },
    markdownBulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    markdownBullet: {
        lineHeight: 22,
        marginRight: 6
    },
    markdownBulletText: {
        flex: 1,
        lineHeight: 22
    },
    inlineBold: {
        fontWeight: '700'
    },
    inlineCode: {
        borderRadius: 4,
        backgroundColor: 'rgba(120,120,128,0.18)',
        paddingHorizontal: 4
    },
    codeBlock: {
        borderRadius: 8,
        backgroundColor: 'rgba(120,120,128,0.16)',
        lineHeight: 20,
        paddingHorizontal: 10,
        paddingVertical: 8
    },
    mdSpacer: {
        height: 4
    }
});
