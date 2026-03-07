import { ToastProvider } from "@/components/ui/toast";

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ToastProvider>

                    <Stack>
                        <Stack.Screen name="index" options={{headerShown: false}}/>
                        <Stack.Screen name="[courseId]" options={{headerShown: false}}/>
                    </Stack>

                <StatusBar style="auto"/>
            </ToastProvider>
        </ThemeProvider>
    );
}
