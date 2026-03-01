import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Droplet } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type HumidityCardProps = {
    value: number | null;
    dewPoint?: number;
    note?: string;
    style?: ViewStyle;
};

// Keep incoming humidity within the 0-100 range.
const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

// Fixed gauge geometry (SVG viewBox is based on these numbers).
const GAUGE = {
    width: 200,
    height: 120,
    radius: 80,
    centerX: 100,
    centerY: 100
};

export function HumidityCard({value, dewPoint, note, style}: HumidityCardProps) {
    const accent = useColor('blue', {light: '#7CB7FF', dark: '#7CB7FF'});
    const mutedColor = useColor('muted');
    const isLoading = value === null || value === undefined;

    // Match Skeleton's pulsing animation for non-rect placeholders like SVG.
    const opacity = useSharedValue(0.5);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value
        };
    });

    // Start a looping animation that fades the SVG in and out while loading.
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

    // Clamp and round for a stable display value.
    const clamped = clamp(value ?? 0, 0, 100);
    const displayValue = Math.round(clamped);

    // Define a top semicircle arc from left to right.
    const startX = GAUGE.centerX - GAUGE.radius;
    const endX = GAUGE.centerX + GAUGE.radius;
    const strokeWidth = 10;
    const arcPath = `M ${startX} ${GAUGE.centerY} A ${GAUGE.radius} ${GAUGE.radius} 0 0 1 ${endX} ${GAUGE.centerY}`;

    // Map 0-100% to an angle on the semicircle for the indicator dot.
    const indicatorAngle = Math.PI - (Math.PI * clamped) / 100;
    const indicatorX = GAUGE.centerX + GAUGE.radius * Math.cos(indicatorAngle);
    const indicatorY = GAUGE.centerY - GAUGE.radius * Math.sin(indicatorAngle);
    const arcLength = Math.PI * GAUGE.radius;
    const filledLength = arcLength * (clamped / 100);

    // Fallback note when no explicit message is provided.
    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( isLoading ) return undefined;
        if ( dewPoint !== undefined ) return `Dew point ${dewPoint}°`;
        if ( clamped >= 70 ) return 'High, feels stuffy';
        if ( clamped <= 40 ) return 'Dry';
        return 'Comfortable';
    }, [note, dewPoint, clamped, isLoading]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Droplet} size={18} color={accent}/>
                <Text variant={'body'}>Humidity</Text>
            </CardHeader>

            <CardContent>
                <View style={styles.gaugeWrap}>
                    {isLoading ? (
                        /* Animated placeholder while loading. */
                        <Animated.View style={[styles.skeletonArc, animatedStyle]}>
                            <Svg width="100%" height={GAUGE.height} viewBox={`0 0 ${GAUGE.width} ${GAUGE.height}`}>
                                <Path
                                    d={arcPath}
                                    stroke={mutedColor}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </Svg>
                        </Animated.View>
                    ) : (
                        <Svg width="100%" height={GAUGE.height} viewBox={`0 0 ${GAUGE.width} ${GAUGE.height}`}>
                            <Defs>
                                {/* Left-to-right gradient: green -> yellow -> red */}
                                <LinearGradient
                                    id="humidityGradient"
                                    x1="0"
                                    y1="0"
                                    x2={GAUGE.width}
                                    y2="0"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <Stop offset="0%" stopColor="#F97316"/>
                                    <Stop offset="60%" stopColor="#34D399"/>
                                    <Stop offset="100%" stopColor="#60A5FA"/>
                                </LinearGradient>
                            </Defs>
                            {/* Base track for contrast */}
                            <Path
                                d={arcPath}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* Colored arc on top of the base track */}
                            <Path
                                d={arcPath}
                                stroke="url(#humidityGradient)"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={`${filledLength} ${arcLength}`}
                                fill="none"
                            />
                            {/* Indicator dot shows the current humidity position */}
                            <Circle cx={indicatorX} cy={indicatorY} r={6} fill="#FFFFFF"/>
                            <Circle cx={indicatorX} cy={indicatorY} r={3} fill="#1E293B"/>
                        </Svg>
                    )}

                    {/* Centered numeric value (or placeholder) on top of the gauge. */}
                    <View style={styles.gaugeCenter}>
                        {isLoading ? (
                            <Skeleton width={64} height={32} variant="rounded"/>
                        ) : (
                            <View style={styles.valueRow}>
                                <Text style={styles.valueText}>{displayValue}</Text>
                                <Text style={styles.valueUnit}>%</Text>
                            </View>
                        )}
                    </View>
                </View>
            </CardContent>

            {/* Optional note below the gauge, with a fallback message based on humidity level. */}
            <CardFooter>
                {isLoading ? (
                    <Skeleton width="70%" height={12} variant="rounded"/>
                ) : (
                    <Text variant={'caption'} style={styles.note}>{derivedNote}</Text>
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
    gaugeWrap: {
        width: '100%',
        alignItems: 'center',
        position: 'relative'
    },
    gaugeCenter: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        alignItems: 'center'
    },
    skeletonArc: {
        width: '100%'
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
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 3,
        marginBottom: 5
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
