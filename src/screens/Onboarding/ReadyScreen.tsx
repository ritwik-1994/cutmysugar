import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';
import { Rocket } from 'lucide-react-native';
export default function ReadyScreen() {
    const navigation = useNavigation<NavigationProps>();

    const handleStart = async () => {
        // Navigate to setup flow
        navigation.navigate('Preferences');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    </View>
                    <Text style={styles.title}>
                        {STRINGS.ONBOARDING.READY.TITLE}
                    </Text>
                    <Text style={styles.subtitle}>
                        {STRINGS.ONBOARDING.READY.SUBTITLE}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Button
                        title={STRINGS.ONBOARDING.READY.CTA}
                        onPress={handleStart}
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
    logo: {
        width: 80,
        height: 80,
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
    },
    button: {
        width: '100%',
    },
});
