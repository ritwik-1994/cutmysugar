import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NavigationProps } from '../navigation/types';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useMeal } from '../context/MealContext';
import { Plus, Zap, Utensils, ChevronDown, Settings } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { STRINGS } from '../constants/strings';
import { geminiService } from '../services/GeminiService';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withSpring,
    FadeIn,
    FadeOut,
    interpolate
} from 'react-native-reanimated';

// Components
import { DateSelector } from '../components/dashboard/DateSelector';
import { SpeedometerCard } from '../components/dashboard/SpeedometerCard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { AddMealModal } from '../components/dashboard/AddMealModal';
import { SettingsModal } from '../components/dashboard/SettingsModal';
import { WeeklyProgressChart } from '../components/dashboard/WeeklyProgressChart';
import { MealItem } from '../components/dashboard/MealItem';
import { PendingMealItem } from '../components/dashboard/PendingMealItem';
import { InstallAppBanner } from '../components/InstallAppBanner';

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { dailyBudget, setDailyBudget, meals, updateMeal, pendingActions } = useMeal();
    const { user, logout } = useAuth();

    const [editBudgetVisible, setEditBudgetVisible] = useState(false);
    const [addMealVisible, setAddMealVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [tempBudget, setTempBudget] = useState(dailyBudget.toString());
    const [scrollTargetY, setScrollTargetY] = useState(0);

    // PWA Install Prompt Logic
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const prevMealsLength = useRef(meals.length);

    useEffect(() => {
        // If meals count increased, it means user successfully logged a meal!
        if (meals.length > prevMealsLength.current) {
            console.log("Meal logged! Triggering install prompt.");
            setShowInstallPrompt(true);
        }
        prevMealsLength.current = meals.length;
    }, [meals.length]);

    useEffect(() => {
        setTempBudget(dailyBudget.toString());
    }, [dailyBudget]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const baseGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
        return user?.name ? `${baseGreeting}, ${user.name.split(' ')[0]}` : baseGreeting;
    };

    const handleSaveBudget = () => {
        const newBudget = parseInt(tempBudget);
        if (isNaN(newBudget) || newBudget < 60 || newBudget > 140) {
            Alert.alert('Invalid Budget', 'Please enter a value between 60 and 140.');
            return;
        }
        setDailyBudget(newBudget);
        setEditBudgetVisible(false);
    };

    const handleMealOptionSelect = (option: 'scan' | 'search' | 'barcode' | 'manual') => {
        setAddMealVisible(false);
        switch (option) {
            case 'scan':
                navigation.navigate('ScanFood', { date: selectedDate.toISOString() });
                break;
            case 'search':
                navigation.navigate('SearchFood', { date: selectedDate.toISOString() });
                break;

            case 'manual':
                navigation.navigate('ManualEntry', { date: selectedDate.toISOString() });
                break;
        }
    };

    // Filter meals by selected date
    const dailyMeals = meals.filter(meal => {
        const d1 = new Date(meal.timestamp);
        const d2 = selectedDate;
        const match = d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();

        // Console log only occasionally or for specific debug
        // console.log(`Filtering: Meal ${meal.name} (${d1.toISOString()}) vs Selected (${d2.toISOString()}) => ${match}`);
        return match;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort desc

    // Filter pending actions by date
    const dailyPendingActions = pendingActions.filter(action => {
        // Use the intended date if available (data.date), otherwise action timestamp
        const actionDateStr = action.data?.date;
        const d1 = actionDateStr ? new Date(actionDateStr) : new Date(action.timestamp);
        const d2 = selectedDate;
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    });

    const dailyGL = dailyMeals.reduce((total, meal) => total + meal.gl, 0);
    const dailySpikes = dailyMeals.filter(m => m.sugarSpeed === 'Fast').length;
    const maxMealGL = dailyMeals.reduce((max, meal) => Math.max(max, meal.gl), 0);

    let stabilityStatus = STRINGS.METRICS.ENERGY_FLOW.STEADY;
    let stabilityColor = COLORS.brand.accent;

    if (dailyGL > dailyBudget * 1.2 || maxMealGL > 30 || dailySpikes > 2) {
        stabilityStatus = STRINGS.METRICS.ENERGY_FLOW.CRASH;
        stabilityColor = COLORS.sugarScore.criticalText;
    } else if (dailyGL > dailyBudget || maxMealGL > 20 || dailySpikes >= 1) {
        stabilityStatus = STRINGS.METRICS.ENERGY_FLOW.UNSTABLE;
        stabilityColor = COLORS.sugarScore.warningText;
    }

    // Auto-Repair and other effects hidden for brevity...

    // Scroll Logic
    const scrollRef = useRef<ScrollView>(null);
    const scrollY = useSharedValue(0);
    const isFocused = useIsFocused();

    // Auto-scroll when new action starts or screen becomes focused with active actions
    // Auto-scroll when new action starts or screen becomes focused with active actions
    // Auto-scroll when new action starts
    const lastScrollActionId = useRef<string | null>(null);

    useEffect(() => {
        const latestActionId = pendingActions[0]?.id;

        // Only scroll if we have a pending action, it's different from the last one we scrolled for,
        // and we have a valid scroll target.
        if (isFocused && latestActionId && latestActionId !== lastScrollActionId.current && scrollTargetY > 0) {
            console.log("Auto-scrolling to new meal action:", latestActionId);
            lastScrollActionId.current = latestActionId;

            // Wait for layout/navigation transition
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: scrollTargetY, animated: true });
            }, 500);
        }

        // Reset if no pending actions
        if (dailyPendingActions.length === 0) {
            lastScrollActionId.current = null;
        }
    }, [isFocused, pendingActions, dailyPendingActions, scrollTargetY]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };

    // Scroll Cue Animation
    const bounce = useSharedValue(0);
    useEffect(() => {
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
        // Fade out as user scrolls down > 50px
        const opacity = interpolate(scrollY.value, [0, 50], [1, 0], 'clamp');
        return {
            opacity,
            transform: [{ translateY: bounce.value }]
        };
    });

    // ... (Keep existing Auto-Repair effect) ...
    // Auto-Repair: Fetch recommendations for high GL meals if missing
    useEffect(() => {
        const fixMissingRecommendations = async () => {
            const mealToFix = dailyMeals.find(m =>
                m.gl > 20 &&
                (!m.analysisResult?.recommendations || m.analysisResult.recommendations.length === 0)
            );

            if (mealToFix) {
                console.log(`Auto-repairing recommendations for: ${mealToFix.name}`);
                try {
                    const recs = await geminiService.getRecommendationsForFood(mealToFix.name);
                    updateMeal(mealToFix.id, {
                        analysisResult: {
                            ...mealToFix.analysisResult!,
                            foodName: mealToFix.name,
                            glycemicLoad: mealToFix.gl,
                            glycemicIndex: 0,
                            confidenceScore: 0,
                            nutritionalInfo: mealToFix.analysisResult?.nutritionalInfo || {
                                calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sugar: 0
                            },
                            analysis: mealToFix.analysisResult?.analysis || "Auto-generated",
                            sugarSpeed: mealToFix.sugarSpeed,
                            energyStability: mealToFix.energyStability,
                            recommendations: recs
                        }
                    });
                } catch (error) {
                    console.error("Failed to auto-repair meal:", error);
                }
            }
        };

        const timer = setTimeout(fixMissingRecommendations, 1000);
        return () => clearTimeout(timer);
    }, [dailyMeals]);

    // Loading State
    if (!useMeal().isLoaded) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.brand.primary} />
                <Text style={{ marginTop: 16, fontFamily: FONTS.medium, color: COLORS.textSecondary }}>
                    Syncing your data...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* 2. Header Area */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
                        <View>
                            <Text style={styles.appName}>{STRINGS.APP_NAME}</Text>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                        </View>
                    </View>

                    {/* 2.2 Spike Event Counter */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={styles.spikeCounter}>
                            <Zap size={16} color={COLORS.brand.accent} fill={COLORS.brand.accent} />
                            <Text style={styles.spikeCountText}>{dailySpikes}</Text>
                            <Text style={styles.spikeLabel}>Spikes</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setSettingsVisible(true)}
                            style={{ padding: 8 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Settings size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. Date Selector */}
                <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                <View style={styles.mainContent}>
                    {/* 4. Primary Metric Card (Hero) */}
                    <SpeedometerCard
                        budget={dailyBudget}
                        consumed={dailyGL}
                        spikes={dailySpikes}
                        energyStability={stabilityStatus}
                        onPress={() => setEditBudgetVisible(true)}
                    />


                    {/* 6. Weekly Progress Chart */}
                    <WeeklyProgressChart meals={meals} dailyBudget={dailyBudget} />

                    {/* 7. Recently Logged Meals Section */}
                    {/* 7. Recently Logged Meals Section */}
                    <View onLayout={(e) => setScrollTargetY(e.nativeEvent.layout.y)}>
                        <Text style={styles.sectionTitle}>Today's Meals</Text>
                    </View>

                    {/* PENDING ACTIONS SECTION */}
                    {dailyPendingActions.length > 0 && (
                        <View style={styles.mealList}>
                            {dailyPendingActions.map((action) => (
                                <PendingMealItem key={action.id} action={action} />
                            ))}
                        </View>
                    )}

                    {dailyMeals.length === 0 && dailyPendingActions.length === 0 ? (
                        <TouchableOpacity
                            style={styles.emptyState}
                            onPress={() => setAddMealVisible(true)}
                            activeOpacity={0.7}
                        >
                            <View style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: COLORS.brand.secondary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: SPACING.m
                            }}>
                                <Utensils size={24} color={COLORS.brand.primary} />
                            </View>
                            <Text style={styles.emptyStateText}>{STRINGS.HOME.EMPTY.TEXT}</Text>
                            <Text style={styles.emptyStateLink}>{STRINGS.HOME.EMPTY.SUBTEXT}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.mealList}>
                            {dailyMeals.map((meal) => (
                                <MealItem
                                    key={meal.id}
                                    meal={meal}
                                    dailyBudget={dailyBudget}
                                    onPressFix={() => navigation.navigate('FoodAnalysis', {
                                        imageUri: meal.imageUri,
                                        base64: meal.imageBase64,
                                        mealId: meal.id,
                                        existingResult: meal.analysisResult
                                    })}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Scroll Hint */}
            <Animated.View
                style={[
                    styles.scrollCueContainer,
                    animatedCueStyle,
                    { pointerEvents: 'none' } // Let clicks pass through if it overlaps list slightly
                ]}
            >
                <View style={styles.scrollCuePill}>
                    <Text style={styles.scrollCueText}>Today's Meals</Text>
                    <ChevronDown size={14} color={COLORS.textTertiary} />
                </View>
            </Animated.View>

            {/* 8. Primary Action Button (FAB) */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setAddMealVisible(true)}
            >
                <Plus color="#FFF" size={32} />
            </TouchableOpacity>

            {/* PWA Install Banner - Shows ONLY after successful scan/log */}
            <InstallAppBanner triggerShow={showInstallPrompt} />

            {/* Edit Budget Modal */}
            <Modal
                visible={editBudgetVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditBudgetVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit {STRINGS.METRICS.SUGAR_LIMIT}</Text>
                        <Text style={styles.modalSubtitle}>Adjust your daily limit (60 - 140)</Text>

                        <TextInput
                            style={styles.input}
                            keyboardType="number-pad"
                            value={tempBudget}
                            onChangeText={setTempBudget}
                            placeholder="Enter limit"
                        />

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setEditBudgetVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Save"
                                onPress={handleSaveBudget}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <AddMealModal
                visible={addMealVisible}
                onClose={() => setAddMealVisible(false)}
                onOptionSelect={handleMealOptionSelect}
            />

            <SettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 100, // Space for FAB
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        marginBottom: SPACING.s,
    },
    appName: {
        fontFamily: FONTS.heading,
        fontSize: 24,
        color: COLORS.brand.primary,
    },
    greeting: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    headerLogo: {
        width: 60,
        height: 60,
    },
    spikeCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        ...SHADOWS.light,
    },
    spikeCountText: {
        fontFamily: FONTS.heading,
        fontSize: 16,
        color: COLORS.text,
    },
    spikeLabel: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    mainContent: {
        paddingHorizontal: SPACING.l,
    },
    metricsGrid: {
        marginBottom: SPACING.xl,
        gap: SPACING.m,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    sectionTitle: {
        fontFamily: FONTS.heading,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    emptyState: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.l,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    emptyStateText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
    },
    emptyStateLink: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.brand.accent,
    },
    mealList: {
        gap: SPACING.m,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align to top
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.m,
        ...SHADOWS.light,
    },
    mealThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: SPACING.m,
        backgroundColor: COLORS.background,
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
        color: COLORS.text,
    },
    mealTime: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
    },
    mealBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 8,
    },
    glBadge: {
        backgroundColor: COLORS.actions.replaceBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    glBadgeText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.actions.replaceText,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.l,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
        shadowColor: COLORS.brand.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    fixButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.brand.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    fixButtonText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.brand.accent,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.l,
        padding: SPACING.l,
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    modalSubtitle: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.m,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    scrollCueContainer: {
        position: 'absolute',
        bottom: 100, // Above FAB/Footer area
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },
    scrollCuePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        ...SHADOWS.medium,
        borderWidth: 1,
        borderColor: COLORS.divider
    },
    scrollCueText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textSecondary
    }
});
