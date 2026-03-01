import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Lightbulb } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type LightCardProps = {
    value: number | null;
    max?: number | null;
    unit?: string;
    note?: string;
    style?: ViewStyle;
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

const BULB_PATH = 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5';
const BASE_LINE = 'M9 18h6';
const BASE_STEM = 'M10 22h4';

export function LightCard({ value, max, unit = 'lx', note, style }: LightCardProps) {
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

    const baseMax = typeof max === 'number' ? max : 1000;
    const clampedValue = clamp(value ?? 0, 0, baseMax);
    const progress = clamp(clampedValue / baseMax, 0, 1);

    const displayValue = Math.round(clampedValue);
    const clipHeight = 24 * progress;
    const clipY = 24 - clipHeight;

    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( isLoading ) return undefined;
        if ( progress >= 0.75 ) return 'Very bright';
        if ( progress >= 0.45 ) return 'Bright';
        if ( progress >= 0.2 ) return 'Moderate';
        return 'Dim';
    }, [note, isLoading, progress]);

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Lightbulb} size={18} color="#FDE047" />
                <Text variant="body">Light</Text>
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

                <View style={styles.bulbWrap}>
                    {isLoading ? (
                        <Animated.View style={[styles.skeletonBulb, animatedStyle]}>
                            <Svg width="100%" height={120} viewBox="0 0 24 24">
                                <Path d={BULB_PATH} stroke={mutedColor} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <Path d={BASE_LINE} stroke={mutedColor} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <Path d={BASE_STEM} stroke={mutedColor} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </Svg>
                        </Animated.View>
                    ) : (
                        <Svg width="100%" height={120} viewBox="0 0 24 24">
                            <Defs>
                                <LinearGradient
                                    id="bulbGradient"
                                    x1="0"
                                    y1="24"
                                    x2="0"
                                    y2="0"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <Stop offset="0%" stopColor="#FDE047" />
                                    <Stop offset="100%" stopColor="#F59E0B" />
                                </LinearGradient>
                                <ClipPath id="bulbClip">
                                    <Rect x="0" y={clipY} width="24" height={clipHeight} />
                                </ClipPath>
                            </Defs>

                            {/* Base outline */}
                            <Path d={BULB_PATH} stroke="rgba(255,255,255,0.2)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <Path d={BASE_LINE} stroke="rgba(255,255,255,0.2)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <Path d={BASE_STEM} stroke="rgba(255,255,255,0.2)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />

                            {/* Progress stroke fills from bottom to top via clip rect */}
                            <G clipPath="url(#bulbClip)">
                                <Path d={BULB_PATH} stroke="url(#bulbGradient)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <Path d={BASE_LINE} stroke="url(#bulbGradient)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <Path d={BASE_STEM} stroke="url(#bulbGradient)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </G>
                        </Svg>
                    )}
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
    bulbWrap: {
        alignItems: 'center'
    },
    skeletonBulb: {
        width: '100%'
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
