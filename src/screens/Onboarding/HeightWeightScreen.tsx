import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';

export default function HeightWeightScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [isMetric, setIsMetric] = useState(false); // Default to Imperial (Feet/Inches)

    // Height State
    const [heightCm, setHeightCm] = useState('170');
    const [heightFt, setHeightFt] = useState('5');
    const [heightIn, setHeightIn] = useState('7');

    // Weight State
    const [weightKg, setWeightKg] = useState('70');

    const handleNext = () => {
        // Save logic (parse strings to numbers)
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Body Details</Text>
                        <Text style={styles.subtitle}>To calculate your metabolic baseline.</Text>
                    </View>

                    <View style={styles.unitToggleContainer}>
                        <TouchableOpacity
                            style={[styles.unitButton, !isMetric && styles.activeUnitButton]}
                            onPress={() => setIsMetric(false)}
                        >
                            <Text style={[styles.unitText, !isMetric && styles.activeUnitText]}>Imperial (Ft/In)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitButton, isMetric && styles.activeUnitButton]}
                            onPress={() => setIsMetric(true)}
                        >
                            <Text style={[styles.unitText, isMetric && styles.activeUnitText]}>Metric (Cm/Kg)</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Height</Text>
                        {isMetric ? (
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={heightCm}
                                    onChangeText={setHeightCm}
                                    keyboardType="numeric"
                                    placeholder="170"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                                <Text style={styles.unitLabel}>cm</Text>
                            </View>
                        ) : (
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={heightFt}
                                    onChangeText={setHeightFt}
                                    keyboardType="numeric"
                                    placeholder="5"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                                <Text style={styles.unitLabel}>ft</Text>
                                <View style={{ width: SPACING.m }} />
                                <TextInput
                                    style={styles.input}
                                    value={heightIn}
                                    onChangeText={setHeightIn}
                                    keyboardType="numeric"
                                    placeholder="7"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                                <Text style={styles.unitLabel}>in</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Weight</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                value={weightKg}
                                onChangeText={setWeightKg}
                                keyboardType="numeric"
                                placeholder="70"
                                placeholderTextColor={COLORS.textTertiary}
                            />
                            <Text style={styles.unitLabel}>kg</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title="Next"
                            onPress={handleNext}
                            style={styles.button}
                        />
                    </View>
                </ScrollView>
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
        flexGrow: 1,
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
    unitToggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    unitButton: {
        flex: 1,
        paddingVertical: SPACING.s,
        alignItems: 'center',
        borderRadius: SIZES.borderRadius.s,
    },
    activeUnitButton: {
        backgroundColor: COLORS.surfaceLight,
    },
    unitText: {
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    activeUnitText: {
        color: COLORS.text,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        fontSize: 24,
        fontFamily: FONTS.heading,
        color: COLORS.text,
        textAlign: 'center',
    },
    unitLabel: {
        fontFamily: FONTS.medium,
        fontSize: 20,
        color: COLORS.textSecondary,
        marginLeft: SPACING.s,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: SPACING.m,
    },
    button: {
        width: '100%',
    },
});
