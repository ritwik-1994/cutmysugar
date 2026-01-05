import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../styles/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    loading = false,
    disabled = false,
    icon,
}: ButtonProps) => {
    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost ? COLORS.primary : '#FFF'} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text
                        style={[
                            styles.text,
                            isOutline && styles.textOutline,
                            isGhost && styles.textGhost,
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </>
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading || disabled}
            activeOpacity={0.7}
            style={[
                styles.container,
                isPrimary && styles.primary,
                isOutline && styles.outline,
                isGhost && styles.ghost,
                disabled && styles.disabled,
                style,
            ]}
        >
            {content}
        </TouchableOpacity>
    );
};



const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: SIZES.borderRadius.xl,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 24,
    },
    primary: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    ghost: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowOpacity: 0,
        elevation: 0,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    textOutline: {
        color: COLORS.primary,
    },
    textGhost: {
        color: COLORS.textSecondary,
    },
});
