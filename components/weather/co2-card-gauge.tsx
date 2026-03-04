import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Cloud } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

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

export function Co2CardGauge(
    {
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

    // Animate opacity between 0.5 and 1 in a loop.
    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, {
                duration: 1000,
                easing: Easing.inOut(Easing.quad)
            }),
            -1,
            true
        );
    }, [opacity]);

    // Normalize input to a 0..1 progress value for the gauge.
    const range = Math.max(1, max - min);
    const clampedValue = clamp(value ?? min, min, max);
    const progress = clamp((clampedValue - min) / range, 0, 1);
    const displayValue = Math.round(clampedValue);

    // Gauge geometry (near-full circle with a small gap at the bottom).
    const gauge = {
        width: 240,
        height: 210,
        cx: 120,
        cy: 120,
        inner: 78,
        outer: 98,
        pointer: 74,
        // startAngle = where the gauge begins; sweep = total angular span.
        startAngle: (Math.PI * 255) / 180,
        sweep: (Math.PI * 330) / 180
    };
    const gaugeViewBox = `0 0 ${gauge.width} 240`;
    // Vertical offset that visually centers the value in the ring.
    const gaugeCenterTop = gauge.cy - 42;

    const tickColors = {
        good: '#34D399',
        moderate: '#FBBF24',
        stuffy: '#F87171',
        poor: '#A78BFA',
        low: 'rgba(255,255,255,0.25)'
    };

    // Color by CO2 concentration band (no gradient).
    const getTickColor = (valueAtTick: number) => {
        if ( valueAtTick >= 1900 ) return tickColors.poor;
        if ( valueAtTick >= 1500 ) return tickColors.stuffy;
        if ( valueAtTick >= 1000 ) return tickColors.moderate;
        if ( valueAtTick < 1000 ) return tickColors.good;
        return tickColors.low;
    };

    // Precompute tick mark positions for the gauge arc. Major ticks every 6th mark.
    const ticks = useMemo(() => {
        const count = 54;
        const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean; value: number }[] = [];
        for ( let i = 0 ; i <= count ; i += 1 ) {
            // Angle direction controls whether ticks run clockwise or counterclockwise.
            const angle = gauge.startAngle - gauge.sweep * (i / count);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const major = i % 6 === 0;
            const inner = major ? gauge.inner - 6 : gauge.inner;
            const valueAtTick = min + (range * i) / count;
            lines.push({
                x1: gauge.cx + inner * cos,
                y1: gauge.cy - inner * sin,
                x2: gauge.cx + gauge.outer * cos,
                y2: gauge.cy - gauge.outer * sin,
                major,
                value: valueAtTick
            });
        }
        return lines;
    }, [gauge.cx, gauge.cy, gauge.inner, gauge.outer, gauge.startAngle, gauge.sweep, min, range]);

    // Pointer angle maps value to the arc span.
    const pointerAngle = gauge.startAngle - gauge.sweep * progress;
    const pointerCos = Math.cos(pointerAngle);
    const pointerSin = Math.sin(pointerAngle);
    const pointerX = gauge.cx + gauge.pointer * pointerCos;
    const pointerY = gauge.cy - gauge.pointer * pointerSin;
    const pointerBase = gauge.pointer - 16;
    const pointerBaseX = gauge.cx + pointerBase * pointerCos;
    const pointerBaseY = gauge.cy - pointerBase * pointerSin;
    // Arrowhead width and perpendicular vector to build the triangle.
    const pointerHalfWidth = 6;
    const perpX = pointerSin;
    const perpY = pointerCos;
    const pointerLeftX = pointerBaseX + pointerHalfWidth * perpX;
    const pointerLeftY = pointerBaseY + pointerHalfWidth * perpY;
    const pointerRightX = pointerBaseX - pointerHalfWidth * perpX;
    const pointerRightY = pointerBaseY - pointerHalfWidth * perpY;

    // Default note based on CO2 ranges.
    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( isLoading ) return undefined;
        if ( clampedValue < 1000 ) return 'Good air';
        if ( clampedValue < 1500 ) return 'Moderate';
        if ( clampedValue < 2000 ) return 'Stuffy';
        return 'Poor air';
    }, [note, isLoading, clampedValue]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Cloud} size={18} color="#E5E7EB"/>
                <Text variant="body">CO2</Text>
            </CardHeader>

            <CardContent style={styles.content}>
                <View style={styles.gaugeWrap}>
                    {isLoading ? (
                        <Animated.View style={[styles.skeletonGauge, animatedStyle]}>
                            <Svg width="100%" height={gauge.height} viewBox={gaugeViewBox}>
                                {/* Render tick marks only (no pointer) during loading. */}
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
                        <Svg width="100%" height={gauge.height} viewBox={gaugeViewBox}>
                            {ticks.map((tick, index) => (
                                <Line
                                    key={index}
                                    x1={tick.x1}
                                    y1={tick.y1}
                                    x2={tick.x2}
                                    y2={tick.y2}
                                    stroke={getTickColor(tick.value)}
                                    strokeWidth={tick.major ? 3 : 2}
                                    strokeLinecap="round"
                                />
                            ))}
                            {/* Arrow pointer aligned to the computed angle. */}
                            <Path
                                d={`M ${pointerX} ${pointerY} L ${pointerLeftX} ${pointerLeftY} L ${pointerRightX} ${pointerRightY} Z`}
                                fill="#FFFFFF"
                            />
                        </Svg>
                    )}
                    <View style={[styles.gaugeCenter, {top: gaugeCenterTop}]}>
                        {isLoading ? (
                            <Skeleton width={90} height={32} variant="rounded"/>
                        ) : (
                            <View style={styles.valueRow}>
                                <Text style={styles.valueText}>{displayValue}</Text>
                                <Text style={styles.valueUnit}>{unit}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Range labels shown near the gap side of the gauge. */}
                <View style={styles.rangeLabels}>
                    <Text variant="caption" style={styles.rangeLabelText}>Low</Text>
                    <Text variant="caption" style={styles.rangeLabelText}>High</Text>
                </View>
            </CardContent>

            <CardFooter>
                {isLoading ? (
                    <Skeleton width="70%" height={12} variant="rounded"/>
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
        flexDirection: 'column',
        alignItems: 'center'
    },
    valueText: {
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 40
    },
    valueUnit: {
        fontSize: 14,
        fontWeight: '600'
    },
    gaugeWrap: {
        alignItems: 'center',
        position: 'relative'
    },
    skeletonGauge: {
        width: '100%'
    },
    gaugeCenter: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 34,
        alignItems: 'center'
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 40,
        marginTop: -30
    },
    rangeLabelText: {
        minWidth: 44,
        textAlign: 'center'
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
