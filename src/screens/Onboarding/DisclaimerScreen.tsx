import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';
import { ShieldAlert, Square, CheckSquare } from 'lucide-react-native';

export default function DisclaimerScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [accepted, setAccepted] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <ShieldAlert size={64} color={COLORS.warning} />
                    </View>
                    <Text style={styles.title}>
                        {STRINGS.ONBOARDING.DISCLAIMER.TITLE}
                    </Text>
                    <Text style={styles.subtitle}>
                        {STRINGS.ONBOARDING.DISCLAIMER.SUBTITLE}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setAccepted(!accepted)}
                        activeOpacity={0.7}
                    >
                        {accepted ? (
                            <CheckSquare size={24} color={COLORS.brand.primary} />
                        ) : (
                            <Square size={24} color={COLORS.textSecondary} />
                        )}
                        <Text style={styles.checkboxText}>
                            {STRINGS.ONBOARDING.DISCLAIMER.CHECKBOX}
                        </Text>
                    </TouchableOpacity>

                    <Button
                        title={STRINGS.ONBOARDING.DISCLAIMER.CTA}
                        onPress={async () => {
                            try {
                                await AsyncStorage.setItem('temp_medical_disclaimer', 'true');
                                navigation.navigate('Permissions');
                            } catch (error) {
                                console.log("Error saving disclaimer", error);
                                navigation.navigate('Permissions');
                            }
                        }}
                        style={styles.button}
                        disabled={!accepted}
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
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.l,
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    checkboxText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.text,
        marginLeft: SPACING.s,
        flex: 1,
    },
    button: {
        width: '100%',
    },
});
