import {SafeAreaView} from "react-native-safe-area-context";
import {View} from "@/components/ui/view";
import {Text} from "@/components/ui/text";
import {StyleSheet} from "react-native";
import {Stack, useLocalSearchParams} from "expo-router";
import {useEffect, useState} from "react";

const FakeCourse = {title: 'EE1000'};

type CourseDetails = {
    title: string;
}

export default function Student() {
    const {courseId} = useLocalSearchParams<{courseId: string}>();
    const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

    useEffect(() => {
        //TODO: fetch course title from backend

        // Simulate fetching course details from backend with a delay
        setTimeout(() => {
            setCourseDetails({title: `Course Title for ${courseId}`});
        }, 1000);
    }, [courseId])

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>{courseDetails?.title}</Text>
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