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

const FakeCourse: CourseDataTeacher = {title: 'Fake Course'};
const FakeClassRoom: ClassRoomDataTeacher = {
    co2: 400,
    temperature: 22,
    humidity: 50,
    noises: 30,
    light: 300
};

export interface CourseDataTeacher {
    title: string;
}

export interface ClassRoomDataTeacher {
    co2: number;
    temperature: number;
    humidity: number;
    noises: number;
    light: number;
}

export default function Teacher() {
    const {courseId} = useLocalSearchParams<{ courseId: string }>();
    const [courseData, setCourseData] = useState<CourseDataTeacher | null>(null);
    const [classRoomData, setClassRoomData] = useState<ClassRoomDataTeacher | null>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const bottomSheetBackgroundColor = useColor('card');
    const bottomSheetHandleColor = useColor('muted');

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    useEffect(() => {
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setCourseData({...FakeCourse});
            setClassRoomData({...FakeClassRoom});
        }, 1000);
    }, [courseId]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <View>
                    <Text variant={'title'}>Teacher Mode</Text>
                    <Text variant={'subtitle'}>{courseId}</Text>
                </View>
            </SafeAreaView>
            <BottomSheet
                ref={bottomSheetRef}
                onChange={handleSheetChanges}
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
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
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