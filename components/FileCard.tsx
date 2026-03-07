import { Card, CardContent } from "@/components/ui/card";
import { Icon } from '@/components/ui/icon';
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { UploadFileRequest } from "@/components/UploadFiles";
import { useColor } from "@/hooks/useColor";
import { getFileMeta } from '@/utils/file-meta';
import { X } from 'lucide-react-native';
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

/**
 * A card component that displays a file name with an icon and an optional delete button.
 * @param filename The name of the file to display.
 * @param onClick An optional callback function that is called when the delete button is pressed.
 * @constructor
 */
export function FileCard({filename, onClick}: { filename: string, onClick?: () => void }) {
    const borderColor = useColor('border');
    const {icon, color} = useMemo(() => getFileMeta(filename), [filename]);

    return (
        <Card style={[styles.card, {borderColor: borderColor}]}>
            <CardContent style={styles.cardContent}>
                <Icon name={icon} size={20} color={color}/>
                <Text style={styles.text}>{filename}</Text>
                {onClick ? <Icon name={X} size={20} onPress={onClick}/> : null}
            </CardContent>
        </Card>
    );
}

/**
 * A card component that displays a file name with an icon, a circular progress ring, and an optional cancel button.
 * @param file The file upload request object containing the file and its upload progress.
 * @param onCancel An optional callback function that is called when the cancel button is pressed.
 * @constructor
 */
export function FileUploadingCard({file, onCancel}: { file: UploadFileRequest; onCancel?: () => void }) {
    const borderColor = useColor('border');
    const errorColor = useColor('destructive');
    const isFailed = file.status === 'failed';

    return (
        <Card style={[styles.card, {borderColor: borderColor}]}>
            <CardContent style={styles.cardContent}>
                <UploadProgressRing
                    progress={file.progress}
                    size={20}
                    color={isFailed ? errorColor : undefined}
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.text, isFailed && {color: errorColor}]}>
                        {file.file.name}
                    </Text>
                    {isFailed ? (
                        <Text style={[styles.subText, {color: errorColor}]}>
                            {file.error ?? 'Upload failed'}
                        </Text>
                    ) : null}
                </View>
                {onCancel ? <Icon name={X} size={20} onPress={onCancel}/> : null}
            </CardContent>
        </Card>
    );
}

// Circular progress ring drawn with SVG stroke dash offset.
function UploadProgressRing(
    {
        progress,
        size = 20,
        strokeWidth = 2,
        color,
        trackColor
    }: {
        progress: number;
        size?: number;
        strokeWidth?: number;
        color?: string;
        trackColor?: string;
    }) {
    const themePrimary = useColor('primary');
    const themeMuted = useColor('muted');
    const primaryColor = color ?? themePrimary;
    const mutedColor = trackColor ?? themeMuted;
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - clampedProgress / 100);

    return (
        <Svg width={size} height={size} style={styles.progressRing}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={mutedColor}
                strokeWidth={strokeWidth}
                fill="none"
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={primaryColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation={-90}
                originX={size / 2}
                originY={size / 2}
            />
        </Svg>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        width: 'auto',
        padding: 10,
        justifyContent: 'center'
    },
    cardContent: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center'
    },
    text: {
        fontSize: 14,
        flexShrink: 1
    },
    textContainer: {
        flex: 1
    },
    subText: {
        fontSize: 12
    },
    progressRing: {
        marginRight: 2
    }
});
