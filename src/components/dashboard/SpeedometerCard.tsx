import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { Zap, Activity, TrendingUp, Droplet, Box } from 'lucide-react-native';
import { ShimmerGradient } from '../ui/ShimmerGradient';

import { COLORS, FONTS, SPACING, SHADOWS } from '../../styles/theme';

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
const STROKE_WIDTH = 28; // Slightly thicker for premium feel

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
            [COLORS.text, COLORS.danger]
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
    let statBg = COLORS.sugarScore.safe;
    let statText = "Safe";

    if (percentage > 100) {
        statColor = COLORS.sugarScore.criticalText;
        statBg = COLORS.sugarScore.danger;
        statText = "Over Limit";
    } else if (percentage >= 50) {
        statColor = COLORS.sugarScore.warningText;
        statBg = COLORS.sugarScore.warning;
        statText = "Watch Out";
    }

    // Dynamic Gradient Logic (Blood Range)
    const gradientColors = useMemo(() => {
        // Safe (Green) -> Warning (Amber) -> Danger (Blood Red)
        return ['#10B981', '#F59E0B', '#BE123C'];
    }, []);

    const gradId = useMemo(() => `speedometer-grad-${Math.random().toString(36).substr(2, 9)}`, []);
    const bezelGradId = useMemo(() => `bezel-grad-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={COLORS.metallic.roseGold as any} // Metallic Rose Gold
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                >
                    {/* Active Shimmer Overlay */}
                    <ShimmerGradient
                        colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                        duration={3000}
                        style={{ opacity: 0.3 }}
                    />

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerLabel}>DAILY GLUCOSE BUDGET</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                <Text style={styles.headerValue}>{consumed}</Text>
                                <Text style={styles.headerSub}>/ {budget} GL</Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statBg }]}>
                            <Text style={[styles.badgeText, { color: statColor }]}>{statText}</Text>
                        </View>
                    </View>

                    {/* Gauge Area */}
                    <View style={[styles.gaugeArea, { height: svgHeight + 10 }]}>
                        {/* Glow Effect (Blood Glow) */}
                        <View style={{
                            position: 'absolute',
                            width: 200, height: 200,
                            borderRadius: 100,
                            backgroundColor: percentage > 100 ? COLORS.danger : COLORS.brand.primary,
                            opacity: 0.1,
                            transform: [{ scale: 1.2 }],
                            top: 20
                        }} />

                        {/* Coordinate Root */}
                        <View style={{ width: svgWidth, height: svgHeight, position: 'relative' }}>

                            {/* Gauge SVG */}
                            <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`} style={{ position: 'absolute', top: 0, left: 0 }}>
                                <Defs>
                                    <SvgLinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                                        <Stop offset="0" stopColor="#10B981" />
                                        <Stop offset="0.5" stopColor="#FACC15" />
                                        <Stop offset="0.75" stopColor="#F97316" />
                                        <Stop offset="1" stopColor="#BE123C" />
                                    </SvgLinearGradient>

                                    {/* Gold Chrome Bezel Gradient */}
                                    <SvgLinearGradient id={bezelGradId} x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor="#FFF1F2" />
                                        <Stop offset="0.25" stopColor="#FECDD3" />
                                        <Stop offset="0.5" stopColor="#F43F5E" />
                                        <Stop offset="0.75" stopColor="#FECDD3" />
                                        <Stop offset="1" stopColor="#FFF1F2" />
                                    </SvgLinearGradient>
                                </Defs>

                                {/* Metallic Bezel Ring */}
                                <Path
                                    d={ARC_MAIN}
                                    stroke={`url(#${bezelGradId})`}
                                    strokeWidth={STROKE_WIDTH + 6} // Thicker chrome rim
                                    strokeLinecap="round"
                                    fill="none"
                                    opacity={0.8}
                                />

                                {/* Inner Shadow for depth */}
                                <Path
                                    d={ARC_MAIN}
                                    stroke={COLORS.metallic.borderShadow}
                                    strokeWidth={STROKE_WIDTH + 8}
                                    strokeLinecap="round"
                                    fill="none"
                                    opacity={0.2}
                                    y={2} // Offset Y
                                />

                                {/* Background Track */}
                                <Path d={ARC_MAIN} stroke="#FECDD3" strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none" opacity={0.3} />
                                {/* Active Track */}
                                <Path d={ARC_MAIN} stroke={`url(#${gradId})`} strokeWidth={STROKE_WIDTH} fill="none" strokeLinecap="round" />
                                <Path d={ARC_MAIN} stroke={`url(#${gradId})`} strokeWidth={STROKE_WIDTH} fill="none" strokeLinecap="round" strokeDasharray={`${Math.PI * RADIUS}`} strokeDashoffset={`${Math.PI * RADIUS * (1 - displayRatio)}`} />

                                {/* Labels */}
                                <SvgText x={CX - RADIUS - 25} y={CY + 10} fill={COLORS.textSecondary} fontSize="12" fontWeight="600" textAnchor="middle">0%</SvgText>
                                <SvgText x={CX + RADIUS + 25} y={CY + 10} fill={COLORS.textSecondary} fontSize="12" fontWeight="600" textAnchor="middle">100%</SvgText>
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

                            {/* Icons: Blood (Danger) or Sugar Cubes (Safe/Warn) */}
                            {percentage > 100 ? (
                                <View style={{ position: 'absolute', bottom: 40 * scale, left: 0, right: 0, alignItems: 'center' }}>
                                    <Droplet size={28 * scale} color={COLORS.danger} fill={COLORS.danger} />
                                </View>
                            ) : (
                                <View style={{ position: 'absolute', bottom: 40 * scale, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                                    {/* 1 Cube: Always shown if < 100% (Safe) */}
                                    <Box size={20 * scale} color={COLORS.textTertiary} strokeWidth={2.5} />

                                    {/* 2 Cubes: Shown if >= 50% (OK/Warning) */}
                                    {percentage >= 50 && (
                                        <Box size={20 * scale} color={COLORS.sugarScore.warningText} strokeWidth={2.5} />
                                    )}

                                    {/* 3 Cubes: Shown if >= 80% (Risky) */}
                                    {percentage >= 80 && (
                                        <Box size={20 * scale} color={COLORS.sugarScore.criticalText} strokeWidth={2.5} />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Dashboard Footer */}
                    <View style={styles.dashboardFooter}>
                        {/* Spikes */}
                        <View style={styles.metricItem}>
                            <View style={[styles.metricIconBg, { backgroundColor: COLORS.surfaceLight }]}>
                                <Activity size={18} color={COLORS.text} />
                            </View>
                            <View>
                                <Text style={styles.metricValue}>{spikes}</Text>
                                <Text style={styles.metricLabel}>Spikes</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Stability */}
                        <View style={styles.metricItem}>
                            <View style={[styles.metricIconBg, { backgroundColor: COLORS.surfaceLight }]}>
                                <Zap size={18} color={COLORS.text} />
                            </View>
                            <View>
                                <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{energyStability}</Text>
                                <Text style={styles.metricLabel}>Energy</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Usage */}
                        <View style={styles.metricItem}>
                            <View style={[styles.metricIconBg, { backgroundColor: COLORS.surfaceLight }]}>
                                <Droplet size={18} color={COLORS.text} />
                            </View>
                            <View>
                                <Text style={styles.metricValue}>{percentage}%</Text>
                                <Text style={styles.metricLabel}>Load</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: SPACING.l,
        borderRadius: 24,
        ...SHADOWS.medium, // Premium soft shadow
        backgroundColor: COLORS.surface, // Fallback
    },
    cardGradient: {
        padding: SPACING.m,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight, // Rose 700
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.s
    },
    headerLabel: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.textTertiary,
        letterSpacing: 1.5,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    headerValue: {
        fontFamily: FONTS.heading,
        fontSize: 36,
        color: COLORS.text,
        letterSpacing: -1
    },
    headerSub: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textTertiary,
        marginBottom: 6
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 4
    },
    badgeText: {
        fontFamily: FONTS.bodyBold,
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    gaugeArea: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.s,
        position: 'relative'
    },
    needleContainer: {
        position: 'absolute',
        width: 0,
        height: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    },
    needleBody: {
        position: 'absolute',
        top: -4,
        left: 0,
        width: 125,
        height: 8,
        borderRadius: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    needleHub: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        borderWidth: 4,
        borderColor: COLORS.text,
        top: -10,
        left: -10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    needleHubInner: {
        position: 'absolute',
        width: 0,
        height: 0,
        // Removed inner hub for cleaner look
    },
    dashboardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.l,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    metricItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center'
    },
    metricIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricValue: {
        fontFamily: FONTS.subheading,
        fontSize: 15,
        color: COLORS.text,
    },
    metricLabel: {
        fontFamily: FONTS.medium,
        fontSize: 10,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        marginTop: 1
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.divider,
    }
});
