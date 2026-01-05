
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { Smartphone } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    console.log('Rendering LoginScreen');
    const navigation = useNavigation<NavigationProps>();
    const { login, isLoading } = useAuth();

    const [request, response, promptAsync] = Google.useAuthRequest({
        // androidClientId: "YOUR_ANDROID_CLIENT_ID",
        // iosClientId: "YOUR_IOS_CLIENT_ID",
        webClientId: "1234567890-dummy.apps.googleusercontent.com",
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // In a real app, you'd use this token to sign in to Firebase
            // const credential = GoogleAuthProvider.credential(authentication.accessToken);
            // signInWithCredential(auth, credential);
            login('google');
        }
    }, [response]);

    const handleGoogleLogin = () => {
        console.log('Google login pressed');
        if (Platform.OS === 'web') {
            const confirm = window.confirm('Google Sign-In: This requires a Google Cloud Project and Client IDs. Simulate successful login?');
            if (confirm) {
                login('google');
            }
            return;
        }

        // promptAsync(); // This requires keys to work
        // For now, we'll keep the simulated login so the user can test the flow
        Alert.alert(
            'Google Sign-In',
            'This requires a Google Cloud Project and Client IDs. For now, we will simulate a successful login.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Simulate Login', onPress: () => login('google') }
            ]
        );
    };

    const handlePhoneLogin = () => {
        navigation.navigate('PhoneNumber');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Almost there.</Text>
                    <Text style={styles.subtitle}>Create an account to save your data.</Text>
                </View>

                <View style={styles.form}>
                    <Button
                        title="Continue with Google"
                        onPress={handleGoogleLogin}
                        style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
                        textStyle={{ color: '#000000' }}
                        icon={<Text style={styles.googleIcon}>G</Text>}
                        loading={isLoading}
                        disabled={isLoading}
                    />

                    <Button
                        title="Continue with Phone"
                        onPress={() => navigation.navigate('PhoneNumber')}
                        variant="outline"
                        style={styles.phoneButton}
                        icon={<Smartphone size={20} color={COLORS.text} />}
                        loading={isLoading}
                        disabled={isLoading}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.terms}>
                        By continuing, you agree to our Terms & Privacy Policy.
                    </Text>
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
        justifyContent: 'center',
    },
    header: {
        marginBottom: SPACING.xxl,
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: SPACING.m,
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
    },
    form: {
        gap: SPACING.m,
        width: '100%',
    },
    socialButton: {
        borderWidth: 0,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    phoneButton: {
        borderColor: COLORS.surfaceLight,
        backgroundColor: COLORS.surface,
    },
    footer: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    terms: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
    },
});
