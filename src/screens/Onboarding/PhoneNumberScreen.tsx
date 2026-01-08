import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function PhoneNumberScreen() {
    const navigation = useNavigation<NavigationProps>();
    const { login, isLoading } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+1');

    const handleSendCode = async () => {
        if (phoneNumber.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid phone number.');
            return;
        }

        // In a real app, this would trigger Firebase Phone Auth verifyPhoneNumber
        // For now, we simulate a successful login after "sending code"
        try {
            // Simulate sending code...
            // Then simulate verifying code...
            // For this demo, we'll just log them in directly after a delay
            await login('phone');
        } catch (error) {
            Alert.alert('Error', 'Failed to send verification code.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Button
                        title=""
                        onPress={() => navigation.goBack()}
                        variant="ghost"
                        style={styles.backButton}
                        icon={<ArrowLeft size={24} color={COLORS.text} />}
                    />
                </View>

                <View style={styles.main}>
                    <Text style={styles.title}>What's your number?</Text>
                    <Text style={styles.subtitle}>We'll send you a verification code.</Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.countryCodeInput}
                            value={countryCode}
                            onChangeText={setCountryCode}
                            keyboardType="phone-pad"
                            placeholder="+1"
                            placeholderTextColor={COLORS.textTertiary}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="000 000 0000"
                            placeholderTextColor={COLORS.textTertiary}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            autoFocus
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Send Code"
                        onPress={handleSendCode}
                        style={styles.button}
                        loading={isLoading}
                        disabled={phoneNumber.length < 10 || isLoading}
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
    },
    input: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: 18,
        color: COLORS.text,
    },
    footer: {
        marginBottom: SPACING.m,
    },
    button: {
        width: '100%',
    },
});
