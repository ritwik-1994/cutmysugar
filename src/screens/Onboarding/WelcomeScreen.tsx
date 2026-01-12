import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';
import { useAuth } from '../../context/AuthContext';

export default function WelcomeScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<NavigationProps>();
    const [name, setName] = useState('');
    const [inlineError, setInlineError] = useState<string | null>(null);

    useEffect(() => {
        // CLEANUP: Start fresh. Nuke any stale intents.
        const cleanup = async () => {
            // console.log("WelcomeScreen: Cleaning stale auth intents.");
            await AsyncStorage.removeItem('auth_intent');
            await AsyncStorage.removeItem('auth_error');
        };
        cleanup();

        // Check for Auth Errors (e.g. Google Login Rejected)
        AsyncStorage.getItem('auth_error').then(err => {
            if (err === 'USER_NOT_FOUND_GOOGLE') {
                // Clear it so it doesn't show again
                AsyncStorage.removeItem('auth_error');

                // Show UI Feedback Inline
                setInlineError("Account Not Found. Please Sign Up.");

                // Auto-hide after 5 seconds
                setTimeout(() => setInlineError(null), 5000);
            }
        });

        // Pre-fill if they went back OR if they are already auth'd (e.g. Google)
        if (user?.name) {
            setName(user.name);
        } else {
            AsyncStorage.getItem('temp_user_name').then(val => {
                if (val) setName(val);
            });
        }
    }, [user]);

    const handleContinue = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name to continue.');
            return;
        }
        await AsyncStorage.setItem('temp_user_name', name.trim());
        navigation.navigate('Problem');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>
                        {user ? "Almost there! \uD83C\uDF89" : "Cutting sugar is easy with CutMySugar"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {user ? "Let's finish setting up your profile." : "Let's get to know you. What should we call you?"}
                    </Text>

                    {/* Inline Error Message */}
                    {inlineError && (
                        <View style={{ marginBottom: 20, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5', width: '100%', maxWidth: 320 }}>
                            <Text style={{ color: '#DC2626', textAlign: 'center', fontFamily: FONTS.medium }}>
                                {inlineError}
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your name"
                            placeholderTextColor={COLORS.textTertiary}
                            value={name}
                            onChangeText={setName}
                            autoCorrect={false}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title={STRINGS.ONBOARDING.WELCOME.CTA}
                        onPress={handleContinue}
                        style={styles.button}
                        disabled={!name.trim()}
                    />

                    <Button
                        title="I already have an account"
                        onPress={() => {
                            console.log("WelcomeScreen: Navigating to Login with isRegistering=false");
                            navigation.navigate('Login', { isRegistering: false });
                        }}
                        variant="ghost"
                        style={{ marginTop: 12 }}
                    />
                </View>
            </KeyboardAvoidingView>
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
        width: 100,
        height: 100,
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 32,
        color: COLORS.brand.primary,
        marginBottom: SPACING.m,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: FONTS.medium,
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.m,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 320,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        fontSize: 18,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        textAlign: 'center',
    },
    footer: {
        marginBottom: SPACING.l,
        width: '100%',
    },
    button: {
        width: '100%',
    },
});
