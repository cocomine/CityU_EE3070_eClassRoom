import {View} from "@/components/ui/view";
import {Text} from "@/components/ui/text";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button} from "@/components/ui/button";
import {FlatList, StyleSheet, TouchableOpacity} from "react-native";
import {Link} from "@/components/ui/link";
import {BottomSheet, useBottomSheet} from '@/components/ui/bottom-sheet';
import {Input} from "@/components/ui/input";
import {InputOTP} from "@/components/ui/input-otp";
import {useState} from "react";
import {useRouter} from "expo-router";

const items = [
    { id: '1', title: 'Photos', subtitle: '1,234 items' },
    { id: '2', title: 'Videos', subtitle: '56 items' },
    { id: '3', title: 'Documents', subtitle: '89 items' },
    { id: '4', title: 'Audio', subtitle: '23 items' },
    { id: '5', title: 'Downloads', subtitle: '12 items' },
    { id: '6', title: 'Archives', subtitle: '4 items' },
    { id: '7', title: 'Archives', subtitle: '4 items' },
    { id: '8', title: 'Archives', subtitle: '4 items' },
    { id: '9', title: 'Archives', subtitle: '4 items' },
    { id: '10', title: 'Archives', subtitle: '4 items' },
    { id: '11', title: 'Archives', subtitle: '4 items' },
    { id: '12', title: 'Archives', subtitle: '4 items' },
    { id: '13', title: 'Archives', subtitle: '4 items' },
    { id: '14', title: 'Archives', subtitle: '4 items' },
];

export default function Index() {
    const studentBottomSheet = useBottomSheet();
    const teacherBottomSheet = useBottomSheet();
    const router = useRouter();
    const [otp, setOtp] = useState('');

    const renderItem = () => {
        return items.map((item) => (
            <TouchableOpacity
                key={item.id}
                style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.1)',
                }}
                onPress={() => {
                    console.log('Selected:', item.id)
                    router.replace({pathname: '/teacher', params: { courseId: item.id }})
                }}
            >
                <Text variant='body' style={{fontWeight: '600'}}>
                    {item.title}
                </Text>
                <Text variant='caption' style={{marginTop: 2}}>
                    {item.subtitle}
                </Text>
            </TouchableOpacity>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>Chose your role</Text>
            </View>
            <View style={styles.buttonContainer}>
                <Button onPress={studentBottomSheet.open}>I&#39;m student</Button>
                <Button onPress={teacherBottomSheet.open}>I&#39;m teacher</Button>
            </View>
            <BottomSheet
                isVisible={studentBottomSheet.isVisible}
                onClose={studentBottomSheet.close}
                title='Enter course code'
                snapPoints={[0.3]}
            >
                <View>
                    <InputOTP
                        length={6}
                        value={otp}
                        onChangeText={setOtp}
                        onComplete={(value) => {
                            console.log('OTP Complete:', value)
                            router.replace({pathname: '/student', params: { courseId: value }})
                        }}
                    />
                </View>
            </BottomSheet>
            <BottomSheet
                isVisible={teacherBottomSheet.isVisible}
                onClose={teacherBottomSheet.close}
                title='Chose your course'
                snapPoints={[0.6, 0.9]}
            >
                <View style={{ paddingBottom: 100 }}>
                    <Button>or Create new course</Button>
                    <View>
                        {renderItem()}
                    </View>
                </View>

            </BottomSheet>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
});