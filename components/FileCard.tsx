import { Card, CardContent } from "@/components/ui/card";
import { Icon } from '@/components/ui/icon';
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { getFileMeta } from '@/utils/file-meta';
import { X } from 'lucide-react-native';
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function FileCard({filename, onClick}: { filename: string, onClick?: () => void }) {
    const borderColor = useColor('border');
    const {icon, color} = useMemo(() => getFileMeta(filename), [filename]);

    return (
        <Card style={[styles.card, {borderColor: borderColor}]}>
            <CardContent style={styles.cardContent}>
                <Icon name={icon} size={20} color={color}/>
                <Text style={styles.text}>{filename}</Text>
                <Icon name={X} size={20} onPress={onClick}/>
            </CardContent>
        </Card>
    );
};

export function FileUploadCard() {
    //todo: implement file upload
}

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
