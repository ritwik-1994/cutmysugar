import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { ChevronDown } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useMeal, UserGoal } from '../../context/MealContext';
import { useAuth } from '../../context/AuthContext';

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

    const handleNext = async () => {
        if (!selectedGoal || !selectedDiet) {
            alert("Please select both a goal and dietary preference");
            return;
        }

        try {
            console.log("👉 Saving Preferences Locally (Pre-Auth)...");

            // 1. Update Context (for immediate UI use if necessary)
            setGoal(selectedGoal);

            // 2. Save to Temporary Storage (for post-login sync)
            await AsyncStorage.setItem('temp_goal', selectedGoal);
            await AsyncStorage.setItem('temp_diet_pref', selectedDiet);

            console.log("✅ Preferences stored in AsyncStorage for later sync.");
            navigation.navigate('HeightWeight');

        } catch (e: any) {
            console.error("Error saving local preferences:", e);
            navigation.navigate('HeightWeight');
        }
    };


    // Scroll Cue Animation
    const scrollY = useSharedValue(0);
    const bounce = useSharedValue(0);

    React.useEffect(() => {
        bounce.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedCueStyle = useAnimatedStyle(() => {
        return {
            opacity: scrollY.value > 20 ? 0 : 1,
            transform: [{ translateY: bounce.value }]
        };
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                onScroll={(e) => {
                    scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Your Goals</Text>
                    <Text style={styles.subtitle}>Help us personalize your budget.</Text>
                </View>

                {/* ... existing content ... */}

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

            {/* Scroll Hint Overlay */}
            {!selectedDiet && (
                <Animated.View style={[styles.scrollCue, animatedCueStyle]} pointerEvents="none">
                    <Text style={styles.scrollCueText}>Scroll for Diet</Text>
                    <ChevronDown size={20} color={COLORS.brand.primary} />
                </Animated.View>
            )}

            <View style={styles.footer}>
                <Button
                    title="Continue"
                    onPress={handleNext}
                    style={styles.button}
                    disabled={!selectedGoal || !selectedDiet}
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
    scrollCue: {
        position: 'absolute',
        bottom: 100, // Above footer
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        ...SHADOWS.medium, // Make it pop
        zIndex: 10
    },
    scrollCueText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.brand.primary,
        marginBottom: 2
    }
});
