import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { Droplet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type HumidityCardProps = {
    value: number;
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

export function HumidityCard({value, dewPoint, note}: HumidityCardProps) {
    const accent = useColor('blue', {light: '#7CB7FF', dark: '#7CB7FF'});

    // Clamp and round for a stable display value.
    const clamped = clamp(value, 0, 100);
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

    // Fallback note when no explicit message is provided.
    const derivedNote = useMemo(() => {
        if ( note ) return note;
        if ( dewPoint !== undefined ) return `Dew point ${dewPoint}°`;
        if ( clamped >= 70 ) return 'High, feels stuffy';
        if ( clamped <= 40 ) return 'Dry';
        return 'Comfortable';
    }, [note, dewPoint, clamped]);

    return (
        <Card>
            <CardHeader style={styles.headerRow}>
                <Icon name={Droplet} size={18} color={accent}/>
                <Text variant={'body'}>Humidity</Text>
            </CardHeader>

            <CardContent>
                <View style={styles.gaugeWrap}>
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
                                <Stop offset="0%" stopColor="#34D399"/>
                                <Stop offset="50%" stopColor="#FBBF24"/>
                                <Stop offset="100%" stopColor="#F87171"/>
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
                            fill="none"
                        />
                        {/* Indicator dot shows the current humidity position */}
                        <Circle cx={indicatorX} cy={indicatorY} r={6} fill="#FFFFFF"/>
                        <Circle cx={indicatorX} cy={indicatorY} r={3} fill="#1E293B"/>
                    </Svg>
                    <View style={styles.gaugeCenter}>
                        <View style={styles.valueRow}>
                            <Text style={styles.valueText}>{displayValue}</Text>
                            <Text style={styles.valueUnit} variant={'caption'}>%</Text>
                        </View>
                    </View>
                </View>
            </CardContent>
            <CardFooter>
                <Text variant={'caption'} style={styles.note}>{derivedNote}</Text>
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
