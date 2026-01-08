import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS } from '../../styles/theme';

interface CircularProgressProps {
    size?: number;
    strokeWidth?: number;
    progress: number; // 0 to 100
    color?: string;
    showPercentage?: boolean;
    textStyle?: object;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress: React.FC<CircularProgressProps> = ({
    size = 120,
    strokeWidth = 10,
    progress,
    color = COLORS.brand.accent,
    showPercentage = true,
    textStyle
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const animatedProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progress,
            duration: 500, // Smooth transition for updates
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // SVG props often don't support native driver
        }).start();
    }, [progress]);

    // Derived value for strokeDashoffset
    // strokeDashoffset = circumference - (progress / 100) * circumference
    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={COLORS.surface}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Progress Circle */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>

            {showPercentage && (
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={styles.centerTextContainer}>
                        <Text style={[styles.percentageText, { color }, textStyle]}>
                            {Math.round(progress)}%
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    centerTextContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontFamily: FONTS.heading,
        fontSize: 24,
    }
});
