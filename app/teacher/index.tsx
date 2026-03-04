import { useToast } from "@/components/ui/toast";
import { Co2CardGauge } from '@/components/weather/co2-card-gauge';
import { HumidityCard } from '@/components/weather/humidity-card';
import { LightCard } from '@/components/weather/light-card';
import { TemperatureCard } from '@/components/weather/temperature-card';
import { Col, Row } from '@/components/ui/grid';
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const FakeCourse: CourseDataTeacher = {title: 'Fake Course', courseId: '123456'};
const FakeClassRoom: ClassRoomDataTeacher = {
    co2: 500,
    temperature: 22,
    humidity: 80,
    light: 500
};

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

function LLMBottomSheet() {
    const {courseId} = useLocalSearchParams<{ courseId: string }>();
    const bottomSheetBackgroundColor = useColor('card');
    const bottomSheetHandleColor = useColor('muted');
    const [courseData, setCourseData] = useState<CourseDataTeacher>(defaultCourseData);

    // Fetch course details
    useEffect(() => {
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setCourseData({...FakeCourse, courseId});
        }, 1000);
    }, [courseId]);

    return (
        <BottomSheet
            snapPoints={[100, '50%', '95%']}
            backgroundStyle={{backgroundColor: bottomSheetBackgroundColor}}
            handleIndicatorStyle={{backgroundColor: bottomSheetHandleColor}}
        >
            <BottomSheetView style={styles.contentContainer}>
                <View style={styles.infoContainer}>
                    <View>
                        <Text variant={'subtitle'}>Course: {courseData.title}</Text>
                    </View>
                    <View>
                        <Text variant={'caption'}>ID: {courseId}</Text>
                    </View>
                </View>
                <Separator style={{marginBottom: 10}}/>
                <View>
                    <Text variant={'body'}>This is the content of the bottom sheet. You can put any content here,
                        such as course details, student lists, or settings.</Text>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
}

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
        height: 100 - 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    }
});
