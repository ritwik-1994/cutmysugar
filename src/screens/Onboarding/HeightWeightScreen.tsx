import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { VerticalPicker } from '../../components/ui/VerticalPicker';
import { NavigationProps } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HeightWeightScreen() {
    const navigation = useNavigation<NavigationProps>();

    // Default Values
    const [ft, setFt] = useState('5');
    const [inch, setInch] = useState('7');
    const [kg, setKg] = useState('70');

    // Ranges for Pickers
    const feetRange = Array.from({ length: 6 }, (_, i) => (i + 3).toString()); // 3 to 8
    const inchRange = Array.from({ length: 12 }, (_, i) => i.toString());      // 0 to 11
    const kgRange = Array.from({ length: 171 }, (_, i) => (i + 30).toString()); // 30 to 200

    const handleNext = async () => {
        try {
            // Conversion Logic (Strictly Ft/In -> Cm)
            const heightCm = ((parseInt(ft) * 12) + parseInt(inch)) * 2.54;
            const weightKg = parseInt(kg);

            // Save standard units (CM / KG) to DB/Storage
            await AsyncStorage.setItem('temp_height_cm', Math.round(heightCm).toString());
            await AsyncStorage.setItem('temp_weight_kg', weightKg.toString());

            // Marker that user has set this (avoid legacy defaults)
            await AsyncStorage.setItem('user_onboarded_status', 'pending_login');

            console.log(`Saved Height: ${Math.round(heightCm)}cm (${ft}'${inch}"), Weight: ${weightKg}kg`);
        } catch (e) {
            console.error("Failed to save height/weight", e);
        }
        navigation.navigate('Login', { isRegistering: true });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Body Metrics</Text>
                    <Text style={styles.subtitle}>We use this to calculate your metabolic baseline.</Text>
                </View>

                {/* Wrapper for the "Mini Tablet" UI Cards */}
                <View style={styles.pickerSection}>

                    {/* HEIGHT CARD */}
                    <View style={styles.cardContainer}>
                        <Text style={styles.cardLabel}>HEIGHT</Text>
                        <View style={styles.row}>
                            {/* Feet Picker */}
                            <View style={styles.pickerWrapper}>
                                <VerticalPicker
                                    data={feetRange}
                                    value={ft}
                                    onValueChange={setFt}
                                    label="ft"
                                    height={220}
                                />
                            </View>
                            {/* Inches Picker */}
                            <View style={styles.pickerWrapper}>
                                <VerticalPicker
                                    data={inchRange}
                                    value={inch}
                                    onValueChange={setInch}
                                    label="in"
                                    height={220}
                                />
                            </View>
                        </View>
                    </View>

                    {/* WEIGHT CARD */}
                    <View style={styles.cardContainer}>
                        <Text style={styles.cardLabel}>WEIGHT</Text>
                        <View style={styles.pickerWrapper}>
                            <VerticalPicker
                                data={kgRange}
                                value={kg}
                                onValueChange={setKg}
                                label="kg"
                                height={220}
                            />
                        </View>
                    </View>

                </View>

                <View style={styles.footer}>
                    <Button
                        title="Continue"
                        onPress={handleNext}
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
    },
    header: {
        marginBottom: SPACING.l,
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
    pickerSection: {
        flex: 1,
        justifyContent: 'center',
        gap: SPACING.xl,
    },
    cardContainer: {
        gap: SPACING.s,
    },
    cardLabel: {
        fontFamily: FONTS.bodyBold, // Using bodyBold as subheading might be too large
        fontSize: 14,
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    pickerWrapper: {
        flex: 1,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: SPACING.m,
    },
    button: {
        width: '100%',
    },
});
