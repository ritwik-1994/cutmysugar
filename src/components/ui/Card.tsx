import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../styles/theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'glass' | 'solid';
}

export const Card = ({ children, style, variant = 'glass' }: CardProps) => {
    return (
        <View
            style={[
                styles.container,
                variant === 'glass' ? styles.glass : styles.solid,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZES.borderRadius.l,
        padding: 20,
        overflow: 'hidden',
    },
    glass: {
        backgroundColor: COLORS.glass,
        borderColor: COLORS.glassBorder,
        borderWidth: 1,
    },
    solid: {
        backgroundColor: COLORS.surface,
        ...SHADOWS.light,
    },
});
