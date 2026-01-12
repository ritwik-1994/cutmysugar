import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
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

// ------------------------------------------------------------------
// 1. Static Geometry & Helpers (Optimized: Defined once)
// ------------------------------------------------------------------
const BASE_WIDTH = 340;
const BASE_HEIGHT = 180;
const CX = BASE_WIDTH / 2;
const CY = 160;
const RADIUS = 120;
const STROKE_WIDTH = 24;

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
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

// Pre-calculate the main arc string since geometry is fixed relative to BASE size
const ARC_MAIN = describeArc(CX, CY, RADIUS, -180, 0);

interface SpeedometerCardProps {
    budget: number;
    consumed: number;
    spikes: number;
    energyStability: string;
    onPress?: () => void;
}

export const SpeedometerCard = ({ budget, consumed, spikes, energyStability, onPress }: SpeedometerCardProps) => {
    const { width: windowWidth } = useWindowDimensions();

    // 2. Animation State (Ratio 0 -> 1+)
    const progress = useSharedValue(0);
    const shake = useSharedValue(0);
    const pulse = useSharedValue(0.2);
    const bgPulse = useSharedValue(0);

    const percentage = Math.round((consumed / budget) * 100);
    const ratio = consumed / budget;
    // "Pegged" Meter: Max out at 1.0
    const displayRatio = Math.min(ratio, 1.0);

    useEffect(() => {
        // Weighted, premium feeling needle movement
        progress.value = withSpring(displayRatio, {
            damping: 20,
            stiffness: 90,
            mass: 2
        });

        // "System Overload" Effects for > 100%
        if (ratio >= 1.0) {
            // Violent Tension Vibration
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

            // Red Alert Background Pulse
            pulse.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);

            // Background Tint Pulse
            bgPulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
        } else {
            shake.value = withSpring(0);
            pulse.value = withSpring(0.2);
            bgPulse.value = withSpring(0);
        }
    }, [displayRatio, ratio]);

    // 3. Responsive Scaling
    // Card padding is ~32px, plus container margins => ~48px deduction safe.
    const maxCardWidth = 600;
    const cardContentWidth = Math.min(windowWidth - 48, maxCardWidth);
    const scale = cardContentWidth / BASE_WIDTH;

    // SVG Dimensions (Physical size on screen)
    const svgWidth = cardContentWidth;
    const svgHeight = BASE_HEIGHT * scale;

    // 4. Animated Styles
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

    const animatedNeedleColorStyle = useAnimatedStyle(() => {
        const bgColor = interpolateColor(
            progress.value,
            [0.8, 1.0], // Max out at 1.0
            [COLORS.text, COLORS.sugarScore.criticalText]
        );
        return { backgroundColor: bgColor };
    });

    const animatedBgStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            bgPulse.value,
            [0, 1],
            ['transparent', 'rgba(239, 68, 68, 0.15)'] // Subtle Red Tint
        );
        return { backgroundColor };
    });

    // 5. Status Logic (Safe/Risky/Danger)
    let statColor = COLORS.sugarScore.safeText;
    let statText = "Safe";

    if (percentage > 100) {
        statColor = COLORS.sugarScore.criticalText;
        statText = "Danger";
    } else if (percentage >= 50) {
        statColor = '#F97316'; // Orange
        statText = "Risky";
    } else {
        statText = "OK"; // < 50%
    }

    // Dynamic Gradient Logic
    const gradientColors = useMemo(() => {
        if (percentage > 100) return ['#EF4444', '#991B1B']; // Deep Red
        if (percentage >= 50) return ['#F97316', '#EA580C']; // Orange
        return ['#22C55E', '#15803D']; // Green
    }, [percentage]);

    const gradId = useMemo(() => `speedometer-grad-${Math.random().toString(36).substr(2, 9)}`, []);

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

                {/* Gauge Area */}
                <View style={[styles.gaugeArea, { height: svgHeight + 10 }]}>

                    {/* Coordinate Root */}
                    <View style={{ width: svgWidth, height: svgHeight, position: 'relative' }}>

                        {/* Gauge SVG */}
                        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                            <Defs>
                                <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0" stopColor={percentage > 100 ? gradientColors[0] : "#22C55E"} />
                                    <Stop offset="0.5" stopColor={percentage > 100 ? gradientColors[0] : "#EAB308"} />
                                    <Stop offset="1" stopColor={percentage > 100 ? gradientColors[1] : "#F97316"} />
                                </LinearGradient>
                            </Defs>

                            {/* Background Track */}
                            <Path d={ARC_MAIN} stroke={COLORS.background} strokeWidth={STROKE_WIDTH} strokeOpacity={0.5} fill="none" />
                            {/* Active Track */}
                            <Path d={ARC_MAIN} stroke={`url(#${gradId})`} strokeWidth={STROKE_WIDTH} fill="none" strokeLinecap="round" />

                            {/* Decorations */}
                            <Circle cx={CX - RADIUS - 18} cy={CY} r={4} fill={COLORS.textTertiary} opacity={0.5} />
                            <Circle cx={CX + RADIUS + 18} cy={CY} r={4} fill={COLORS.textTertiary} opacity={0.5} />

                            {/* Labels (SVG Text) */}
                            {/* Labels (SVG Text) */}
                            <SvgText x={CX - RADIUS - 25} y={CY + 8} fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">Safe</SvgText>
                            <SvgText x={CX} y={CY - RADIUS + 50} fill="#000000" fontSize="14" fontWeight="900" textAnchor="middle">OK</SvgText>
                            <SvgText x={CX + RADIUS + 25} y={CY + 8} fill="#000000" fontSize="12" fontWeight="900" textAnchor="middle">Risky</SvgText>
                        </Svg>

                        {/* Needle */}
                        <AnimatedView style={[
                            styles.needleContainer,
                            {
                                left: '50%', // Strictly center X
                                top: CY * scale // Scaled Y position
                            },
                            animatedNeedleStyle
                        ]}>
                            <AnimatedView style={[styles.needleBody, animatedNeedleColorStyle]} />
                            <View style={styles.needleHub} />
                            <View style={styles.needleHubInner} />
                        </AnimatedView>

                        {/* Overload Icon */}
                        {percentage > 100 && (
                            <View style={{ position: 'absolute', bottom: 40 * scale, left: 0, right: 0, alignItems: 'center' }}>
                                <Text style={{ fontSize: 28 * scale }}>⚠️</Text>
                            </View>
                        )}

                    </View>
                </View>

                {/* Dashboard Footer */}
                <View style={styles.dashboardFooter}>
                    {/* Spikes */}
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

                    {/* Stability */}
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

                    {/* Usage */}
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
