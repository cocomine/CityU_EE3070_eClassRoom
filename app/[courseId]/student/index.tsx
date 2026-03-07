import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FakeCourse = {title: 'Fake Course'};

export type CourseDataStudent = {
    title: string;
}

export default function Student() {
    const {courseId} = useLocalSearchParams<{courseId: string}>();
    const [courseData, setCourseData] = useState<CourseDataStudent | null>(null);

    useEffect(() => {
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setCourseData({title: `Course Title for ${FakeCourse.title}`});
        }, 1000);
    }, [courseId])

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>{courseData?.title}</Text>
                <Text variant={'subtitle'}>{courseId}</Text>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})