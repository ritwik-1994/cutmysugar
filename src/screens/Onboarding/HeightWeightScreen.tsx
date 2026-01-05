import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    const [heightCm, setHeightCm] = useState(170);
    const [heightFt, setHeightFt] = useState(5);
    const [heightIn, setHeightIn] = useState(7);

    // Weight State
    const [weightKg, setWeightKg] = useState(70);

    const handleNext = () => {
        // Save height/weight logic here
        navigation.navigate('Login');
    };

    const toggleUnit = () => {
        setIsMetric(!isMetric);
    };

    // Convert for display if needed, but we keep separate state for simplicity in this demo
    // In a real app, we'd sync them.

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Body Details</Text>
                    <Text style={styles.subtitle}>To calculate your metabolic baseline.</Text>
                </View>

                <View style={styles.unitToggleContainer}>
                    <TouchableOpacity
                        style={[styles.unitButton, !isMetric && styles.activeUnitButton]}
                        onPress={() => setIsMetric(false)}
                    >
                        <Text style={[styles.unitText, !isMetric && styles.activeUnitText]}>Imperial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.unitButton, isMetric && styles.activeUnitButton]}
                        onPress={() => setIsMetric(true)}
                    >
                        <Text style={[styles.unitText, isMetric && styles.activeUnitText]}>Metric</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Height</Text>
                    {isMetric ? (
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueText}>{Math.round(heightCm)}</Text>
                            <Text style={styles.unitLabel}>cm</Text>
                        </View>
                    ) : (
                        <View style={styles.valueContainer}>
                            <Text style={styles.valueText}>{heightFt}'{heightIn}"</Text>
                            <Text style={styles.unitLabel}>ft/in</Text>
                        </View>
                    )}

                    {isMetric ? (
                        <Slider
                            style={styles.slider}
                            minimumValue={100}
                            maximumValue={250}
                            step={1}
                            value={heightCm}
                            onValueChange={setHeightCm}
                            minimumTrackTintColor={COLORS.primary}
                            maximumTrackTintColor={COLORS.surfaceLight}
                            thumbTintColor={COLORS.primary}
                        />
                    ) : (
                        <View style={styles.dualSliderContainer}>
                            <View style={styles.sliderWrapper}>
                                <Text style={styles.sliderLabel}>Feet: {heightFt}</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={3}
                                    maximumValue={8}
                                    step={1}
                                    value={heightFt}
                                    onValueChange={setHeightFt}
                                    minimumTrackTintColor={COLORS.primary}
                                    maximumTrackTintColor={COLORS.surfaceLight}
                                    thumbTintColor={COLORS.primary}
                                />
                            </View>
                            <View style={styles.sliderWrapper}>
                                <Text style={styles.sliderLabel}>Inches: {heightIn}</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={11}
                                    step={1}
                                    value={heightIn}
                                    onValueChange={setHeightIn}
                                    minimumTrackTintColor={COLORS.primary}
                                    maximumTrackTintColor={COLORS.surfaceLight}
                                    thumbTintColor={COLORS.primary}
                                />
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weight</Text>
                    <View style={styles.valueContainer}>
                        <Text style={styles.valueText}>{Math.round(weightKg)}</Text>
                        <Text style={styles.unitLabel}>kg</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={30}
                        maximumValue={200}
                        step={0.5}
                        value={weightKg}
                        onValueChange={setWeightKg}
                        minimumTrackTintColor={COLORS.secondary}
                        maximumTrackTintColor={COLORS.surfaceLight}
                        thumbTintColor={COLORS.secondary}
                    />
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Next"
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
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: SPACING.m,
    },
    valueText: {
        fontFamily: FONTS.heading,
        fontSize: 48,
        color: COLORS.text,
    },
    unitLabel: {
        fontFamily: FONTS.medium,
        fontSize: 20,
        color: COLORS.textSecondary,
        marginLeft: SPACING.s,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    dualSliderContainer: {
        gap: SPACING.m,
    },
    sliderWrapper: {
        width: '100%',
    },
    sliderLabel: {
        fontFamily: FONTS.body,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    footer: {
        marginTop: 'auto',
    },
    button: {
        width: '100%',
    },
});
