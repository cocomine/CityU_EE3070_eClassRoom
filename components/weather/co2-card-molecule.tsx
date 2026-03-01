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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type Co2CardMoleculeProps = {
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

// Simple deterministic RNG to keep dots stable between renders.
const lcg = (seed: number) => {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
};

export function Co2CardMolecule({
    value,
    min = 400,
    max = 2000,
    unit = 'ppm',
    note,
    style
}: Co2CardMoleculeProps) {
    const mutedColor = useColor('muted');
    const pollutedLight = '#E5E7EB';
    const pollutedDark = '#9CA3AF';
    const isLoading = value === null || value === undefined;

    // Match Skeleton's pulsing animation for non-rect placeholders like SVG.
    const opacity = useSharedValue(0.5);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value
        };
    });

    // Start the pulsing animation on mount.
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

    // Normalize CO2 into a 0..1 density value.
    const clampedValue = clamp(value ?? min, min, max);
    const range = Math.max(1, max - min);
    const progress = clamp((clampedValue - min) / range, 0, 1);
    const displayValue = Math.round(clampedValue);

    // Generate dots inside a circle; higher CO2 => more dots.
    const dotCount = Math.round(12 + progress * 24);
    const dots = useMemo(() => {
        const rand = lcg(dotCount * 1337 + 42);
        const points: { x: number; y: number; r: number; o: number }[] = [];
        const radius = 38;
        while (points.length < dotCount) {
            const x = rand() * 2 - 1;
            const y = rand() * 2 - 1;
            if (x * x + y * y <= 1) {
                const r = 1.5 + rand() * 2.6;
                points.push({
                    x: 50 + x * radius,
                    y: 50 + y * radius,
                    r,
                    o: 0.35 + rand() * 0.5
                });
            }
        }
        return points;
    }, [dotCount]);

    // Default note based on typical indoor CO2 ranges.
    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( isLoading ) return undefined;
        if ( clampedValue < 800 ) return 'Good air';
        if ( clampedValue < 1200 ) return 'Moderate';
        if ( clampedValue < 1600 ) return 'Stuffy';
        return 'Poor air';
    }, [note, isLoading, clampedValue]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Cloud} size={18} color={pollutedDark} />
                <Text variant="body">CO2</Text>
            </CardHeader>

            {/* Show skeleton for value and unit while loading, then show actual value when loaded. */}
            <CardContent style={styles.content}>
                {isLoading ? (
                    <Skeleton width={90} height={40} variant="rounded" />
                ) : (
                    <View style={styles.valueRow}>
                        <Text style={styles.valueText}>{displayValue}</Text>
                        <Text style={styles.valueUnit}>{unit}</Text>
                    </View>
                )}

                {/* Show animated skeleton dots while loading, then show actual dots when loaded. */}
                <View style={styles.dotWrap}>
                    {isLoading ? (
                        <Animated.View style={[styles.skeletonDots, animatedStyle]}>
                            <Svg width="100%" height={110} viewBox="0 0 100 100">
                                <Circle cx="50" cy="50" r="40" fill="none" stroke={mutedColor} strokeWidth="2" />
                            </Svg>
                        </Animated.View>
                    ) : (
                        <Svg width="100%" height={110} viewBox="0 0 100 100">
                            <Defs>
                                <LinearGradient id="co2Ring" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                                    <Stop offset="0%" stopColor={pollutedLight} />
                                    <Stop offset="100%" stopColor={pollutedDark} />
                                </LinearGradient>
                            </Defs>
                            {/* Container ring */}
                            <Circle cx="50" cy="50" r="40" fill="none" stroke="url(#co2Ring)" strokeWidth="2" opacity="0.55" />
                            {/* Dots represent CO2 density */}
                            {dots.map((dot, index) => (
                                <Circle key={index} cx={dot.x} cy={dot.y} r={dot.r} fill={pollutedDark} opacity={0.2 + dot.o * 0.6} />
                            ))}
                        </Svg>
                    )}
                </View>
            </CardContent>

            {/* Show skeleton for note while loading, then show actual note when loaded. */}
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
        gap: 10
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
    dotWrap: {
        alignItems: 'center'
    },
    skeletonDots: {
        width: '100%'
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
