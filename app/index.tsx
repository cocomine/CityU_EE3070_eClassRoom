import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { StyleSheet, TextInputProps, TextInputSubmitEditingEvent, TouchableOpacity } from "react-native";
import { BottomSheet, useBottomSheet } from '@/components/ui/bottom-sheet';
import { InputOTP, InputOTPProps } from "@/components/ui/input-otp";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { wait } from "@/constants/wait";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";

const FakeCourse = [
    {id: '123456', title: 'EE1000'},
    {id: '123457', title: 'EE1001'},
    {id: '123458', title: 'EE1002'},
    {id: '123459', title: 'EE1003'},
    {id: '123460', title: 'EE1004'},
    {id: '123461', title: 'EE1005'},
    {id: '123462', title: 'EE1006'}
];

type Course = {
    id: string;
    title: string;
}[]

export default function Root() {
    const studentBottomSheet = useBottomSheet();
    const teacherBottomSheet = useBottomSheet();

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text variant={'title'} style={[styles.heading]}>Welcome to eClassRoom</Text>
            </View>
            <View>
                <Text variant={'subtitle'}>Chose your role</Text>
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

/**
 * TeacherBottomSheet component, show course list and create new course option,
 * when user click a course, navigate to teacher page with course id and close the bottom sheet,
 * when user click create new course, navigate to create course sheet and close the bottom sheet,
 * when user complete entering course name,
 * create new course and navigate to teacher page with new course id and close the bottom sheet.
 * @param isVisible
 * @param onClose
 * @constructor
 */
function TeacherBottomSheet({isVisible, onClose}: { isVisible: boolean, onClose: () => void }) {
    const router = useRouter();
    const createNewCourseBottomSheet = useBottomSheet();
    const [courseList, setCourseList] = useState<Course | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // when user click a course, navigate to teacher page with course id and close the bottom sheet
    const onClick = useCallback((courseId: string) => {
        console.log('Selected:', courseId);
        router.navigate({pathname: '/teacher', params: {courseId}});
        onClose();
    }, [onClose, router]);

    // when user click create new course, navigate to create course page and close the bottom sheet
    const onCreateNewCourse = useCallback(() => {
        onClose();
        setTimeout(createNewCourseBottomSheet.open, 400);
    }, [createNewCourseBottomSheet, onClose]);

    // when user complete entering course name, create new course and navigate to teacher page with new course id and
    // close the bottom sheet
    const onCreateNewCourseComplete = useCallback<Exclude<TextInputProps['onSubmitEditing'], undefined>>(async ({nativeEvent}) => {
        console.log('Enter: ', nativeEvent.text);

        // validate course name
        if ( !nativeEvent.text || nativeEvent.text.trim() === '' ) {
            setError('Course name cannot be empty.');
            return;
        }

        //todo: create new course with name nativeEvent.text and get course id
        setLoading(true);
        await wait(2000); // Simulate creating course with a delay
        const courseId = '000000';
        const success = true;

        if ( success ) {
            // course created successfully, navigate to teacher page with new course id
            if ( courseList !== null ) {
                setCourseList([...courseList, {id: courseId, title: nativeEvent.text}]);
            } else {
                setCourseList([{id: courseId, title: nativeEvent.text}]);
            }
            router.navigate({pathname: '/teacher', params: {courseId}});
            createNewCourseBottomSheet.close();
        } else {
            // course creation failed, show error message
            setError('Failed to create course. Please try again.');
        }
        setLoading(false);

    }, [courseList, createNewCourseBottomSheet, router]);

    // when course name changes, clear error message
    const onChangeText = useCallback(() => {
        if ( error ) {
            setError('');
        }
    }, [error]);

    // render course list, when course list changes, re-render the list
    const renderItem = useMemo(() => {
        if ( courseList === null ) {
            return new Array(5).fill(0).map((_, i) => (
                <View
                    key={i}
                    style={[styles.courseList, {gap: 10}]}
                >
                    <Skeleton width={'50%'} height={20}/>
                    <Skeleton width={'30%'} height={14}/>
                </View>
            ));
        }
        return courseList.sort((itemA, itemB) => {
            return itemA.title.localeCompare(itemB.title);
        }).map((item) => (
            <TouchableOpacity
                key={item.id}
                style={styles.courseList}
                onPress={() => onClick(item.id)}
            >
                <Text variant="body" style={{fontWeight: '600'}}>
                    {item.title}
                </Text>
                <Text variant="caption" style={{marginTop: 2}}>
                    {item.id}
                </Text>
            </TouchableOpacity>
        ));
    }, [onClick, courseList]);

    // fetch course list from server
    useEffect(() => {
        //TODO: fetch course list from server and setCourseList

        // Simulate fetching course list from server with a delay
        setTimeout(() => {
            setCourseList(FakeCourse);
            //setCourseList([]) // for testing empty course list
        }, 5000);
    }, []);

    return (
        <>
            <BottomSheet
                isVisible={isVisible}
                onClose={onClose}
                title="Chose your course"
                snapPoints={[0.6, 0.9]}
            >
                <View style={{paddingBottom: 100, gap: 10}}>
                    <Button onPress={onCreateNewCourse} disabled={courseList === null}>or Create new course</Button>
                    <Separator/>
                    <View>
                        {renderItem.length !== 0 ? renderItem :
                            <Text
                                variant="caption"
                                style={{textAlign: 'center', marginTop: 20}}
                            >
                                No course found. Please create a new course.
                            </Text>
                        }
                    </View>
                </View>
            </BottomSheet>
            <BottomSheet
                isVisible={createNewCourseBottomSheet.isVisible}
                onClose={createNewCourseBottomSheet.close}
                title={'Create new course'}
                snapPoints={[0.3]}
            >
                <View style={{gap: 12}}>
                    <Text variant="body">Enter course Name</Text>
                    <Input
                        variant="outline"
                        error={error}
                        placeholder={'EE3070'}
                        enterKeyHint={'done'}
                        disabled={loading}
                        onSubmitEditing={onCreateNewCourseComplete}
                        onChange={onChangeText}
                        rightComponent={() => loading ? <Spinner size="default" variant="circle"/> : null}

                    />
                </View>
            </BottomSheet>
        </>
    );
}

/**
 * StudentBottomSheet component, show input for course code,
 * when user complete entering course code, validate the code,
 * if the code is valid, navigate to student page with course id and close the bottom sheet,
 * if the code is invalid, show error message and clear the input.
 * @param isVisible
 * @param onClose
 * @constructor
 */
function StudentBottomSheet({isVisible, onClose}: { isVisible: boolean, onClose: () => void }) {
    const [courseId, setCourseId] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // when course id changes, clear error message
    const onChangeText = useCallback((value: string) => {
        setCourseId(value);
        if ( error ) {
            setError('');
        }
    }, [error]);

    // when user complete entering course id, validate it and navigate to student page if valid
    const onComplete = useCallback<Exclude<InputOTPProps["onComplete"], undefined>>(async (value) => {
        console.log('Entered course ID:', value);

        //todo: validate course id
        setLoading(true);
        await wait(2000); // Simulate validating course ID with a delay
        const valid = true;

        if ( valid ) {
            // course id is valid, navigate to student page
            router.navigate({pathname: '/student', params: {courseId: value}});
            setCourseId('');
            onClose();
        } else {
            // course id is invalid, show error message
            setError('Invalid course code. Please try again.');
            setCourseId('');
        }
        setLoading(false);

    }, [onClose, router]);

    return (
        <>
            <BottomSheet
                isVisible={isVisible}
                onClose={onClose}
                title="Enter course code"
                snapPoints={[0.3]}
            >
                <View>
                    <InputOTP
                        length={6}
                        value={courseId}
                        error={error}
                        disabled={loading}
                        onChangeText={onChangeText}
                        onComplete={onComplete}
                    />
                </View>
                <LoadingOverlay
                    visible={loading}
                    size='lg'
                    variant='circle'
                    label='Loading...'
                    backdrop={false}
                    backdropOpacity={0.7}
                />
            </BottomSheet>
        </>
    );
}

const styles = StyleSheet.create({
    courseList: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(104,104,104,0.1)'
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    heading: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 30
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20
    }
});