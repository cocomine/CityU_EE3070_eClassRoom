import {View} from "@/components/ui/view";
import {Text} from "@/components/ui/text";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button} from "@/components/ui/button";
import {StyleSheet, TouchableOpacity} from "react-native";
import {BottomSheet, useBottomSheet} from '@/components/ui/bottom-sheet';
import {InputOTP} from "@/components/ui/input-otp";
import {useCallback, useMemo, useState} from "react";
import {useRouter} from "expo-router";

const FakeCourse = [
    {id: '123456', title: 'EE1000'},
    {id: '123457', title: 'EE1001'},
    {id: '123458', title: 'EE1002'},
    {id: '123459', title: 'EE1003'},
    {id: '123460', title: 'EE1004'},
    {id: '123461', title: 'EE1005'},
    {id: '123462', title: 'EE1006'},
];

export default function Root() {
    const studentBottomSheet = useBottomSheet();
    const teacherBottomSheet = useBottomSheet();

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'}>Chose your role</Text>
            </View>
            <View style={styles.buttonContainer}>
                <Button onPress={studentBottomSheet.open}>I&#39;m student</Button>
                <Button onPress={teacherBottomSheet.open}>I&#39;m teacher</Button>
            </View>
            <StudentBottomSheet isVisible={studentBottomSheet.isVisible} onClose={studentBottomSheet.close}/>
            <TeacherBottomSheet isVisible={teacherBottomSheet.isVisible} onClose={teacherBottomSheet.close}/>
        </SafeAreaView>
    );
}

function TeacherBottomSheet({isVisible, onClose}: { isVisible: boolean, onClose: () => void }) {
    const router = useRouter();

    const onClick = useCallback((courseId: string) => {
        console.log('Selected:', courseId)
        router.navigate({pathname: '/teacher', params: {courseId}})
        onClose();
    }, [onClose, router])

    const renderItem = useMemo(() => {
        return FakeCourse.map((item) => (
            <TouchableOpacity
                key={item.id}
                style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.1)',
                }}
                onPress={() => onClick(item.id)}
            >
                <Text variant='body' style={{fontWeight: '600'}}>
                    {item.title}
                </Text>
                <Text variant='caption' style={{marginTop: 2}}>
                    {item.id}
                </Text>
            </TouchableOpacity>
        ));
    }, [onClick]);

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title='Chose your course'
            snapPoints={[0.6, 0.9]}
        >
            <View style={{paddingBottom: 100}}>
                <Button>or Create new course</Button>
                <View>
                    {renderItem}
                </View>
            </View>

        </BottomSheet>
    )
}

function StudentBottomSheet({isVisible, onClose}: { isVisible: boolean, onClose: () => void }) {
    const [courseId, setCourseId] = useState('');
    const router = useRouter();

    const onComplete = useCallback<(value: string) => void>((value) => {
        router.navigate({pathname: '/student', params: {courseId: value}})
        setCourseId('')
        onClose();
    }, [onClose, router])

    return (
        <BottomSheet
            isVisible={isVisible}
            onClose={onClose}
            title='Enter course code'
            snapPoints={[0.3]}
        >
            <View>
                <InputOTP
                    length={6}
                    value={courseId}
                    onChangeText={setCourseId}
                    onComplete={onComplete}
                />
            </View>
        </BottomSheet>
    )
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