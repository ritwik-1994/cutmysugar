import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { COLORS, FONTS, SPACING } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';
import { Camera } from 'lucide-react-native';

export default function PermissionsScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [permission, requestPermission] = useCameraPermissions();

    console.log('[PermissionsScreen] Render. Permission Status:', permission?.status, 'Granted:', permission?.granted, 'CanAskAgain:', permission?.canAskAgain);

    const handlePermission = async () => {
        console.log('[PermissionsScreen] handlePermission called');
        if (permission?.granted) {
            console.log('[PermissionsScreen] Permission already granted, navigating to Login');
            navigation.navigate('Login', { isRegistering: true });
        } else {
            console.log('[PermissionsScreen] Requesting permission...');
            try {
                const result = await requestPermission();
                console.log('[PermissionsScreen] Request result:', result);
                if (result.granted) {
                    console.log('[PermissionsScreen] Permission granted after request, navigating to Login');
                    navigation.navigate('Login', { isRegistering: true });
                } else {
                    console.log('[PermissionsScreen] Permission denied or dismissed');

                    // Optional: Alert the user if they denied it
                    if (!result.canAskAgain) {
                        alert('Camera permission is required. Please enable it in your device settings.');
                    }
                }
            } catch (e) {
                console.error('[PermissionsScreen] Error requesting permission:', e);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Camera size={64} color={COLORS.brand.primary} />
                    </View>
                    <Text style={styles.title}>
                        {STRINGS.ONBOARDING.PERMISSIONS.TITLE}
                    </Text>
                    <Text style={styles.subtitle}>
                        {STRINGS.ONBOARDING.PERMISSIONS.SUBTITLE}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.note}>
                        {STRINGS.ONBOARDING.PERMISSIONS.NOTE}
                    </Text>
                    <Button
                        title={STRINGS.ONBOARDING.PERMISSIONS.CTA}
                        onPress={handlePermission}
                        style={styles.button}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SPACING.l,
        justifyContent: 'space-between',
    },
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.xl,
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        borderRadius: 100,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 32,
        color: COLORS.text,
        marginBottom: SPACING.m,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: SPACING.m,
    },
    footer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    note: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginBottom: SPACING.m,
        paddingHorizontal: SPACING.l,
    },
    button: {
        width: '100%',
    },
});
