import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, NavigationProps } from '../../navigation/types';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PhoneNumberScreen() {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProp<RootStackParamList, 'PhoneNumber'>>();
    console.log("PhoneNumberScreen: Route Params:", route.params);
    const isRegistering = route.params?.isRegistering ?? true;
    console.log("PhoneNumberScreen: Resolved isRegistering =", isRegistering);
    const { signInWithPhone, signInWithMockPhone, verifyOtp, isLoading } = useAuth();
    console.log("PhoneNumberScreen: isLoading =", isLoading);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');

    // OTP state
    const [verificationStep, setVerificationStep] = useState<'phone' | 'otp'>('phone');
    const [otpCode, setOtpCode] = useState('');
    const [resendCountdown, setResendCountdown] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCountdown > 0) {
            interval = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCountdown]);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [mockOtp, setMockOtp] = useState('');

    const handleSendCode = async () => {
        setErrorMessage(null); // Clear previous errors
        console.log("PhoneNumberScreen: handleSendCode pressed");

        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

        if (cleanPhone.length < 10) {
            setErrorMessage('Please enter a valid phone number (at least 10 digits).');
            return;
        }

        // Mock OTP Generation
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        // ... (rest of logic)
        setMockOtp(generatedCode);
        setVerificationStep('otp');
        setResendCountdown(60);

        // Simulate Network Delay
        setTimeout(() => {
            // const msg = `Your code is: ${generatedCode}`;
            // Alert removed as requested. Code is shown on UI.
        }, 500);
    };

    const handleVerifyCode = async () => {
        setErrorMessage(null);
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const fullNumber = `${countryCode}${cleanPhone}`;

        if (otpCode.length < 6) {
            setErrorMessage('Please enter a 6-digit code.');
            return;
        }

        // Verify Mock OTP
        if (otpCode !== mockOtp) {
            setErrorMessage('Invalid code. Please try again.');
            return;
        }

        // Proceed to Mock Login
        // Ensure auth_intent is set for Strict Login checks
        await AsyncStorage.setItem('auth_intent', isRegistering ? 'register' : 'login');

        const { error, session } = await signInWithMockPhone(fullNumber, isRegistering);

        if (error) {
            console.log("Mock Login Failed:", error);
            const msg = error.message || "";

            if (msg === 'USER_NOT_FOUND') {
                // UI Cue: Show error message inline, then redirect
                setErrorMessage("Account not found. Redirecting to sign up...");
                setTimeout(() => {
                    navigation.navigate('Welcome');
                }, 2000);
                return;
            }

            if (msg === 'USER_ALREADY_EXISTS') {
                // UI Cue: Show message inline
                setErrorMessage("Account exists. Logging you in...");

                // Auto Login after short delay
                setTimeout(async () => {
                    const { error: loginError } = await signInWithMockPhone(fullNumber, false);
                    if (loginError) {
                        setErrorMessage(loginError.message || "Login failed.");
                    }
                }, 1500);
                return;
            }

            if (msg.includes("Email not confirmed")) {
                setErrorMessage("Please disable 'Confirm Phone' in Supabase Dashboard.");
            } else {
                setErrorMessage(msg || "Could not sign in.");
            }
        } else {
            // Success
            console.log("Mock Login Success");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* ... Header ... */}
                <View style={styles.header}>
                    <Button
                        title=""
                        onPress={() => {
                            if (verificationStep === 'otp') {
                                setVerificationStep('phone');
                                setErrorMessage(null);
                            } else {
                                navigation.goBack();
                            }
                        }}
                        variant="ghost"
                        style={styles.backButton}
                        icon={<ArrowLeft size={24} color={COLORS.text} />}
                    />
                </View>

                <View style={styles.main}>
                    <Text style={styles.title}>
                        {verificationStep === 'phone' ? "What's your number?" : "Enter verification code"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {verificationStep === 'phone'
                            ? "We'll send you a verification code to secure your account."
                            : `Sent to ${countryCode} ${phoneNumber}`}
                    </Text>

                    {verificationStep === 'phone' ? (
                        <View>
                            <View style={[styles.inputContainer, errorMessage && { borderColor: COLORS.danger }]}>
                                <Text style={{ fontSize: 24, marginRight: 8 }}>
                                    {countryCode === '+91' ? '🇮🇳' : countryCode === '+1' ? '🇺🇸' : '🌍'}
                                </Text>
                                <TextInput
                                    style={styles.countryCodeInput}
                                    value={countryCode}
                                    onChangeText={setCountryCode}
                                    keyboardType="phone-pad"
                                    placeholder="+91"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    placeholderTextColor={COLORS.textTertiary}
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        setPhoneNumber(text);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    autoFocus
                                />
                            </View>
                            {errorMessage && (
                                <Text style={{ color: COLORS.danger, marginTop: 8, fontFamily: FONTS.medium }}>
                                    {errorMessage}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <View>
                            <View style={[styles.inputContainer, errorMessage && { borderColor: COLORS.danger }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="000 000"
                                    placeholderTextColor={COLORS.textTertiary}
                                    keyboardType="number-pad"
                                    value={otpCode}
                                    onChangeText={(text) => {
                                        setOtpCode(text);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    maxLength={6}
                                    autoFocus
                                    textAlign="center"
                                />
                            </View>
                            {errorMessage && (
                                <Text style={{ color: COLORS.danger, marginTop: 8, fontFamily: FONTS.medium, textAlign: 'center' }}>
                                    {errorMessage}
                                </Text>
                            )}

                            {/* MVP: Show Code on Screen */}
                            {mockOtp ? (
                                <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f9ff', borderRadius: 8, alignItems: 'center' }}>
                                    <Text style={{ color: COLORS.textSecondary, fontFamily: FONTS.body }}>Confirmation Code:</Text>
                                    <Text style={{ color: COLORS.brand.primary, fontFamily: FONTS.heading, fontSize: 24, marginTop: 4 }}>{mockOtp}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleSendCode}
                                disabled={resendCountdown > 0}
                                style={{ marginTop: 20, alignItems: 'center' }}
                            >
                                <Text style={{ color: resendCountdown > 0 ? COLORS.textTertiary : COLORS.brand.primary, fontFamily: FONTS.medium }}>
                                    {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend Code"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    {verificationStep === 'phone' ? (
                        <Button
                            title="Send Code"
                            onPress={handleSendCode}
                            style={styles.button}
                            loading={isLoading}
                            disabled={phoneNumber.length < 5 || isLoading}
                        />
                    ) : (
                        <Button
                            title="Verify Code"
                            onPress={handleVerifyCode}
                            style={styles.button}
                            loading={isLoading}
                            disabled={otpCode.length < 6 || isLoading}
                        />
                    )}
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
    },
    header: {
        marginBottom: SPACING.l,
        alignItems: 'flex-start',
    },
    backButton: {
        width: 48,
        height: 48,
        paddingHorizontal: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    main: {
        flex: 1,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 32,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
    },
    countryCodeInput: {
        fontFamily: FONTS.medium,
        fontSize: 18,
        color: COLORS.text,
        marginRight: SPACING.m,
        minWidth: 50,
        borderRightWidth: 1,
        borderRightColor: COLORS.divider,
        paddingRight: SPACING.s,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: 18,
        color: COLORS.text,
        letterSpacing: 1,
    },
    footer: {
        marginBottom: SPACING.m,
    },
    button: {
        width: '100%',
    },
});
