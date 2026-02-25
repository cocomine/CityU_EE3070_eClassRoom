import {SafeAreaView} from "react-native-safe-area-context";
import {View} from "@/components/ui/view";
import {Text} from "@/components/ui/text";
import {StyleSheet} from "react-native";
import {Stack, useLocalSearchParams} from "expo-router";

export default function Student() {
    const {courseId} = useLocalSearchParams<{courseId: string}>();
    console.log(courseId)

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>Student Mode</Text>
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