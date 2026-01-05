import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../navigation/types';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useMeal } from '../context/MealContext';
import { Plus, Zap, Utensils } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { STRINGS } from '../constants/strings';
import { geminiService } from '../services/GeminiService';

// Components
import { DateSelector } from '../components/dashboard/DateSelector';
import { GLRingCard } from '../components/dashboard/GLRingCard';
import { MetricCard } from '../components/dashboard/MetricCard';
import { AddMealModal } from '../components/dashboard/AddMealModal';
import { WeeklyProgressChart } from '../components/dashboard/WeeklyProgressChart';

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { dailyBudget, setDailyBudget, meals, updateMeal } = useMeal();
    const { logout } = useAuth();

    const [editBudgetVisible, setEditBudgetVisible] = useState(false);
    const [addMealVisible, setAddMealVisible] = useState(false);
    const [tempBudget, setTempBudget] = useState(dailyBudget.toString());

    useEffect(() => {
        setTempBudget(dailyBudget.toString());
    }, [dailyBudget]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
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

    // Auto-Repair: Fetch recommendations for high GL meals if missing
    useEffect(() => {
        const fixMissingRecommendations = async () => {
            // Find a meal that needs recommendations (High GL > 20, no recs)
            // Limit to dailyMeals to avoid spamming API for old history
            const mealToFix = dailyMeals.find(m =>
                m.gl > 20 &&
                (!m.analysisResult?.recommendations || m.analysisResult.recommendations.length === 0)
            );

            if (mealToFix) {
                console.log(`Auto-repairing recommendations for: ${mealToFix.name}`);
                try {
                    const recs = await geminiService.getRecommendationsForFood(mealToFix.name);

                    // Update the meal with new recommendations
                    updateMeal(mealToFix.id, {
                        analysisResult: {
                            ...mealToFix.analysisResult!, // Assume analysisResult exists if we logged it, or create partial
                            foodName: mealToFix.name, // Fallback
                            glycemicLoad: mealToFix.gl, // Fallback
                            glycemicIndex: 0, // Fallback
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

        // Run this effect when dailyMeals changes
        // Debounce slightly to avoid conflict with initial load
        const timer = setTimeout(fixMissingRecommendations, 1000);
        return () => clearTimeout(timer);
    }, [dailyMeals]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                        <TouchableOpacity onPress={logout} style={{ padding: 4 }}>
                            <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>Logout</Text>
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
                    <GLRingCard
                        budget={dailyBudget}
                        consumed={dailyGL}
                        onPress={() => setEditBudgetVisible(true)}
                    />

                    {/* 5. Secondary Metric Cards (Grid Layout) */}
                    <View style={styles.metricsGrid}>
                        {/* Row 1: Speed & Stability */}
                        <View style={styles.metricsRow}>
                            <View style={{ flex: 1 }}>
                                <MetricCard
                                    title={STRINGS.METRICS.SPIKE_ALERT}
                                    value={dailySpikes > 2 ? "High Risk ⚡" : dailySpikes > 0 ? "Moderate ⚠️" : "Low Risk ✅"}
                                    statusColor={dailySpikes > 2 ? COLORS.sugarScore.criticalText : dailySpikes > 0 ? COLORS.sugarScore.warningText : COLORS.sugarScore.safeText}
                                    icon={<Text style={{ fontSize: 16 }}>📉</Text>}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <MetricCard
                                    title={STRINGS.METRICS.ENERGY_FLOW.LABEL}
                                    value={stabilityStatus}
                                    statusColor={stabilityColor}
                                />
                            </View>
                        </View>

                        {/* Row 2: Consumed (Full Width) */}
                        <View style={styles.metricsRow}>
                            <View style={{ flex: 1 }}>
                                <MetricCard
                                    title="Consumed"
                                    value={`${dailyGL} ${STRINGS.METRICS.SUGAR_SCORE}`}
                                    subtitle={selectedDate.getDate() === new Date().getDate() ? "Today" : "Selected Date"}
                                />
                            </View>
                        </View>
                    </View>

                    {/* 6. Weekly Progress Chart */}
                    <WeeklyProgressChart meals={meals} dailyBudget={dailyBudget} />

                    {/* 7. Recently Logged Meals Section */}
                    <Text style={styles.sectionTitle}>Today's Meals</Text>

                    {dailyMeals.length === 0 ? (
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
                            {dailyMeals.map((meal) => {
                                const glPercentage = Math.round((meal.gl / dailyBudget) * 100);
                                return (
                                    <View key={meal.id} style={styles.mealItem}>
                                        {meal.imageUri && (
                                            <Image
                                                source={{ uri: meal.imageUri }}
                                                style={styles.mealThumbnail}
                                            />
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <View style={{ marginBottom: 6 }}>
                                                <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                                                <Text style={styles.mealTime}>
                                                    {meal.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>

                                            <View style={styles.mealBadges}>
                                                {/* GL Badge */}
                                                <View style={[
                                                    styles.glBadge,
                                                    {
                                                        backgroundColor: Math.round(meal.gl) > 20 ? COLORS.sugarScore.danger :
                                                            Math.round(meal.gl) > 10 ? COLORS.sugarScore.warning :
                                                                COLORS.sugarScore.safe
                                                    }
                                                ]}>
                                                    <Text style={[
                                                        styles.glBadgeText,
                                                        {
                                                            color: Math.round(meal.gl) > 20 ? COLORS.sugarScore.criticalText :
                                                                Math.round(meal.gl) > 10 ? COLORS.sugarScore.warningText :
                                                                    COLORS.sugarScore.safeText
                                                        }
                                                    ]}>
                                                        {`+${Math.round(meal.gl)} ${STRINGS.METRICS.SUGAR_SCORE} (${glPercentage}%)`}
                                                    </Text>
                                                </View>

                                                {/* Sugar Speed Badge */}
                                                <View style={[
                                                    styles.glBadge,
                                                    {
                                                        backgroundColor: meal.sugarSpeed === 'Fast' ? COLORS.sugarScore.danger :
                                                            meal.sugarSpeed === 'Moderate' ? COLORS.sugarScore.warning :
                                                                COLORS.sugarScore.safe
                                                    }
                                                ]}>
                                                    <Text style={[
                                                        styles.glBadgeText,
                                                        {
                                                            color: meal.sugarSpeed === 'Fast' ? COLORS.sugarScore.criticalText :
                                                                meal.sugarSpeed === 'Moderate' ? COLORS.sugarScore.warningText :
                                                                    COLORS.sugarScore.safeText
                                                        }
                                                    ]}>
                                                        {meal.sugarSpeed === 'Fast' ? STRINGS.METRICS.SUGAR_RUSH.FAST :
                                                            meal.sugarSpeed === 'Moderate' ? STRINGS.METRICS.SUGAR_RUSH.MODERATE :
                                                                STRINGS.METRICS.SUGAR_RUSH.SLOW}
                                                    </Text>
                                                </View>

                                                {meal.analysisResult && (
                                                    <TouchableOpacity
                                                        style={styles.fixButton}
                                                        onPress={() => navigation.navigate('FoodAnalysis', {
                                                            imageUri: meal.imageUri,
                                                            base64: meal.imageBase64,
                                                            mealId: meal.id,
                                                            existingResult: meal.analysisResult
                                                        })}
                                                    >
                                                        <Text style={styles.fixButtonText}>{STRINGS.HOME.ACTIONS.FIX_RESULT}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Smart Swap Recommendation */}
                                            {meal.analysisResult?.recommendations && meal.analysisResult.recommendations.length > 0 && (
                                                <View style={{
                                                    marginTop: 8,
                                                    backgroundColor: '#F0FDF4',
                                                    padding: 8,
                                                    borderRadius: 8,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}>
                                                    <Text style={{ fontSize: 14 }}>💡</Text>
                                                    <Text style={{
                                                        fontFamily: FONTS.medium,
                                                        fontSize: 12,
                                                        color: COLORS.text,
                                                        flex: 1
                                                    }} numberOfLines={2}>
                                                        {meal.analysisResult.recommendations[0]}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* 8. Primary Action Button (FAB) */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => setAddMealVisible(true)}
            >
                <Plus color="#FFF" size={32} />
            </TouchableOpacity>

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
});
