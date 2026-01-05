import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';

import { useMeal, UserGoal } from '../../context/MealContext';

const GOALS: { id: UserGoal; label: string; icon: string; description: string; tag: string }[] = [
    { id: 'blood_sugar', label: 'Manage Blood Sugar', icon: '🩸', description: 'Daily Limit: 70 GL', tag: 'Type 2 Diabetes' },
    { id: 'pcos', label: 'PCOS/PCOD Control', icon: '🌸', description: 'Daily Limit: 75 GL', tag: 'Hormonal Balance' },
    { id: 'avoid_spikes', label: 'Avoid Spikes', icon: '📉', description: 'Daily Limit: 90 GL', tag: 'Pre-diabetic' },
    { id: 'energy', label: 'Optimize Energy', icon: '⚡', description: 'Daily Limit: 110 GL', tag: 'Health Conscious' },
];

const DIETS = [
    { id: 'veg', label: 'Vegetarian', icon: '🥗' },
    { id: 'egg', label: 'Eggetarian', icon: '🥚' },
    { id: 'non-veg', label: 'Non-veg', icon: '🍗' },
];

export default function PreferencesScreen() {
    const navigation = useNavigation<NavigationProps>();
    const { setGoal } = useMeal();
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
    const [selectedDiet, setSelectedDiet] = useState<string | null>(null);

    const handleNext = () => {
        if (selectedGoal) {
            setGoal(selectedGoal);
            // Save diet preference logic here if needed
            navigation.navigate('HeightWeight');
        }
    };

    const handleSkip = () => {
        setGoal('blood_sugar'); // Default
        navigation.navigate('HeightWeight');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Goals</Text>
                    <Text style={styles.subtitle}>Help us personalize your budget.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Primary Goal</Text>
                    <View style={styles.optionsContainer}>
                        {GOALS.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                style={[
                                    styles.optionCard,
                                    selectedGoal === goal.id && styles.selectedOption,
                                ]}
                                onPress={() => setSelectedGoal(goal.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.optionIcon}>{goal.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <Text
                                            style={[
                                                styles.optionLabel,
                                                selectedGoal === goal.id && styles.selectedOptionLabel,
                                            ]}
                                        >
                                            {goal.label}
                                        </Text>
                                    </View>
                                    <View style={{ alignSelf: 'flex-start', backgroundColor: COLORS.brand.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14, fontFamily: FONTS.bodyBold, color: '#FFF' }}>{goal.tag}</Text>
                                    </View>
                                    <Text style={styles.optionDescription}>{goal.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dietary Preference</Text>
                    <View style={styles.optionsContainer}>
                        {DIETS.map((diet) => (
                            <TouchableOpacity
                                key={diet.id}
                                style={[
                                    styles.optionCard,
                                    selectedDiet === diet.id && styles.selectedOption,
                                ]}
                                onPress={() => setSelectedDiet(diet.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.optionIcon}>{diet.icon}</Text>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        selectedDiet === diet.id && styles.selectedOptionLabel,
                                    ]}
                                >
                                    {diet.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Continue"
                    onPress={handleNext}
                    style={styles.button}
                    disabled={!selectedGoal || !selectedDiet}
                />
                <Button
                    title="Skip for now"
                    onPress={handleSkip}
                    variant="ghost"
                    style={styles.skipButton}
                />
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.l,
    },
    header: {
        marginBottom: SPACING.xl,
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
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    optionsContainer: {
        gap: SPACING.m,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.m,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedOption: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
    },
    optionIcon: {
        fontSize: 24,
        marginRight: SPACING.m,
    },
    optionLabel: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    selectedOptionLabel: {
        color: COLORS.text,
    },
    footer: {
        padding: SPACING.l,
        backgroundColor: COLORS.background,
    },
    button: {
        width: '100%',
        marginBottom: SPACING.s,
    },
    skipButton: {
        width: '100%',
    },
    optionDescription: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
});
