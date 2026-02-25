import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false}} />
        <Stack.Screen name="student/index" options={{headerBackButtonDisplayMode: 'minimal', title:"Student Terminal"}}/>
        <Stack.Screen name="teacher/index" options={{headerBackButtonDisplayMode: 'minimal', title:"Teacher Terminal"}}/>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
