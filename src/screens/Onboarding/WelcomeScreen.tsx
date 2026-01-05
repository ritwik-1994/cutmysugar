import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';

export default function WelcomeScreen() {
    const navigation = useNavigation<NavigationProps>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>
                        {STRINGS.ONBOARDING.WELCOME.TITLE}
                    </Text>
                    <Text style={styles.subtitle}>
                        {STRINGS.ONBOARDING.WELCOME.SUBTITLE}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Button
                        title={STRINGS.ONBOARDING.WELCOME.CTA}
                        onPress={() => navigation.navigate('Problem')}
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
    logo: {
        width: 120,
        height: 120,
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 40,
        color: COLORS.brand.primary,
        marginBottom: SPACING.m,
        lineHeight: 48,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 20,
        color: COLORS.textSecondary,
        lineHeight: 28,
    },
    footer: {
        marginBottom: SPACING.xl,
    },
    button: {
        width: '100%',
    },
});
