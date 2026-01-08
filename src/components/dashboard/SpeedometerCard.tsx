import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    useAnimatedProps,
    withRepeat,
    withSequence,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { Zap, Activity } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../styles/theme';
import { STRINGS } from '../../constants/strings';

// Animated components
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SpeedometerCardProps {
    budget: number;
    consumed: number;
    spikes: number;
    energyStability: string;
    onPress?: () => void;
}

export const SpeedometerCard = ({ budget, consumed, spikes, energyStability, onPress }: SpeedometerCardProps) => {
    const { width: windowWidth } = useWindowDimensions();

    // 1. Animation State (Ratio 0 -> 1+)
    const progress = useSharedValue(0);
    const shake = useSharedValue(0);
    const pulse = useSharedValue(0.2);
    const bgPulse = useSharedValue(0);

    const percentage = Math.round((consumed / budget) * 100);
    const ratio = consumed / budget;
    // "Pegged" Meter: Visual cap at 100% (1.0) for System Overload feeling
    const displayRatio = Math.min(ratio, 1.0);

    useEffect(() => {
        // Weighted, premium feel
        progress.value = withSpring(displayRatio, {
            damping: 20,
            stiffness: 90,
            mass: 2 // Heavier needle
        });

        // "System Overload" Effects
        if (ratio >= 1.0) {
            // Violent Tension Vibration (Pegged against the stop)
            shake.value = withRepeat(
                withSequence(
                    withTiming(-3, { duration: 40 }),
                    withTiming(3, { duration: 40 }),
                    withTiming(-2, { duration: 30 }),
                    withTiming(2, { duration: 30 }),
                    withTiming(0, { duration: 50 })
                ),
                -1, // Infinite loop
                true
            );

            // Red Alert Background Pulse (Standard pulse for components)
            pulse.value = withRepeat(
                withTiming(1, { duration: 600 }),
                -1,
                true
            );

            // Background Tint Pulse
            bgPulse.value = withRepeat(
                withTiming(1, { duration: 800 }),
                -1,
                true
            );
        } else {
            shake.value = withSpring(0);
            pulse.value = withSpring(0.2); // Dim when safe
            bgPulse.value = withSpring(0);
        }
    }, [displayRatio, ratio]);

    // 2. Geometry & Responsive Logic
    const BASE_WIDTH = 340;
    const BASE_HEIGHT = 180;

    // Responsive calculations
    // Card padding is SPACING.m (16) * 2 = 32, plus container margins/safe area? 
    // Let's assume ~48px total horizontal deduction for a safe responsive fit.
    const maxCardWidth = 600;
    const cardContentWidth = Math.min(windowWidth - 48, maxCardWidth);
    const scale = cardContentWidth / BASE_WIDTH;

    // SVG Dimensions (Physical size on screen)
    const svgWidth = cardContentWidth;
    const svgHeight = BASE_HEIGHT * scale;

    // Internal Grid (Keep these fixed to preserve geometry logic, we scale via viewBox/transforms)
    const cx = BASE_WIDTH / 2;
    const cy = 160;
    const radius = 120;
    const strokeWidth = 24;

    // 3. Helpers
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        // -180 deg = Left, 0 deg = Right
        const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };

    // 4. Arc Angles (-180 to 0 is the main 100%)
    const arcMain = describeArc(cx, cy, radius, -180, 0);

    // 5. Needle Rotation Logic
    const animatedNeedleStyle = useAnimatedStyle(() => {
        // Map 0..1 to -180..0 (Strict 180 degree range)
        const rotation = (progress.value * 180) - 180;
        return {
            transform: [
                { translateX: shake.value },
                { scale: scale }, // Scale the needle to match SVG
                { rotate: `${rotation}deg` }
            ]
        };
    });

    // Interpolate color: Slate -> Orange -> Red
    const animatedNeedleColorStyle = useAnimatedStyle(() => {
        const bgColor = interpolateColor(
            progress.value,
            [0.8, 1.0], // Max out at 1.0
            [COLORS.text, COLORS.sugarScore.criticalText]
        );
        return { backgroundColor: bgColor };
    });

    // Background Warning Tint
    const animatedBgStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            bgPulse.value,
            [0, 1],
            ['transparent', 'rgba(239, 68, 68, 0.15)'] // Subtle Red Tint
        );
        return { backgroundColor };
    });

    // 6. Status Logic
    let statColor = COLORS.sugarScore.safeText;
    let statText = "Safe Zone";

    if (percentage > 100) {
        statColor = COLORS.sugarScore.criticalText;
        statText = "SYSTEM OVERLOAD";
    } else if (percentage >= 80) {
        statColor = '#F97316';
        statText = "Near Limit";
    } else if (percentage >= 50) {
        statColor = '#EAB308';
        statText = "Caution";
    }

    // Dynamic Gradient Logic based on percentage
    const getGradientColor = () => {
        if (percentage > 100) return ['#EF4444', '#991B1B']; // Deep Red for Overload
        if (percentage > 80) return ['#F97316', '#EA580C']; // Orange
        if (percentage > 50) return ['#EAB308', '#CA8A04']; // Yellow
        return ['#22C55E', '#15803D']; // Green
    }
    const gradientColors = getGradientColor();
    // Unique ID for the gradient to prevent conflicts
    const gradId = React.useMemo(() => `speedometer-grad-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
            <Card style={[styles.card, { overflow: 'hidden' }]} variant="solid">

                {/* Alert Background Overlay */}
                <AnimatedView style={[StyleSheet.absoluteFill, animatedBgStyle]} pointerEvents="none" />

                {/* Header */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerLabel}>DAILY LIMIT</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                            <Text style={styles.headerValue}>{consumed}</Text>
                            <Text style={styles.headerSub}>/ {budget} {STRINGS.METRICS.SUGAR_SCORE}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statColor + '15' }]}>
                        <Text style={[styles.badgeText, { color: statColor }]}>{statText}</Text>
                    </View>
                </View>

                {/* Gauge Area - Wrapper for strict coordinates */}
                <View style={[styles.gaugeArea, { height: svgHeight + 10 }]}>

                    {/* The Coordinate Root: Strictly sized to match SVG logic */}
                    <View style={{ width: svgWidth, height: svgHeight, position: 'relative' }}>

                        {/* 1. The Gauge SVG */}
                        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                            <Defs>
                                <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0" stopColor={percentage > 100 ? gradientColors[0] : "#22C55E"} />
                                    <Stop offset="0.5" stopColor={percentage > 100 ? gradientColors[0] : "#EAB308"} />
                                    <Stop offset="1" stopColor={percentage > 100 ? gradientColors[1] : "#F97316"} />
                                </LinearGradient>
                            </Defs>

                            {/* Background Track */}
                            <Path d={arcMain} stroke={COLORS.background} strokeWidth={strokeWidth} strokeOpacity={0.5} fill="none" />
                            {/* Active Track */}
                            <Path d={arcMain} stroke={`url(#${gradId})`} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />

                            {/* Decorations */}
                            <Circle cx={cx - radius - 18} cy={cy} r={4} fill={COLORS.textTertiary} opacity={0.5} />
                            <Circle cx={cx + radius + 18} cy={cy} r={4} fill={COLORS.textTertiary} opacity={0.5} />
                        </Svg>

                        {/* 2. The Needle - Positioned relative to Coordinate Root */}
                        <AnimatedView style={[
                            styles.needleContainer,
                            {
                                left: '50%', // Strictly center X
                                top: cy * scale // Scaled Y position
                            },
                            animatedNeedleStyle
                        ]}>
                            {/* The needle shape drawn with Views */}
                            <AnimatedView style={[styles.needleBody, animatedNeedleColorStyle]} />
                            <View style={styles.needleHub} />
                            <View style={styles.needleHubInner} />
                        </AnimatedView>

                        {/* 3. Labels - Scaled and Positioned relative to Root */}
                        <View style={[styles.labelsContainer, { transform: [{ scale }] }]}>
                            <Text style={[styles.tickLabel, { left: 24, bottom: 20 }]}>0%</Text>
                            <Text style={[styles.tickLabel, { alignSelf: 'center', top: 5 }]}>50%</Text>
                            <Text style={[styles.tickLabel, { right: 24, bottom: 20 }]}>100%</Text>
                        </View>

                        {/* 4. Overload Icon */}
                        {percentage > 100 && (
                            <View style={{ position: 'absolute', bottom: 40 * scale, left: 0, right: 0, alignItems: 'center' }}>
                                <Text style={{ fontSize: 28 * scale }}>⚠️</Text>
                            </View>
                        )}

                    </View>
                </View>

                {/* New Dashboard Footer */}
                <View style={styles.dashboardFooter}>
                    {/* Spikes Metric */}
                    <View style={styles.metricItem}>
                        <View style={styles.metricIconBg}>
                            <Zap size={20} color={COLORS.text} />
                        </View>
                        <View>
                            <Text style={styles.metricValue}>{spikes} Spikes</Text>
                            <Text style={styles.metricLabel}>{spikes === 0 ? "Perfect" : spikes > 2 ? "High Risk" : "Moderate"}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Stability Metric */}
                    <View style={styles.metricItem}>
                        <View style={[styles.metricIconBg, { backgroundColor: '#E0F2FE' }]}>
                            <Activity size={20} color={COLORS.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{energyStability}</Text>
                            <Text style={styles.metricLabel}>Energy Flow</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Usage Metric */}
                    <View style={styles.metricItem}>
                        <View style={[styles.metricIconBg, { backgroundColor: '#F3E8FF' }]}>
                            <Text style={{ fontSize: 16 }}>📊</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{percentage}%</Text>
                            <Text style={styles.metricLabel}>Used</Text>
                        </View>
                    </View>
                </View>

            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: SPACING.m,
        marginBottom: SPACING.l,
        borderRadius: 28,
        backgroundColor: COLORS.surface,
        ...SHADOWS.medium,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs
    },
    headerLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: 2
    },
    headerValue: {
        fontFamily: FONTS.heading,
        fontSize: 34,
        color: COLORS.text,
        lineHeight: 40
    },
    headerSub: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 4
    },
    badgeText: {
        fontFamily: FONTS.bodyBold,
        fontSize: 12,
        letterSpacing: 0.5,
    },
    gaugeArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        position: 'relative'
    },
    needleContainer: {
        position: 'absolute',
        width: 0, // Zero width to act as a pivot point
        height: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    needleBody: {
        position: 'absolute',
        top: -4,
        left: 0,
        width: 130, // Length
        height: 8,
        backgroundColor: COLORS.text,
        borderRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    needleHub: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 4,
        borderColor: COLORS.text,
        top: -12,
        left: -12
    },
    needleHubInner: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.brand.primary,
        top: -4,
        left: -4
    },
    labelsContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    tickLabel: {
        position: 'absolute',
        fontFamily: FONTS.bodyBold,
        fontSize: 11,
        color: COLORS.textTertiary,
        opacity: 0.8
    },
    dashboardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.s,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        marginBottom: SPACING.xs
    },
    metricItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-start'
    },
    metricIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricValue: {
        fontFamily: FONTS.heading,
        fontSize: 14,
        color: COLORS.text,
    },
    metricLabel: {
        fontFamily: FONTS.medium,
        fontSize: 10,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.divider,
        marginHorizontal: 8
    }
});
