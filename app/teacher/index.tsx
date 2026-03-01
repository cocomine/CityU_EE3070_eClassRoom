import { HumidityCard } from '@/components/weather/humidity-card';
import { TemperatureCard } from '@/components/weather/temperature-card';
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const FakeCourse: CourseDataTeacher = {title: 'Fake Course', courseId: '123456'};
const FakeClassRoom: ClassRoomDataTeacher = {
    co2: 400,
    temperature: 22,
    humidity: 50,
    light: 300
};

export interface CourseDataTeacher {
    title: string;
    courseId: string;
}

export interface ClassRoomDataTeacher {
    co2: number;
    temperature: number;
    humidity: number;
    light: number;
}

export default function Teacher() {
    const [classRoomData, setClassRoomData] = useState<ClassRoomDataTeacher | null>(null);

    // Fetch classroom data
    useEffect(() => {
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setClassRoomData({...FakeClassRoom});
        }, 1000);
    }, []);

    const humidityValue = classRoomData?.humidity ?? 0;
    const humidityNote = classRoomData ? undefined : '資料載入中...';
    const temperatureValue = classRoomData?.temperature ?? 0;

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.screen}>
                <View style={styles.cardGrid}>
                    <View style={{flex:1/5}}>
                        <HumidityCard value={humidityValue} note={humidityNote} />
                    </View>
                    <View style={{flex:1/4}}>
                        <TemperatureCard
                            current={temperatureValue}
                            min={temperatureValue - 3}
                            max={temperatureValue + 4}
                            humidity={humidityValue}
                        />
                    </View>
                </View>
            </SafeAreaView>
            <LLMBottomSheet/>
        </GestureHandlerRootView>
    );
}

function LLMBottomSheet() {
    const {courseId} = useLocalSearchParams<{ courseId: string }>();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const bottomSheetBackgroundColor = useColor('card');
    const bottomSheetHandleColor = useColor('muted');
    const [courseData, setCourseData] = useState<CourseDataTeacher | null>(null);

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
            ref={bottomSheetRef}
            snapPoints={[100, '50%', '95%']}
            backgroundStyle={{backgroundColor: bottomSheetBackgroundColor}}
            handleIndicatorStyle={{backgroundColor: bottomSheetHandleColor}}
        >
            <BottomSheetView style={styles.contentContainer}>
                <View style={styles.infoContainer}>
                    <View>
                        <Text variant={'subtitle'}>Course: {courseData?.title}</Text>
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
        gap: 16,
        flexDirection: 'row'
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
