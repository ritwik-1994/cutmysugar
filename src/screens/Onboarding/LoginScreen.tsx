
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, NavigationProps } from '../../navigation/types';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { Smartphone, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    console.log('Rendering LoginScreen');
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
    console.log("LoginScreen: Route Params:", route.params);
    // STRICT: Default to false (Login Mode) if parameter is missing/undefined.
    const isRegistering = route.params?.isRegistering ?? false;
    console.log("LoginScreen: Resolved isRegistering =", isRegistering);

    const { signInWithGoogle, isLoading } = useAuth();
    console.log(`LoginScreen: Rendered. isLoading=${isLoading}`);
    const [request, response, promptAsync] = Google.useAuthRequest({
        // androidClientId: "YOUR_ANDROID_CLIENT_ID",
        // iosClientId: "YOUR_IOS_CLIENT_ID",
        webClientId: "1234567890-dummy.apps.googleusercontent.com",
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            signInWithGoogle(authentication?.idToken);
        }
    }, [response]);

    const handleGoogleLogin = async () => {
        console.log('Google login pressed');

        // Track Intent: Login vs Register
        await AsyncStorage.setItem('auth_intent', isRegistering ? 'register' : 'login');

        if (Platform.OS === 'web') {
            const confirm = window.confirm('Google Sign-In: This requires a Google Cloud Project and Client IDs. For now we will call the Supabase OAuth flow.');
            if (confirm) {
                await signInWithGoogle();
            }
            return;
        }

        try {
            await signInWithGoogle();
        } catch (e) {
            Alert.alert('Login Failed', (e as Error).message);
        }
    };

    const handlePhoneLogin = () => {
        navigation.navigate('PhoneNumber');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Back Button */}
                <View style={{ alignSelf: 'flex-start', marginLeft: -SPACING.xs, marginBottom: SPACING.l }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: COLORS.surface,
                            justifyContent: 'center',
                            alignItems: 'center',
                            ...SHADOWS.small,
                            borderWidth: 1,
                            borderColor: COLORS.surfaceLight
                        }}
                    >
                        <ArrowLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Almost there.</Text>
                    <Text style={styles.subtitle}>Create an account to save your data.</Text>
                </View>

                <View style={styles.form}>
                    <Button
                        title="Continue with Phone"
                        onPress={() => navigation.navigate('PhoneNumber', { isRegistering })}
                        style={styles.socialButton}
                        icon={<Smartphone size={20} color={COLORS.white} />}
                        loading={isLoading}
                        disabled={isLoading}
                    />

                    <Button
                        title="Continue with Google"
                        onPress={handleGoogleLogin}
                        variant="outline"
                        style={[styles.phoneButton, { backgroundColor: '#FFFFFF' }]}
                        textStyle={{ color: '#000000' }}
                        icon={<Text style={styles.googleIcon}>G</Text>}
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
