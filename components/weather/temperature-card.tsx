import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { heatIndexC, heatIndexF } from '@/utils/heat-index';
import { Thermometer } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type TemperatureCardProps = {
    current: number;
    min?: number;
    max?: number;
    humidity?: number;
    feelsLike?: number;
    unit?: 'C' | 'F';
    note?: string;
    style?: ViewStyle;
};

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

export function TemperatureCard({
                                    current,
                                    min,
                                    max,
                                    humidity,
                                    feelsLike,
                                    unit = 'C',
                                    note,
                                    style
                                }: TemperatureCardProps) {
    // Normalize the min/max range; if missing, derive a small window around the current temp.
    const safeMin = min ?? current - 3;
    const safeMax = max ?? current + 3;
    const low = Math.min(safeMin, safeMax);
    const high = Math.max(safeMin, safeMax);
    const range = Math.max(1, high - low);
    const progress = clamp((current - low) / range, 0, 1);

    const displayCurrent = Math.round(current);
    const displayMin = Math.round(low);
    const displayMax = Math.round(high);

    // Compute Heat Index if humidity is provided (unless a manual feelsLike overrides it later).
    const computedFeelsLike = useMemo(() => {
        if ( humidity === undefined || Number.isNaN(humidity) ) return undefined;
        const rh = clamp(humidity, 0, 100);
        if ( unit === 'C' ) return heatIndexC(current, rh);
        return heatIndexF(current, rh);
    }, [humidity, current, unit]);

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

    // Gauge bar geometry used by the SVG viewBox.
    const bar = {
        width: 220,
        height: 14,
        x: 8,
        y: 4,
        radius: 6
    };
    const indicatorX = bar.x + bar.width * progress;

    return (
        <Card style={style}>
            <CardHeader style={styles.headerRow}>
                <Icon name={Thermometer} size={18} color="#F97316"/>
                <Text variant="body">Temperature</Text>
            </CardHeader>

            <CardContent style={styles.content}>
                <View style={styles.valueRow}>
                    <Text style={styles.valueText}>{displayCurrent}</Text>
                    <Text style={styles.valueUnit}>°{unit}</Text>
                </View>
                {/* Show Heat Index (or manual feelsLike) if available. */}
                {effectiveFeelsLike !== undefined ? (
                    <Text variant="caption" style={styles.feelsLike}>
                        Feels like {Math.round(effectiveFeelsLike)}°
                    </Text>
                ) : null}

                <View style={styles.rangeWrap}>
                    <Svg width="100%" height={22} viewBox="0 0 236 22">
                        <Defs>
                            {/* Temperature gradient from cool to warm. */}
                            <LinearGradient
                                id="tempGradient"
                                x1="0"
                                y1="0"
                                x2={bar.x + bar.width}
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
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                            rx={bar.radius}
                            fill="rgba(255,255,255,0.2)"
                        />
                        {/* Gradient track overlay. */}
                        <Rect
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                            rx={bar.radius}
                            fill="url(#tempGradient)"
                        />
                        {/* Indicator dot shows the current temperature position. */}
                        <Circle cx={indicatorX} cy={bar.y + bar.height / 2} r={6} fill="#FFFFFF"/>
                        <Circle cx={indicatorX} cy={bar.y + bar.height / 2} r={3} fill="#1E293B"/>
                    </Svg>
                </View>

                <View style={styles.rangeLabels}>
                    <Text variant="caption">Low {displayMin}°</Text>
                    <Text variant="caption">High {displayMax}°</Text>
                </View>
            </CardContent>

            {/* Footer note is optional. */}
            {derivedNote ? (
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
        marginTop: 6
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    note: {
        fontSize: 13,
        fontWeight: '500'
    }
});
