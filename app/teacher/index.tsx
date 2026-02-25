import {SafeAreaView} from "react-native-safe-area-context";
import {View} from "@/components/ui/view";
import {Text} from "@/components/ui/text";
import {Link} from "@/components/ui/link";
import {Button} from "@/components/ui/button";
import {StyleSheet} from "react-native";
import {useLocalSearchParams} from "expo-router";

export default function Teacher() {
    const {courseId} = useLocalSearchParams<{courseId: string}>();
    console.log(courseId)

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>Teacher Mode</Text>
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