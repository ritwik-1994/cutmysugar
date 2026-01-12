import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../styles/theme';
interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'glass' | 'solid' | 'metallic';
}

export const Card = ({ children, style, variant = 'glass' }: CardProps) => {
    // Determine gradient colors based on variant
    let colors: any[] = ['transparent', 'transparent'];

    if (variant === 'metallic') {
        colors = COLORS.metallic.whiteGold; // Subtle silver/white shine
    } else if (variant === 'glass') {
        // Pseudo-glass using subtle gradient
        colors = ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'];
    } else {
        // Solid
        colors = [COLORS.surface, COLORS.surface];
    }

    return (
        <LinearGradient
            colors={colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.container,
                variant === 'glass' && styles.glass,
                variant === 'solid' && styles.solid,
                variant === 'metallic' && styles.metallic,
                style,
            ]}
        >
            {/* Inner Border for Metallic Feel due to lighter top/darker bottom illusion */}
            {variant === 'metallic' && (
                <View style={styles.innerHighlight} pointerEvents="none" />
            )}
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZES.borderRadius.l,
        padding: 20,
        overflow: 'hidden',
    },
    glass: {
        borderColor: COLORS.glassBorder,
        borderWidth: 1,
    },
    solid: {
        ...SHADOWS.light,
        backgroundColor: COLORS.surface, // Fallback if gradient fails or for consistency
    },
    metallic: {
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.metallic.borderShadow, // Subtle dark border
        // We rely on gradient for bg
    },
    innerHighlight: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: SIZES.borderRadius.l,
        borderWidth: 1,
        borderColor: COLORS.metallic.borderHighlight, // White top highlight
        opacity: 0.5,
    }
});
