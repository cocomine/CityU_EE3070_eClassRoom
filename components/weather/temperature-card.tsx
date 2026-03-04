import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { heatIndexC, heatIndexF } from '@/utils/heat-index';
import { Thermometer } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type TemperatureCardProps = {
    current: number | null;
    min?: number | null;
    max?: number | null;
    humidity?: number | null;
    feelsLike?: number;
    unit?: 'C' | 'F';
    note?: string;
    style?: ViewStyle;
};

// Ensure temperature values are within a reasonable range for display and calculations.
const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

const BAR = {
    width: 260,
    height: 14,
    x: 0,
    y: 4,
    radius: 6
};
const BAR_VIEW_WIDTH = BAR.width + BAR.x * 2;

export function TemperatureCard(
    {
        current,
        min,
        max,
        humidity,
        feelsLike,
        unit = 'C',
        note,
        style
    }: TemperatureCardProps) {
    const mutedColor = useColor('muted');
    const isLoading = current === null || current === undefined;

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

    // Normalize the min/max range; if missing, derive a small window around the current temp.
    const baseCurrent = current ?? 0;
    const safeMin = typeof min === 'number' ? min : baseCurrent - 3;
    const safeMax = typeof max === 'number' ? max : baseCurrent + 3;
    const low = Math.min(safeMin, safeMax);
    const high = Math.max(safeMin, safeMax);
    const range = Math.max(1, high - low);
    const progress = clamp((baseCurrent - low) / range, 0, 1);

    // Round values for a cleaner display.
    const displayCurrent = Math.round(baseCurrent);
    const displayMin = Math.round(low);
    const displayMax = Math.round(high);

    // Compute Heat Index if humidity is provided (unless a manual feelsLike overrides it later).
    const computedFeelsLike = useMemo(() => {
        if ( humidity === null || humidity === undefined || Number.isNaN(humidity) ) return undefined;
        const rh = clamp(humidity, 0, 100);
        if ( unit === 'C' ) return heatIndexC(baseCurrent, rh);
        return heatIndexF(baseCurrent, rh);
    }, [humidity, baseCurrent, unit]);

    // Prefer explicit feelsLike, otherwise use computed Heat Index.
    const effectiveFeelsLike = feelsLike ?? computedFeelsLike;

    // Optional note line; if not provided, derive a simple message from feels-like temperature.
    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( effectiveFeelsLike === undefined ) return undefined;

        // These thresholds are subjective and can be adjusted based on typical comfort levels.
        const feels = effectiveFeelsLike;
        if ( unit === 'F' ) { // Fahrenheit thresholds
            if ( feels >= 90 ) return 'Very hot';
            if ( feels >= 80 ) return 'Warm';
            if ( feels >= 65 ) return 'Comfortable';
            if ( feels >= 50 ) return 'Cool';
            return 'Cold';
        }

        // Celsius thresholds
        if ( feels >= 32 ) return 'Very hot';
        if ( feels >= 27 ) return 'Warm';
        if ( feels >= 20 ) return 'Comfortable';
        if ( feels >= 10 ) return 'Cool';
        return 'Cold';
    }, [note, effectiveFeelsLike, unit]);

    // Show skeletons for feels-like and range if loading or if required data is missing for calculations.
    const showFeelsLikeSkeleton = isLoading || (feelsLike === undefined && (humidity === null || humidity === undefined));
    const showRangeSkeleton = isLoading || min === null || min === undefined || max === null || max === undefined;

    // Gauge bar geometry used by the SVG viewBox.
    const indicatorX = BAR.x + BAR.width * progress;

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Thermometer} size={18} color="#F97316"/>
                <Text variant="body">Temperature</Text>
            </CardHeader>

            <CardContent style={styles.content}>
                {/* Show current temperature or a skeleton if loading. */}
                {isLoading ? (
                    <Skeleton width={90} height={40} variant="rounded"/>
                ) : (
                    <View style={styles.valueRow}>
                        <Text style={styles.valueText}>{displayCurrent}</Text>
                        <Text style={styles.valueUnit}>°{unit}</Text>
                    </View>
                )}

                {/* Show Heat Index (or manual feelsLike) if available. */}
                {showFeelsLikeSkeleton ? (
                    <Skeleton width={140} height={18} variant="rounded"/>
                ) : effectiveFeelsLike !== undefined ? (
                    <Text variant="caption" style={styles.feelsLike}>
                        Feels like {Math.round(effectiveFeelsLike)}°
                    </Text>
                ) : null}

                {/* Temperature range gauge with gradient and indicator. Show skeleton if loading. */}
                <View style={styles.rangeWrap}>
                    {isLoading ? (
                        <Animated.View style={[styles.skeletonBar, animatedStyle]}>
                            <Svg width="100%" height={22} viewBox={`0 0 ${BAR_VIEW_WIDTH} 22`}>
                                <Rect
                                    x={BAR.x}
                                    y={BAR.y}
                                    width={BAR.width}
                                    height={BAR.height}
                                    rx={BAR.radius}
                                    fill={mutedColor}
                                />
                            </Svg>
                        </Animated.View>
                    ) : (
                        <Svg width="100%" height={22} viewBox={`0 0 ${BAR_VIEW_WIDTH} 22`}>
                            <Defs>
                                {/* Temperature gradient from cool to warm. */}
                                <LinearGradient
                                    id="tempGradient"
                                    x1="0"
                                    y1="0"
                                    x2={BAR.x + BAR.width}
                                    y2="0"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <Stop offset="0%" stopColor="#60A5FA"/>
                                    <Stop offset="55%" stopColor="#FBBF24"/>
                                    <Stop offset="100%" stopColor="#F97316"/>
                                </LinearGradient>
                            </Defs>
                            {/* Base track for contrast. */}
                            <Rect
                                x={BAR.x}
                                y={BAR.y}
                                width={BAR.width}
                                height={BAR.height}
                                rx={BAR.radius}
                                fill="rgba(255,255,255,0.2)"
                            />
                            {/* Gradient track overlay. */}
                            <Rect
                                x={BAR.x}
                                y={BAR.y}
                                width={BAR.width}
                                height={BAR.height}
                                rx={BAR.radius}
                                fill="url(#tempGradient)"
                            />
                            {/* Indicator dot shows the current temperature position. */}
                            <Circle cx={indicatorX} cy={BAR.y + BAR.height / 2} r={6} fill="#FFFFFF"/>
                            <Circle cx={indicatorX} cy={BAR.y + BAR.height / 2} r={3} fill="#1E293B"/>
                        </Svg>
                    )}
                </View>

                {/* Show min/max labels or skeletons if loading. */}
                {showRangeSkeleton ? (
                    <View style={styles.rangeLabels}>
                        <Skeleton width={60} height={18} variant="rounded"/>
                        <Skeleton width={60} height={18} variant="rounded"/>
                    </View>
                ) : (
                    <View style={styles.rangeLabels}>
                        <Text variant="caption">Low {displayMin}°</Text>
                        <Text variant="caption">High {displayMax}°</Text>
                    </View>
                )}
            </CardContent>

            {/* Footer note is optional. */}
            {isLoading ? (
                <CardFooter>
                    <Skeleton width="70%" height={12} variant="rounded"/>
                </CardFooter>
            ) : derivedNote ? (
                <CardFooter>
                    <Text variant="caption" style={styles.note}>
                        {derivedNote}
                    </Text>
                </CardFooter>
            ) : null}
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
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 3,
        marginBottom: 5
    },
    feelsLike: {
        marginTop: -2
    },
    rangeWrap: {
        marginTop: 6,
        width: '100%',
        paddingHorizontal: 18
    },
    skeletonBar: {
        width: '100%'
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 180,
        paddingHorizontal: 18
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
