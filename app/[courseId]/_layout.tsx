import { Icon } from '@/components/ui/icon';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import 'react-native-reanimated';
import { Pressable, StyleSheet } from "react-native";

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const router = useRouter();

    const renderBackButton = () => (
        <Pressable
            onPress={() => router.back()}
            accessibilityLabel="返回"
            hitSlop={8}
            style={styles.backButton}
        >
            <Icon name={ArrowLeft} size={22}/>
        </Pressable>
    );

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackButtonDisplayMode: 'minimal',
                headerLeft: renderBackButton
            }}
        >
            <Stack.Screen name="student/index"
                          options={{
                              title: "Student Terminal"
                          }}/>
            <Stack.Screen name="teacher/index"
                          options={{
                              title: "Teacher Terminal"
                          }}/>
        </Stack>
    );
}

const styles = StyleSheet.create({
    backButton: {
        paddingHorizontal: 8,
        paddingVertical: 6
    }
});
