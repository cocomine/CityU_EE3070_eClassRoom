import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";

export default function ConversationScreen() {
    const {courseId, conversationId} = useLocalSearchParams<{
        courseId?: string | string[];
        conversationId?: string | string[];
    }>();

    const resolvedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;
    const resolvedConversationId = Array.isArray(conversationId) ? conversationId[0] : conversationId;

    return (
        <Text>
            {resolvedCourseId ?? 'unknown'} {resolvedConversationId ?? 'new'}
        </Text>
    );
}
