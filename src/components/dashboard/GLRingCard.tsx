import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card } from '../ui/Card';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { STRINGS } from '../../constants/strings';

interface GLRingCardProps {
    budget: number;
    consumed: number;
    onPress?: () => void;
}

export const GLRingCard = ({ budget, consumed, onPress }: GLRingCardProps) => {
    const remaining = Math.max(0, budget - consumed);
    const percentage = Math.min(100, (consumed / budget) * 100);

    // Ring Configuration
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color Logic
    let ringColor = COLORS.gl.safe; // Green < 60%
    if (percentage >= 60) ringColor = COLORS.gl.warning; // Amber 60-90%
    if (percentage > 90) ringColor = COLORS.gl.critical; // Red > 90%

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
            <Card style={styles.container} variant="solid">
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>{STRINGS.HOME.SUMMARY.TITLE}</Text>
                        <Text style={styles.value}>{remaining}</Text>
                        <Text style={styles.unit}>of {budget} limit</Text>
                    </View>

                    <View style={styles.ringContainer}>
                        <Svg width={size} height={size} style={styles.ring}>
                            {/* Background Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={COLORS.surfaceLight}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={ringColor}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                rotation="-90"
                                origin={`${size / 2}, ${size / 2}`}
                            />
                        </Svg>
                        <View style={styles.ringInner}>
                            <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
                            <Text style={styles.percentageLabel}>Used</Text>
                        </View>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.s,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontFamily: FONTS.heading,
        fontSize: 48,
        color: COLORS.text,
        lineHeight: 56,
    },
    unit: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textTertiary,
    },
    ringContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        transform: [{ rotateZ: '0deg' }], // Fix for some android svg issues
    },
    ringInner: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentage: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
    },
    percentageLabel: {
        fontFamily: FONTS.body,
        fontSize: 10,
        color: COLORS.textSecondary,
    },
});
