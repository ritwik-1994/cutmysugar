import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useBrowserTranslation } from '../../context/BrowserTranslationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SHADOWS, SIZES } from '../../styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const BrowserTranslationToggle: React.FC = () => {
    const { enabled, setEnabled } = useBrowserTranslation();

    const handlePress = (targetState: boolean) => {
        if (enabled !== targetState) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setEnabled(targetState);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                {/* English Option */}
                <TouchableOpacity
                    style={[styles.option, !enabled && styles.activeOption]}
                    onPress={() => handlePress(false)}
                    activeOpacity={0.8}
                >
                    {!enabled && (
                        <LinearGradient
                            colors={COLORS.metallic.textGradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <Text style={[styles.text, !enabled ? styles.activeText : styles.inactiveText]}>
                        English
                    </Text>
                </TouchableOpacity>

                {/* Hindi Option */}
                <TouchableOpacity
                    style={[styles.option, enabled && styles.activeOption]}
                    onPress={() => handlePress(true)}
                    activeOpacity={0.8}
                >
                    {enabled && (
                        <LinearGradient
                            colors={COLORS.metallic.textGradient as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <Text style={[styles.text, enabled ? styles.activeText : styles.inactiveText]}>
                        हिंदी
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        alignItems: 'center',
    },
    track: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)', // Glassy inactive track
        borderRadius: SIZES.borderRadius.xl,
        padding: 4,
        borderColor: COLORS.glassBorder,
        borderWidth: 1,
        width: 200,
        height: 44,
    },
    option: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: SIZES.borderRadius.l,
        overflow: 'hidden',
    },
    activeOption: {
        ...SHADOWS.light,
    },
    text: {
        fontFamily: FONTS.bodyBold,
        fontSize: 14,
        zIndex: 1, // Ensure text is above gradient
    },
    activeText: {
        color: '#FFFFFF',
    },
    inactiveText: {
        color: COLORS.textSecondary,
    },
});
