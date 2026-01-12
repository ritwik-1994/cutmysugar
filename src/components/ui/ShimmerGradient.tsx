import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

interface ShimmerGradientProps {
    colors?: string[];
    style?: StyleProp<ViewStyle>;
    duration?: number;
    delay?: number;
}

export const ShimmerGradient = ({
    colors = ['transparent', 'rgba(255,255,255,0.5)', 'transparent'],
    style,
    duration = 2500,
    delay = 1000
}: ShimmerGradientProps) => {
    const translateX = useSharedValue(-100);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(200, {
                duration: duration,
                easing: Easing.linear,
            }),
            -1, // Infinite
            false
        );
        return () => {
            cancelAnimation(translateX);
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: `${translateX.value}%` }]
        };
    });

    return (
        <View style={[styles.container, style]} pointerEvents="none">
            <Animated.View style={[styles.shimmer, animatedStyle]}>
                <LinearGradient
                    colors={colors as any}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        borderRadius: 'inherit' as any, // Try to inherit parent radius
    },
    shimmer: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    }
});
