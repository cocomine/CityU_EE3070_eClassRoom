import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Gauge } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

type Co2CardGaugeProps = {
    value: number | null;
    min?: number;
    max?: number;
    unit?: string;
    note?: string;
    style?: ViewStyle;
};

// Keep a value within a fixed range.
const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

export function Co2CardGauge({
    value,
    min = 0,
    max = 1000,
    unit = 'ppm',
    note,
    style
}: Co2CardGaugeProps) {
    const mutedColor = useColor('muted');
    const isLoading = value === null || value === undefined;

    // Match Skeleton's pulsing animation for non-rect placeholders like SVG.
    const opacity = useSharedValue(0.5);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value
        };
    });

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, {
                duration: 1000,
                easing: Easing.inOut(Easing.quad)
            }),
            -1,
            true
        );
    }, []);

    const range = Math.max(1, max - min);
    const clampedValue = clamp(value ?? min, min, max);
    const progress = clamp((clampedValue - min) / range, 0, 1);
    const displayValue = Math.round(clampedValue);

    // Gauge geometry (semi-circle).
    const gauge = {
        width: 200,
        height: 120,
        cx: 100,
        cy: 100,
        inner: 62,
        outer: 78,
        pointer: 60
    };

    const ticks = useMemo(() => {
        const count = 36;
        const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
        for (let i = 0; i <= count; i += 1) {
            const angle = Math.PI - (Math.PI * i) / count;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const major = i % 6 === 0;
            const inner = major ? gauge.inner - 6 : gauge.inner;
            lines.push({
                x1: gauge.cx + inner * cos,
                y1: gauge.cy - inner * sin,
                x2: gauge.cx + gauge.outer * cos,
                y2: gauge.cy - gauge.outer * sin,
                major
            });
        }
        return lines;
    }, [gauge.cx, gauge.cy, gauge.inner, gauge.outer]);

    // Pointer angle maps value to the semi-circle.
    const pointerAngle = Math.PI - Math.PI * progress;
    const pointerX = gauge.cx + gauge.pointer * Math.cos(pointerAngle);
    const pointerY = gauge.cy - gauge.pointer * Math.sin(pointerAngle);

    // Default note based on CO2 ranges.
    const derivedNote = useMemo(() => {
        if (note) return note;
        if (isLoading) return undefined;
        if (clampedValue < 600) return 'Good air';
        if (clampedValue < 800) return 'Moderate';
        if (clampedValue < 1000) return 'Stuffy';
        return 'Poor air';
    }, [note, isLoading, clampedValue]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Gauge} size={18} color="#E5E7EB" />
                <Text variant="body">CO2</Text>
            </CardHeader>

            <CardContent style={styles.content}>
                {isLoading ? (
                    <Skeleton width={90} height={40} variant="rounded" />
                ) : (
                    <View style={styles.valueRow}>
                        <Text style={styles.valueText}>{displayValue}</Text>
                        <Text style={styles.valueUnit}>{unit}</Text>
                    </View>
                )}

                <View style={styles.gaugeWrap}>
                    {isLoading ? (
                        <Animated.View style={[styles.skeletonGauge, animatedStyle]}>
                            <Svg width="100%" height={gauge.height} viewBox={`0 0 ${gauge.width} ${gauge.height}`}>
                                {ticks.map((tick, index) => (
                                    <Line
                                        key={index}
                                        x1={tick.x1}
                                        y1={tick.y1}
                                        x2={tick.x2}
                                        y2={tick.y2}
                                        stroke={mutedColor}
                                        strokeWidth={tick.major ? 3 : 2}
                                        strokeLinecap="round"
                                    />
                                ))}
                            </Svg>
                        </Animated.View>
                    ) : (
                        <Svg width="100%" height={gauge.height} viewBox={`0 0 ${gauge.width} ${gauge.height}`}>
                            {ticks.map((tick, index) => (
                                <Line
                                    key={index}
                                    x1={tick.x1}
                                    y1={tick.y1}
                                    x2={tick.x2}
                                    y2={tick.y2}
                                    stroke="rgba(255,255,255,0.25)"
                                    strokeWidth={tick.major ? 3 : 2}
                                    strokeLinecap="round"
                                />
                            ))}
                            {/* Pointer */}
                            <Line
                                x1={gauge.cx}
                                y1={gauge.cy}
                                x2={pointerX}
                                y2={pointerY}
                                stroke="#FFFFFF"
                                strokeWidth={6}
                                strokeLinecap="round"
                            />
                        </Svg>
                    )}
                </View>

                <View style={styles.rangeLabels}>
                    <Text variant="caption">Low</Text>
                    <Text variant="caption">High</Text>
                </View>
            </CardContent>

            <CardFooter>
                {isLoading ? (
                    <Skeleton width="70%" height={12} variant="rounded" />
                ) : (
                    <Text variant="caption" style={styles.note}>{derivedNote}</Text>
                )}
            </CardFooter>
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
        gap: 8
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    valueText: {
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 40
    },
    valueUnit: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
        marginBottom: 6
    },
    gaugeWrap: {
        alignItems: 'center'
    },
    skeletonGauge: {
        width: '100%'
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -4
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
