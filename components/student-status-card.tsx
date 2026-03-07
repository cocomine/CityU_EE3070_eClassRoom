import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { User } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

type StudentStatus = null | 'good' | 'attention';

type StudentSlot = {
    status: StudentStatus;
    label: number | string;
};

type StudentStatusCardProps = {
    slots?: StudentSlot[] | null;
    title?: string;
    style?: ViewStyle;
};

export function StudentStatusCard(
    {
        slots,
        title = 'Student Status',
        style
    }: StudentStatusCardProps) {
    const goodColor = useColor('green');
    const attentionColor = useColor('orange');
    const emptyStroke = useColor('mutedForeground');
    const emptyText = useColor('mutedForeground');
    const footerText = useColor('mutedForeground');
    const emptyMessage = useColor('mutedForeground');

    const isLoading = slots === null;
    const isEmpty = !isLoading && (!slots || slots.length === 0);

    const normalizedSlots = useMemo(() => {
        if ( isLoading || isEmpty ) return [];
        return slots ?? [];
    }, [slots, isLoading, isEmpty]);

    const {total, good, attention, unmonitored} = useMemo(() => {
        let goodCount = 0;
        let attentionCount = 0;
        let unmonitoredCount = 0;
        normalizedSlots.forEach((slot) => {
            if ( slot.status === 'good' ) goodCount += 1;
            if ( slot.status === 'attention' ) attentionCount += 1;
            if ( slot.status === null || slot.status === undefined ) unmonitoredCount += 1;
        });
        return {
            total: normalizedSlots.length,
            good: goodCount,
            attention: attentionCount,
            unmonitored: unmonitoredCount
        };
    }, [normalizedSlots]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={User} size={18} color={goodColor}/>
                <Text variant="body">{title}</Text>
            </CardHeader>

            <CardContent style={styles.content}>
                {isLoading ? (
                    <View style={styles.circleWrap}>
                        {Array.from({length: 10}).map((_, index) => (
                            <Skeleton
                                key={`student-skeleton-${index}`}
                                width={54}
                                height={54}
                                variant="rounded"
                                style={styles.skeletonCircle}
                            />
                        ))}
                    </View>
                ) : isEmpty ? (
                    <Text variant="caption" style={[styles.emptyText, {color: emptyMessage}]}>
                        o sensors are assigned to this classroom
                    </Text>
                ) : (
                    <View style={styles.circleWrap}>
                        {normalizedSlots.map((slot, index) => {
                            const isEmptySlot = slot.status === null || slot.status === undefined;
                            const isGood = slot.status === 'good';
                            const fillColor = isGood ? goodColor : attentionColor;
                            const textColor = isEmptySlot ? emptyText : '#FFFFFF';

                            return (
                                <View
                                    key={`${slot.label}-${index}`}
                                    style={[
                                        styles.circle,
                                        isEmptySlot
                                            ? {borderColor: emptyStroke}
                                            : {backgroundColor: fillColor, borderColor: 'transparent'}
                                    ]}
                                >
                                    <Text style={[styles.circleText, {color: textColor}]}>
                                        {slot.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}
            </CardContent>

            {!isEmpty && (
                <CardFooter>
                    {isLoading ? (
                        <Skeleton width={160} height={12} variant="rounded"/>
                    ) : (
                        <Text variant="caption" style={[styles.footerText, {color: footerText}]}>
                            Total {total} | Good {good} | Attention {attention} | Unmonitored {unmonitored}
                        </Text>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    content: {
        paddingTop: 6
    },
    circleWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    circle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center'
    },
    circleText: {
        fontSize: 20,
        fontWeight: '600'
    },
    skeletonCircle: {
        borderRadius: 27
    },
    emptyText: {
        fontSize: 13,
        fontWeight: '500'
    },
    footerText: {
        fontSize: 13,
        fontWeight: '500'
    }
});
