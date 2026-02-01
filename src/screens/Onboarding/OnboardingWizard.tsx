import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { NavigationProps } from '../../navigation/types';
import { STRINGS } from '../../constants/strings';
import { TrendingUp, ScanLine, Activity, Zap, ChevronRight, ChevronLeft, ShieldAlert, CheckSquare, Square, ChevronDown } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInRight, FadeOutLeft, withRepeat, withSequence } from 'react-native-reanimated';
import { VerticalPicker } from '../../components/ui/VerticalPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMeal, UserGoal } from '../../context/MealContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const { width } = Dimensions.get('window');

// Data Constants
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

const GENDERS = [
    { id: 'Male', label: 'Male', icon: '👨' },
    { id: 'Female', label: 'Female', icon: '👩' },
    { id: 'Other', label: 'Other', icon: '🌈' },
];


const STEPS = [
    { id: 'education', title: 'Welcome', type: 'scroll' },
    { id: 'profile', title: 'About You', type: 'scroll' },
];

export default function OnboardingWizard() {
    const navigation = useNavigation<NavigationProps>();
    const { setGoal } = useMeal();
    const { register } = usePushNotifications();

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);

    // Animation State
    const bounceY = useSharedValue(0);

    useEffect(() => {
        bounceY.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const animatedBounceStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bounceY.value }],
    }));

    // Profile State
    const [name, setName] = useState('');
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);
    const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [age, setAge] = useState('30');
    const [ft, setFt] = useState('5');
    const [inch, setInch] = useState('7');
    const [kg, setKg] = useState('70');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    // Pickers Ranges
    const ageRange = Array.from({ length: 83 }, (_, i) => (i + 18).toString()); // 18 to 100
    const feetRange = Array.from({ length: 6 }, (_, i) => (i + 3).toString());
    const inchRange = Array.from({ length: 12 }, (_, i) => i.toString());
    const kgRange = Array.from({ length: 171 }, (_, i) => (i + 30).toString());

    // Navigation Logic
    const handleNext = async () => {
        if (currentStep === 0) {
            setCurrentStep(1);
        } else {
            // Validation
            if (!name.trim()) {
                alert("Please enter your name");
                return;
            }
            if (!selectedGoal || !selectedDiet || !selectedGender) {
                alert("Please fill in all details (Goal, Diet, Gender)");
                return;
            }
            await completeOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStep === 1) {
            setCurrentStep(0);
        } else {
            // navigation.goBack(); // Optional: allow exit
        }
    };

    const completeOnboarding = async () => {
        try {
            // Ask for Push Permissions (Smart Prompt)
            await register();

            // Save Name
            await AsyncStorage.setItem('temp_user_name', name.trim());

            // Save Goal, Diet, Gender, Age
            setGoal(selectedGoal!);
            await AsyncStorage.setItem('temp_goal', selectedGoal!);
            await AsyncStorage.setItem('temp_diet_pref', selectedDiet!);
            await AsyncStorage.setItem('temp_gender', selectedGender!);
            await AsyncStorage.setItem('temp_age', age);

            // Save Height & Weight
            const heightCm = ((parseInt(ft) * 12) + parseInt(inch)) * 2.54;
            await AsyncStorage.setItem('temp_height_cm', Math.round(heightCm).toString());
            await AsyncStorage.setItem('temp_weight_kg', kg);

            // Save Disclaimer & Status
            await AsyncStorage.setItem('temp_medical_disclaimer', 'true');
            await AsyncStorage.setItem('user_onboarded_status', 'pending_login');

            // Navigate
            navigation.navigate('Permissions');

        } catch (e) {
            console.error("Onboarding Save Failed", e);
        }
    };

    // --- STEP 1: EDUCATION & DISCLAIMER ---
    const renderEducationStep = () => (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.scrollStep} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 0. Branding/Welcome Header */}
                <View style={styles.brandHeader}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.heroTitle}>CutMySugar</Text>
                    <Text style={styles.heroSubtitle}>Eat smarter, not less.</Text>
                </View>

                {/* 1. Problem/Hook */}
                <View style={styles.sectionHeader}>
                    <View style={styles.iconContainer}>
                        <TrendingUp size={32} color={COLORS.brand.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>{STRINGS.ONBOARDING.PROBLEM.TITLE}</Text>
                    <Text style={styles.sectionSubtitle}>{STRINGS.ONBOARDING.PROBLEM.SUBTITLE}</Text>
                </View>

                {/* 2. Key Insights (Condensed) */}
                <View style={styles.insightCard}>
                    <Text style={styles.cardHeader}>Two Signals Matter</Text>
                    <View style={styles.signalRow}>
                        <View style={styles.signalItem}>
                            <View style={[styles.signalIconBox, { backgroundColor: '#EEF2FF' }]}>
                                <Activity size={24} color={COLORS.brand.primary} />
                            </View>
                            <Text style={styles.signalLabel}>Glucose Load</Text>
                            <Text style={styles.signalDesc}>Total Sugar</Text>
                        </View>
                        <View style={styles.verticalLine} />
                        <View style={styles.signalItem}>
                            <View style={[styles.signalIconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Zap size={24} color={COLORS.brand.secondary} />
                            </View>
                            <Text style={styles.signalLabel}>Spike Speed</Text>
                            <Text style={styles.signalDesc}>Absorption Rate</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Disclaimer */}
                <View style={styles.disclaimerSection}>
                    <ShieldAlert size={32} color={COLORS.sugarScore.warningText} style={{ marginBottom: 16 }} />
                    <Text style={styles.disclaimerTitle}>{STRINGS.ONBOARDING.DISCLAIMER.TITLE}</Text>
                    <Text style={styles.disclaimerText}>{STRINGS.ONBOARDING.DISCLAIMER.SUBTITLE}</Text>

                    <TouchableOpacity
                        style={[styles.checkboxRow, disclaimerAccepted && styles.checkboxRowActive]}
                        onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
                        activeOpacity={0.8}
                    >
                        {disclaimerAccepted ?
                            <CheckSquare size={24} color={COLORS.brand.primary} /> :
                            <Square size={24} color={COLORS.textTertiary} />
                        }
                        <Text style={[styles.checkboxText, disclaimerAccepted && { color: COLORS.text }]}>
                            {STRINGS.ONBOARDING.DISCLAIMER.CHECKBOX}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Scroll Hint */}
            {!disclaimerAccepted && (
                <Animated.View style={[styles.floatingScrollHint, animatedBounceStyle]} pointerEvents="none">
                    <Text style={styles.scrollHintText}>Scroll down to accept</Text>
                    <ChevronDown size={16} color={COLORS.textSecondary} />
                </Animated.View>
            )}
        </View>
    );

    // --- STEP 2: PROFILE INPUTS ---
    const renderProfileStep = () => (
        <ScrollView style={styles.scrollStep} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepHeader}>Let's calibrate for you.</Text>
            <Text style={styles.stepSubHeader}>We need a few details to calculate your daily sugar budget.</Text>

            {/* Name Input */}
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>What should we call you?</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textTertiary}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Goal Selection */}
            <Text style={[styles.inputLabel, { marginTop: SPACING.xl }]}>What is your main goal?</Text>
            <View style={styles.gridContainer}>
                {GOALS.map((g) => {
                    const isSelected = selectedGoal === g.id;
                    return (
                        <TouchableOpacity
                            key={g.id}
                            style={[styles.gridOption, isSelected && styles.selectedGridOption]}
                            onPress={() => setSelectedGoal(g.id)}
                            activeOpacity={0.7}
                        >
                            {isSelected && (
                                <View style={styles.checkmarkBadge}>
                                    <CheckSquare size={16} color={COLORS.surface} fill={COLORS.brand.primary} />
                                </View>
                            )}
                            <Text style={{ fontSize: 28, marginBottom: 12 }}>{g.icon}</Text>
                            <Text style={[styles.gridLabel, isSelected && styles.selectedLabel]}>{g.label}</Text>
                            <Text style={styles.gridTag}>{g.tag}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Diet Selection */}
            <Text style={[styles.inputLabel, { marginTop: SPACING.xl }]}>Which diet do you follow?</Text>
            <View style={styles.dietRow}>
                {DIETS.map((d) => {
                    const isSelected = selectedDiet === d.id;
                    return (
                        <TouchableOpacity
                            key={d.id}
                            style={[styles.dietCard, isSelected && styles.selectedOption]}
                            onPress={() => setSelectedDiet(d.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 24, marginBottom: 4 }}>{d.icon}</Text>
                            <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{d.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Gender Selection */}
            <Text style={[styles.inputLabel, { marginTop: SPACING.xl }]}>Your gender?</Text>
            <View style={styles.dietRow}>
                {GENDERS.map((g) => {
                    const isSelected = selectedGender === g.id;
                    return (
                        <TouchableOpacity
                            key={g.id}
                            style={[styles.dietCard, isSelected && styles.selectedOption]}
                            onPress={() => setSelectedGender(g.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ fontSize: 24, marginBottom: 4 }}>{g.icon}</Text>
                            <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{g.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Body Metrics */}
            <Text style={[styles.inputLabel, { marginTop: SPACING.xl }]}>And finally, your body metrics?</Text>
            <View style={styles.metricsCard}>
                <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>AGE</Text>
                    <View style={styles.pickerRowCompact}>
                        <VerticalPicker data={ageRange} value={age} onValueChange={setAge} label="y/o" height={140} />
                    </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>HEIGHT</Text>
                    <View style={styles.pickerRowCompact}>
                        <View style={{ flex: 1 }}>
                            <VerticalPicker data={feetRange} value={ft} onValueChange={setFt} label="ft" height={140} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <VerticalPicker data={inchRange} value={inch} onValueChange={setInch} label="in" height={140} />
                        </View>
                    </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.metricCol}>
                    <Text style={styles.metricHeader}>WEIGHT</Text>
                    <View style={styles.pickerRowCompact}>
                        <VerticalPicker data={kgRange} value={kg} onValueChange={setKg} label="kg" height={140} />
                    </View>
                </View>
            </View>

            <View style={{ height: 120 }} />
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: currentStep === 0 ? '50%' : '100%' }]} />
            </View>

            <View style={{ flex: 1 }}>
                {currentStep === 0 ?
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                        {renderEducationStep()}
                    </Animated.View>
                    :
                    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
                        {renderProfileStep()}
                    </Animated.View>
                }
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={{ flexDirection: 'row', gap: SPACING.m }}>
                    {currentStep > 0 && (
                        <Button
                            title="Back"
                            variant="ghost"
                            onPress={handleBack}
                            style={{ flex: 1, borderColor: COLORS.divider, borderWidth: 1 }}
                        />
                    )}
                    <Button
                        title={currentStep === 0 ? "Continue" : "Finish Setup"}
                        variant="primary"
                        onPress={handleNext}
                        style={{ flex: 2 }}
                        disabled={currentStep === 0 && !disclaimerAccepted}
                    />
                </View>

                {currentStep === 0 && (
                    <Button
                        title="I already have an account"
                        variant="outline"
                        onPress={async () => {
                            await AsyncStorage.setItem('user_onboarded_status', 'pending_login');
                            navigation.navigate('Login', { isRegistering: false });
                        }}
                        style={{ marginTop: SPACING.l, borderColor: COLORS.brand.primary, width: '100%' }}
                        textStyle={{ color: COLORS.brand.primary }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Ensure this is a clean white/off-white
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.surfaceLight,
        marginTop: SPACING.s,
        marginHorizontal: SPACING.l,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.brand.primary,
        borderRadius: 3,
    },
    scrollStep: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.l,
        paddingBottom: 40,
    },
    footer: {
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        ...SHADOWS.medium, // Lifted footer
    },

    // --- Step 1 Styles ---
    brandHeader: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.xl,
    },
    logo: {
        width: 250,
        height: 250,
        marginBottom: SPACING.m,
    },
    heroTitle: {
        fontFamily: FONTS.heading,
        fontSize: 36,
        color: COLORS.text,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontFamily: FONTS.medium,
        fontSize: 18,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    sectionHeader: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    iconContainer: {
        padding: SPACING.m,
        borderRadius: 20,
        backgroundColor: '#FFF0F5', // Light pink/red tint
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontFamily: FONTS.heading,
        fontSize: 28,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: '80%',
    },
    insightCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.l,
        borderRadius: 24,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.medium,
    },
    cardHeader: {
        fontFamily: FONTS.heading, // Premium bold
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    signalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    signalItem: {
        alignItems: 'center',
        flex: 1,
    },
    signalIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    signalLabel: {
        fontFamily: FONTS.subheading,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 4,
    },
    signalDesc: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
        textAlign: 'center',
    },
    verticalLine: {
        width: 1,
        height: '80%',
        backgroundColor: COLORS.divider,
        marginTop: 10,
    },
    disclaimerSection: {
        marginTop: SPACING.m,
        padding: SPACING.l,
        backgroundColor: '#F8FAFC', // Very light gray/blue
        borderRadius: 24,
        alignItems: 'center',
    },
    disclaimerTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: 8,
    },
    disclaimerText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.l,
        lineHeight: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        width: '100%',
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.divider,
        ...SHADOWS.light,
    },
    checkboxRowActive: {
        borderColor: COLORS.brand.primary,
        backgroundColor: '#F5F3FF', // Active engagement color
    },
    checkboxText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        color: COLORS.textSecondary,
        flex: 1,
    },

    // --- Step 2 Styles ---
    stepHeader: {
        fontFamily: FONTS.heading,
        fontSize: 32,
        color: COLORS.text,
        marginBottom: 8,
        marginTop: SPACING.l,
    },
    stepSubHeader: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    inputSection: {
        marginBottom: SPACING.l,
    },
    inputLabel: {
        fontFamily: FONTS.subheading,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    textInput: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 18,
        fontSize: 18,
        fontFamily: FONTS.medium,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.divider,
        ...SHADOWS.light,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridOption: {
        width: (width - 48 - 12) / 2, // 2 cols with padding calculation
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5, // Thicker border for better premium feel
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.light,
    },
    selectedGridOption: {
        borderColor: COLORS.brand.primary,
        backgroundColor: '#F5F3FF',
        ...SHADOWS.medium,
    },
    gridLabel: {
        fontFamily: FONTS.subheading,
        fontSize: 15,
        color: COLORS.text,
        marginBottom: 4,
    },
    gridTag: {
        fontFamily: FONTS.body,
        fontSize: 11,
        color: COLORS.textTertiary,
    },
    selectedLabel: {
        color: COLORS.brand.primary,
    },
    dietRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dietCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.light,
    },
    selectedOption: {
        borderColor: COLORS.brand.primary,
        backgroundColor: '#F5F3FF',
        ...SHADOWS.medium,
    },
    optionLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'center',
    },
    metricsCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight,
        ...SHADOWS.light,
    },
    metricCol: {
        flex: 1,
        alignItems: 'center',
    },
    metricHeader: {
        fontFamily: FONTS.heading,
        fontSize: 13,
        color: COLORS.textTertiary,
        marginBottom: 12,
        letterSpacing: 1,
    },
    pickerRowCompact: {
        flexDirection: 'row',
        height: 140, // Slightly reduced height
        width: '100%',
        justifyContent: 'center',
        gap: 4,
    },
    verticalDivider: {
        width: 1,
        height: '60%',
        backgroundColor: COLORS.divider,
        marginHorizontal: 16,
    },
    floatingScrollHint: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        ...SHADOWS.medium,
    },
    scrollHintText: {
        fontFamily: FONTS.medium,
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    checkmarkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
});
