import { StudentStatusCard } from '@/components/student-status-card';
import { Button } from "@/components/ui/button";
import { Col, Row } from '@/components/ui/grid';
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { View } from "@/components/ui/view";
import { UploadedFile, UploadFiles, UploadFilesHandle } from "@/components/UploadFiles";
import { Co2CardGauge } from '@/components/weather/co2-card-gauge';
import { HumidityCard } from '@/components/weather/humidity-card';
import { LightCard } from '@/components/weather/light-card';
import { TemperatureCard } from '@/components/weather/temperature-card';
import { useColor } from "@/hooks/useColor";
import { FILE_EXTENSIONS } from "@/utils/file-meta";
import { wait } from "@/utils/wait";
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, MessageCirclePlus, Upload } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data for testing and development purposes
const FakeCourse: CourseDataTeacher = {title: 'Fake Course', courseId: '123456'};
const FakeClassRoom: ClassRoomDataTeacher = {
    co2: 500,
    temperature: 22,
    humidity: 80,
    light: 500,
    studentStatus: [{
        label: 1, status: 'good'
    }, {
        label: 2, status: 'attention'
    }, ...(new Array(28).fill(0).map((_, i) => ({
        label: i + 2, status: null
    })))]

};
const FakeUploadedFiles: UploadedFile[] = [
    ...FILE_EXTENSIONS.map((ext, index) => ({
        id: String(index + 1),
        name: `Sample.${ext}`
    })),
    {
        id: String(FILE_EXTENSIONS.length + 1),
        name: 'README'
    },
    {
        id: String(FILE_EXTENSIONS.length + 2),
        name: 'unknown.weirdext'
    }
];
const FakeConversations: Conversation[] = [
    {
        id: '1',
        title: 'Conversation 1',
        questionPreview: 'What is the air quality like today?'
    },
    {
        id: '2',
        title: 'Conversation 2',
        questionPreview: 'How can I improve student engagement?'
    },
    {
        id: '3',
        title: 'Conversation 3',
        questionPreview: 'What are some good teaching strategies for this topic?'
    },
    {
        id: '4',
        title: 'Conversation 4',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }, {
        id: '5',
        title: 'Conversation 5',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }, {
        id: '6',
        title: 'Conversation 6',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }, {
        id: '7',
        title: 'Conversation 7',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }, {
        id: '8',
        title: 'Conversation 8',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }, {
        id: '9',
        title: 'Conversation 9',
        questionPreview: 'What are some good teaching strategies for this topic?'
    }
];

// Data structure for conversations displayed in the bottom sheet
export interface Conversation {
    id: string;
    title: string;
    questionPreview: string;
}

// Teacher selected course data structure
export interface CourseDataTeacher {
    title: string | null;
    courseId: string | null;
}

// Classroom environmental data structure
export interface ClassRoomDataTeacher {
    co2: number | null;
    temperature: number | null;
    humidity: number | null;
    light: number | null;
    studentStatus: StudentStatus[] | null;
}

// Student status data structure for each student slot in the classroom
export type StudentStatus = {
    label: number | string,
    status: null | 'good' | 'attention'
};

// Weather data structure from data.weather.gov.hk API
export interface WeatherGovData {
    maxTemperature: number | null;
    minTemperature: number | null;
}

// Default values for course and classroom data while loading
const defaultCourseData: CourseDataTeacher = {
    title: null,
    courseId: null
};

// Default values for classroom data while loading
const defaultClassRoomData: ClassRoomDataTeacher = {
    co2: null,
    temperature: null,
    humidity: null,
    light: null,
    studentStatus: null
};

// Default values for weather data while loading
const defaultWeatherGovData: WeatherGovData = {
    maxTemperature: null,
    minTemperature: null
};

/**
 * Teacher screen component that displays classroom environmental data and course details.
 * Fetches data from backend and weather API, and handles loading states with skeletons.
 * @constructor
 */
export default function Teacher() {
    const [classRoomData, setClassRoomData] = useState<ClassRoomDataTeacher>(defaultClassRoomData);
    const [weatherGovData, setWeatherGovData] = useState<WeatherGovData>(defaultWeatherGovData);
    const {toast} = useToast();
    const {width, height} = useWindowDimensions();
    const isLandscape = width > height;
    const span = isLandscape ? 4 : 6;

    // Fetch classroom data
    useEffect(() => {
        const controller = new AbortController();
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setClassRoomData({...FakeClassRoom});
        }, 1000);

        // Fetch weather data from data.weather.gov.hk API
        fetch('https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc', {
            signal: controller.signal
        }).then(async res => {
            // Check if response is OK before parsing JSON
            if ( res.ok ) {
                const data = await res.json();
                setWeatherGovData({
                    maxTemperature: data?.weatherForecast[0]?.forecastMaxtemp,
                    minTemperature: data?.weatherForecast[0]?.forecastMintemp
                });
                return;
            }

            // Handle non-OK responses
            toast({
                title: 'Failed to fetch weather data',
                description: `Status: ${res.status} ${res.statusText}`,
                variant: 'error'
            });
        }).catch(err => {
            if ( err.name === 'AbortError' ) {
                console.log('Fetch aborted');
            } else {
                toast({
                    title: 'Error fetching weather data',
                    description: err.message,
                    variant: 'error'
                });
                console.error('Fetch error:', err);
            }
        });

        return () => controller.abort();
    }, [toast]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ScrollView>
                    <Row gutter={16} style={styles.cardGrid}>
                        <Col span={span}>
                            <HumidityCard value={classRoomData.humidity}/>
                        </Col>
                        <Col span={span}>
                            <TemperatureCard
                                current={classRoomData.temperature}
                                min={weatherGovData.minTemperature}
                                max={weatherGovData.maxTemperature}
                                humidity={classRoomData.humidity}
                            />
                        </Col>
                        <Col span={span}>
                            <LightCard value={classRoomData.light} max={1000}/>
                        </Col>
                        <Col span={span}>
                            <Co2CardGauge value={classRoomData.co2} min={350} max={2000}/>
                        </Col>
                        <Col span={span * 2}>
                            <StudentStatusCard slots={classRoomData.studentStatus}/>
                        </Col>
                    </Row>
                </ScrollView>
            </SafeAreaView>
            <LLMBottomSheet/>
        </GestureHandlerRootView>
    );
}

/** Bottom sheet component that displays course details and uploaded files for the selected course.
 * Fetches data from backend and handles loading states with skeletons.
 * @constructor
 */
function LLMBottomSheet() {
    const {courseId} = useLocalSearchParams<{ courseId: string }>();
    const router = useRouter();
    const bottomSheetBackgroundColor = useColor('card');
    const bottomSheetHandleColor = useColor('muted');
    const conversationBorderColor = useColor('border');
    const conversationAccentColor = useColor('primary');
    const conversationChevronColor = useColor('muted');
    const [courseData, setCourseData] = useState<CourseDataTeacher>(defaultCourseData);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | null>(null);
    const [conversations, setConversations] = useState<Conversation[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const headerHeight = useHeaderHeight();
    const ref = useRef<UploadFilesHandle>(null);

    // Fetching course details and uploaded files from backend
    const loader = useCallback(async () => {
        setRefreshing(true);

        await wait(1000);
        //TODO: fetch course title from backend
        setCourseData({...FakeCourse, courseId});

        // TODO: fetch uploaded files for the course from backend
        setUploadedFiles(prevState => {
            if ( prevState === null ) return [...FakeUploadedFiles];

            // Merge existing uploaded files with fetched files, avoiding duplicates.
            const existingIds = new Set(prevState.map(item => item.id));
            const merged = [...prevState];
            FakeUploadedFiles.forEach(item => {
                if ( !existingIds.has(item.id) ) merged.push(item);
            });
            return merged;
        });

        // TODO: fetch conversations for the course from backend
        setConversations([...FakeConversations]);

        setRefreshing(false);
    }, [courseId]);

    // Load course details and uploaded files when component mounts or courseId changes
    useEffect(() => {
        loader().then();
    }, [loader]);

    // Handler for creating a new conversation, navigating to the conversation creation screen
    const handleNewConversation = useCallback(() => {
        if ( !courseId ) return;
        router.push({
            pathname: '/[courseId]/teacher/conversation',
            params: {courseId}
        });
    }, [courseId, router]);

    // Handler for opening an existing conversation, navigating to the conversation details screen
    const handleOpenConversation = useCallback((conversationId: string) => {
        if ( !courseId ) return;
        router.push({
            pathname: '/[courseId]/teacher/conversation/[conversationId]',
            params: {courseId, conversationId}
        });
    }, [courseId, router]);

    // Render function for each conversation item in the bottom sheet list
    const renderConversationItem = useCallback(({item}: { item: Conversation }) => {
        return (
            <TouchableOpacity
                style={styles.conversationRow}
                onPress={() => handleOpenConversation(item.id)}
            >
                <View style={[styles.conversationAccent, {backgroundColor: conversationAccentColor}]}/>
                <View style={styles.conversationText}>
                    <Text variant={'body'} style={styles.conversationTitle}>
                        {item.title}
                    </Text>
                    <Text variant={'caption'} numberOfLines={2}>
                        {item.questionPreview}
                    </Text>
                </View>
                <Icon name={ChevronRight} size={16} color={conversationChevronColor}/>
            </TouchableOpacity>
        );
    }, [conversationAccentColor, conversationChevronColor, handleOpenConversation]);

    // Render function for the header of the bottom sheet list, including uploaded files section and conversations
    // section
    const renderListHeader = useMemo(() => {
        return (
            <View>
                {/* Uploaded files section */}
                <View style={styles.sectionTitleContainer}>
                    <Text variant={'title'}>Uploaded files</Text>
                    <Button variant={'outline'} size={'sm'} onPress={() => ref.current?.open()}>
                        <Icon name={Upload} size={14}/>
                        <Text style={{fontSize: 14}}>Select files to upload</Text>
                    </Button>
                </View>
                <UploadFiles data={uploadedFiles} ref={ref}/>
                <Separator style={{marginVertical: 15}}/>
                {/* Conversations section */}
                <View style={[styles.sectionTitleContainer, {marginBottom: 10}]}>
                    <Text variant={'title'}>Conversations</Text>
                    <Button variant={'outline'} size={'sm'} onPress={handleNewConversation}>
                        <Icon name={MessageCirclePlus} size={14}/>
                        <Text style={{fontSize: 14}}>New Conversation</Text>
                    </Button>
                </View>
            </View>
        );
    }, [handleNewConversation, uploadedFiles]);

    // Render function for when there are no conversations, showing either a loading state or an empty state message
    const renderConversationEmpty = useMemo(() => {
        if ( conversations === null ) {
            return (
                <View style={styles.conversationLoading}>
                    <Skeleton width={'100%'} height={68}/>
                    <View style={styles.conversationLoadingSpacer}/>
                    <Skeleton width={'100%'} height={68}/>
                </View>
            );
        }

        return (
            <Text variant={'caption'} style={styles.conversationEmpty}>
                No conversations yet.
            </Text>
        );
    }, [conversations]);

    // Render function for the backdrop of the bottom sheet, allowing touch through and setting opacity
    const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
        return <BottomSheetBackdrop
            {...props}
            pressBehavior={'close'}
            enableTouchThrough={true}
            appearsOnIndex={2}
            disappearsOnIndex={1}
            opacity={0.8}
        />;
    }, []);

    return (
        <BottomSheet
            snapPoints={[80, '60%', '100%']}
            backgroundStyle={{backgroundColor: bottomSheetBackgroundColor}}
            handleIndicatorStyle={{backgroundColor: bottomSheetHandleColor}}
            index={0}
            topInset={headerHeight}
            enableDynamicSizing={false}
            backdropComponent={renderBackdrop}
        >
            {/* Header section of the bottom sheet showing course title and ID, with loading skeletons if data is not yet available */}
            <View style={styles.headerContainer}>
                <View style={styles.infoContainer}>
                    <View>
                        {courseData.title ? (
                            <Text variant={'subtitle'}>Course: {courseData.title}</Text>
                        ) : (
                            <Skeleton width={200} height={24}/>
                        )}
                    </View>
                    <View>
                        <Text variant={'caption'}>ID: {courseId}</Text>
                    </View>
                </View>
            </View>
            <Separator style={{marginTop: 15}}/>
            <FlatList
                data={conversations ?? []}
                renderItem={renderConversationItem}
                keyExtractor={(item: Conversation) => item.id}
                onRefresh={loader}
                refreshing={refreshing}
                ItemSeparatorComponent={() => (
                    <View style={[styles.conversationItemSeparator, {backgroundColor: conversationBorderColor}]}/>
                )}
                ListEmptyComponent={renderConversationEmpty}
                ListHeaderComponent={renderListHeader}
                contentContainerStyle={styles.listContentContainer}
                style={styles.list}
            />
        </BottomSheet>
    );
}


const styles = StyleSheet.create({
    uploadMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    container: {
        flex: 1
    },
    cardGrid: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 100
    },
    sheetContainer: {
        flex: 1
    },
    headerContainer: {
        paddingHorizontal: 36,
        height: 41
    },
    list: {
        flex: 1
    },
    listContentContainer: {
        paddingHorizontal: 36,
        paddingTop: 10,
        paddingBottom: 20
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        justifyContent: 'space-between'
    },
    conversationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 12
    },
    conversationRowPressed: {
        opacity: 0.6
    },
    conversationAccent: {
        width: 3,
        height: 36,
        borderRadius: 2
    },
    conversationText: {
        flex: 1,
        gap: 4
    },
    conversationTitle: {
        fontWeight: '600'
    },
    conversationItemSeparator: {
        height: StyleSheet.hairlineWidth,
        opacity: 0.6
    },
    conversationLoading: {
        marginTop: 10
    },
    conversationLoadingSpacer: {
        height: 10
    },
    conversationEmpty: {
        marginTop: 6
    }
});
