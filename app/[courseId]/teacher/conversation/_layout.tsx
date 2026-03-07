import { Icon } from '@/components/ui/icon';
import { useColor } from "@/hooks/useColor";
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import 'react-native-reanimated';
import { Pressable, StyleSheet } from "react-native";

export default function RootLayout() {
    const router = useRouter();
    const textColor = useColor('text')

    const renderBackButton = () => (
        <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.backButton}
        >
            <Icon name={ArrowLeft} size={22} color={textColor}/>
        </Pressable>
    );

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackButtonDisplayMode: 'minimal',
                headerLeft: renderBackButton,
                title: "Conversation"
            }}
        >
            <Stack.Screen name="index"/>
            <Stack.Screen name="[conversationId]"/>
        </Stack>
    );
}

const styles = StyleSheet.create({
    backButton: {
        paddingHorizontal: 8,
        paddingVertical: 6
    }
});
