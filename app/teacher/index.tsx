import { FileCard } from "@/components/FileCard";
import { Col, Row } from '@/components/ui/grid';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { View } from "@/components/ui/view";
import { Co2CardGauge } from '@/components/weather/co2-card-gauge';
import { HumidityCard } from '@/components/weather/humidity-card';
import { LightCard } from '@/components/weather/light-card';
import { TemperatureCard } from '@/components/weather/temperature-card';
import { useColor } from "@/hooks/useColor";
import { FILE_EXTENSIONS } from "@/utils/file-meta";
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const FakeCourse: CourseDataTeacher = {title: 'Fake Course', courseId: '123456'};
const FakeClassRoom: ClassRoomDataTeacher = {
    co2: 500,
    temperature: 22,
    humidity: 80,
    light: 500
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

// Uploaded file data structure
export interface UploadedFile {
    id: string;
    name: string;
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
}

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
    light: null
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
            <SafeAreaView style={styles.screen}>
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
    const bottomSheetBackgroundColor = useColor('card');
    const bottomSheetHandleColor = useColor('muted');
    const [courseData, setCourseData] = useState<CourseDataTeacher>(defaultCourseData);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | null>(null);

    const deleteFile = useCallback((id: string) => {
        console.log("Deleting file with id: ", id);
        setUploadedFiles(prevState => prevState ? prevState.filter(file => file.id !== id) : null);
    }, []);

    // Fetch course details
    useEffect(() => {
        //TODO: fetch course title from backend
        //TODO: fetch uploaded files for the course from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setCourseData({...FakeCourse, courseId});
            setUploadedFiles([...FakeUploadedFiles]);
        }, 1000);
    }, [courseId]);

    return (
        <BottomSheet
            snapPoints={[80, '60%', '100%']}
            backgroundStyle={{backgroundColor: bottomSheetBackgroundColor}}
            handleIndicatorStyle={{backgroundColor: bottomSheetHandleColor}}
            index={0}
            enableDynamicSizing={false}
            enableContentPanningGesture={false}
        >
            <BottomSheetView style={styles.contentContainer}>
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
                <Separator style={{marginVertical: 15}}/>
                <BottomSheetScrollView
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => {}}/>
                    }
                    nestedScrollEnabled={true}
                >
                    <View>
                        <Text variant={'title'}>Uploaded files</Text>
                        <View style={{marginTop: 10}}>
                            {uploadedFiles === null ? (
                                <Skeleton width={'100%'} height={60}/>
                            ) : (
                                <UploadedFiles files={uploadedFiles} onDelete={deleteFile}/>
                            )}
                        </View>
                    </View>
                    <Separator style={{marginVertical: 15}}/>
                </BottomSheetScrollView>
            </BottomSheetView>
        </BottomSheet>
    );
}

/**
 * Component to display a horizontal list of uploaded files for the selected course.
 * @constructor
 */
function UploadedFiles(props:{ files: UploadedFile[], onDelete?: (id: string) => void }) {
    const [files, setFiles] = useState<UploadedFile[]>(props.files);

    // Update local state when props.files changes
    useEffect(() => {
        setFiles(props.files);
    }, [props.files]);

    return (
        <FlatList
            style={{paddingBottom: 8}}
            data={files}
            horizontal={true}
            renderItem={({item}) =>
                <FileCard filename={item.name} onClick={() => props.onDelete?.(item.id)}/>}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text variant={'caption'}>No files uploaded yet.</Text>}
            ItemSeparatorComponent={props => <View style={{width: 10}} {...props}/>}
        />
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    screen: {
        flex: 1,
        paddingHorizontal: 20
    },
    cardGrid: {
        paddingBottom: 100
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 36
    },
    infoContainer: {
        height: 44,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    uploadedFilesContainer: {}
});
