import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { FC } from "react";
import { StyleSheet } from "react-native";
import { Icon } from '@/components/ui/icon';
import { File } from 'lucide-react-native';

export const FileCard: FC<{ filename: string }> = ({filename}) => {
    const borderColor = useColor('border');
    const extension = filename.split('.').pop()?.toLowerCase();



    return (
        <Card style={[styles.card, {borderColor: borderColor}]}>
            <CardContent style={styles.cardContent}>
                <Icon name={File} size={20} color={fileColor}/>
                <Text style={styles.text}>{filename}</Text>
            </CardContent>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        width: 'auto',
        padding: 10
    },
    cardContent: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center'
    },
    text: {
        fontSize: 14
    }
});