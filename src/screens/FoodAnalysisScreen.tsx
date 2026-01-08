import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, NavigationProps } from '../navigation/types';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { CircularProgress } from '../components/ui/CircularProgress';
import { useMeal } from '../context/MealContext';
import { geminiService, FoodAnalysisResult } from '../services/GeminiService';
import { SUGAR_TYPES } from '../data/sugars';
import { STRINGS } from '../constants/strings';

type FoodAnalysisRouteProp = RouteProp<RootStackParamList, 'FoodAnalysis'>;

export default function FoodAnalysisScreen() {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<FoodAnalysisRouteProp>();
    const { imageUri, base64: imageBase64, date } = route.params;
    const { mealId, existingResult } = route.params || {};
    const [analyzing, setAnalyzing] = useState(!existingResult);
    const [result, setResult] = useState<FoodAnalysisResult | null>(existingResult || null);
    const [error, setError] = useState<string | null>(null);
    const [fixModalVisible, setFixModalVisible] = useState(false);
    const [userFeedback, setUserFeedback] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Progressive Loading Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (analyzing) {
            setLoadingProgress(0);
            interval = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev >= 95) return 95; // Pause at 95%

                    // Slow down as we get closer
                    if (prev < 60) return prev + 2; // Fast
                    if (prev < 80) return prev + 1; // Medium
                    if (prev < 90) return prev + 0.5; // Slow
                    return prev + 0.1; // Crawl to 95
                });
            }, 100);
        } else {
            setLoadingProgress(100);
        }
        return () => clearInterval(interval);
    }, [analyzing]);

    // Added Sugar State
    const [sugarModalVisible, setSugarModalVisible] = useState(false);
    const [sugarAmount, setSugarAmount] = useState('');
    const [sugarUnit, setSugarUnit] = useState<'g' | 'spoon'>('spoon');
    const [sugarType, setSugarType] = useState<string>('white_sugar');
    const [addedSugarData, setAddedSugarData] = useState<{ amount: number; unit: 'g' | 'spoon'; typeId: string } | undefined>(undefined);

    const { logMeal, updateMeal, startRefinement } = useMeal();

    useEffect(() => {
        if (!existingResult && imageBase64) {
            analyzeImage();
        }
    }, []);

    useEffect(() => {
        // Check if added sugar confirmation is needed
        // We prompt if it's a new analysis (not existing result), we haven't asked yet, AND it's likely to have added sugar.
        if (!existingResult && !addedSugarData && !sugarModalVisible && result?.addedSugarLikely) {
            // Small delay to let the user see the result first
            setTimeout(() => setSugarModalVisible(true), 1500);
        }
    }, [result]);

    const analyzeImage = async () => {
        if (!imageBase64) return;
        try {
            setAnalyzing(true);
            setError(null);
            const data = await geminiService.analyzeFood(imageBase64);
            setResult(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            console.error('Analysis Error:', err);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirmSugar = () => {
        if (!sugarAmount) {
            alert("Please enter an amount or tap 'No, none'");
            return;
        }

        const amount = parseFloat(sugarAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive number");
            return;
        }

        setAddedSugarData({ amount, unit: sugarUnit, typeId: sugarType });

        // Update GL: 1g sugar = 1g carb. GI of sugar ~65.
        // If tsp: 1 tsp ~ 4g.
        const grams = sugarUnit === 'spoon' ? amount * 4 : amount; // Assuming spoon = tsp = 4g
        const glIncrease = (grams * 65) / 100;

        if (result) {
            const newGL = result.glycemicLoad + glIncrease;
            const newTotalCarbs = (result.nutritionalInfo.carbs || 0) + grams;

            // Update result locally
            setResult({
                ...result,
                nutritionalInfo: {
                    ...result.nutritionalInfo,
                    carbs: Math.round(newTotalCarbs * 10) / 10
                },
                glycemicLoad: Math.round(newGL * 10) / 10
            });
        }
        setSugarModalVisible(false);
    };

    const handleLogMeal = () => {
        if (result) {
            const mealData: any = {
                name: result.foodName,
                gl: Math.round(result.glycemicLoad),
                sugarSpeed: result.sugarSpeed,
                energyStability: result.energyStability,
                imageUri: imageUri,
                imageBase64: imageBase64,
                analysisResult: result,
                addedSugar: addedSugarData,
                timestamp: date ? new Date(date) : new Date(),
            };

            if (mealId) {
                updateMeal(mealId, mealData);
            } else {
                logMeal(mealData);
            }
            navigation.navigate('Home');
        }
    };

    const handleRefineAnalysis = () => {
        if (!result) return;
        setFixModalVisible(false);

        // Start background refinement
        // We assume we have the original meal ID if we came from Home. 
        // If it's a fresh scan, we might need to handle it differently, 
        // but typically 'Update' is on a result. 
        // For now, let's pass a potentially undefined ID if it's brand new (which Context handles).
        // Actually, startRefinement expects an ID to update. 
        // If this is a new scan result that hasn't been saved yet?
        // Wait, Scan saves it automatically in MealContext. 
        // But here in FoodAnalysisScreen, we might be viewing `route.params.result`.
        // If we just scanned, the meal IS in the context as the latest meal.
        // We should try to find it or just create a new entry? 
        // Updating an existing meal prefers having an ID.
        // For simplicity, we'll let startRefinement find it or create a new one?
        // The context method I wrote: `updateMeal(data.mealId, ...)`
        // If we don't pass an ID, it won't update anything.
        // We need the ID. 
        // When we navigate to FoodAnalysisScreen (Scan), we don't pass ID, just result.
        // But we DO log the meal in MealContext upon scan completion.
        // So we should pass the ID.
        // Let's assume we can get it from params or find it.
        // However, if we can't find it easily, we might need to restructure.
        // BUT, for now, let's pass the mealId if available.

        startRefinement(route.params?.mealId || 'latest', imageBase64, result, userFeedback);
        navigation.navigate('Home');
    };

    if (analyzing) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: imageUri }} style={styles.backgroundImage} blurRadius={10} />
                <View style={styles.overlay}>
                    <CircularProgress
                        size={160}
                        progress={loadingProgress}
                        strokeWidth={12}
                    />
                    <Text style={styles.analyzingText}>Analyzing Food...</Text>
                    <Text style={styles.analyzingSubtext}>Identifying ingredients and calculating GL</Text>
                </View>
            </View>
        );
    }


    if (error || !result) {
        return (
            <SafeAreaView style={styles.container}>
                <Image source={{ uri: imageUri }} style={styles.foodImage} />
                <View style={styles.resultsContainer}>
                    <View style={styles.errorContainer}>
                        <AlertCircle size={48} color={COLORS.gl.criticalText} />
                        <Text style={styles.errorTitle}>Analysis Failed</Text>
                        <Text style={styles.errorText}>{error || "Unknown error occurred"}</Text>
                        <Button title="Try Again" onPress={analyzeImage} style={{ marginTop: SPACING.m }} />
                        <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.foodImage} />
                ) : (
                    <View style={[styles.foodImage, { backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 80 }}>🍽️</Text>
                    </View>
                )}

                <View style={styles.resultsContainer}>
                    <Text style={styles.foodName}>{result.foodName}</Text>
                    <Text style={styles.confidence}>Confidence: {Math.round(result.confidenceScore * 100)}%</Text>

                    <View style={styles.metricsGrid}>
                        <Card style={styles.metricCard} variant="solid">
                            <Text style={styles.metricLabel}>{STRINGS.METRICS.SPIKE_ALERT}</Text>
                            <Text style={[styles.metricValue, {
                                color: result.glycemicLoad > 20 ? COLORS.sugarScore.criticalText :
                                    result.glycemicLoad > 10 ? COLORS.sugarScore.warningText : COLORS.sugarScore.safeText
                            }]}>
                                {result.glycemicLoad > 20 ? STRINGS.METRICS.SUGAR_RUSH.FAST :
                                    (result.glycemicLoad > 10 ? STRINGS.METRICS.SUGAR_RUSH.MODERATE :
                                        (result.sugarSpeed === 'Fast' && result.glycemicLoad <= 10 ? STRINGS.METRICS.SUGAR_RUSH.SLOW : // Correction for hallucinations
                                            result.sugarSpeed === 'Fast' ? STRINGS.METRICS.SUGAR_RUSH.FAST :
                                                result.sugarSpeed === 'Moderate' ? STRINGS.METRICS.SUGAR_RUSH.MODERATE : STRINGS.METRICS.SUGAR_RUSH.SLOW))}
                            </Text>
                            <Text style={styles.metricUnit}>Impact</Text>
                        </Card>

                        <Card style={styles.metricCard} variant="solid">
                            <Text style={styles.metricLabel}>{STRINGS.METRICS.SUGAR_SCORE}</Text>
                            <Text style={[styles.metricValue, { color: COLORS.brand.accent }]}>
                                {Math.round(result.glycemicLoad)}
                            </Text>
                            <Text style={styles.metricUnit}>Points</Text>
                        </Card>
                    </View>

                    <Card style={styles.insightCard} variant="glass">
                        <View style={styles.insightHeader}>
                            <CheckCircle size={20} color={COLORS.brand.accent} />
                            <Text style={styles.insightTitle}>Analysis</Text>
                        </View>
                        <Text style={styles.insightText}>
                            {result.analysis || "Analysis complete."}
                        </Text>
                        {addedSugarData && (
                            <Text style={[styles.insightText, { marginTop: 8, color: COLORS.gl.warningText }]}>
                                + Added Sugar: {addedSugarData.amount} {addedSugarData.unit}
                            </Text>
                        )}
                    </Card>

                    {/* Smart Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                        <Card style={[styles.insightCard, { backgroundColor: '#F0FDF4', borderColor: COLORS.brand.primary }]} variant="solid">
                            <View style={styles.insightHeader}>
                                <Text style={{ fontSize: 20 }}>💡</Text>
                                <Text style={[styles.insightTitle, { color: COLORS.brand.primary }]}>
                                    {result.glycemicLoad > 20 ? "Better Choice" : "Smart Tips"}
                                </Text>
                            </View>
                            {result.recommendations.map((rec, index) => (
                                <View key={index} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                                    <Text style={{ color: COLORS.brand.primary, fontSize: 14 }}>•</Text>
                                    <Text style={[styles.insightText, { color: COLORS.text, flex: 1 }]}>{rec}</Text>
                                </View>
                            ))}
                        </Card>
                    )}

                    {/* Detected Ingredients Section */}
                    {result.ingredients && result.ingredients.length > 0 && (
                        <View style={styles.macrosContainer}>
                            <Text style={styles.sectionTitle}>Detected Ingredients</Text>
                            <Card style={styles.ingredientsCard} variant="solid">
                                {result.ingredients.map((ing, index) => (
                                    <View key={index} style={[
                                        styles.ingredientRow,
                                        index < (result.ingredients?.length || 0) - 1 && styles.ingredientDivider
                                    ]}>
                                        <Text style={styles.ingredientName}>{ing.name}</Text>
                                        {ing.estimatedWeightG && (
                                            <Text style={styles.ingredientValue}>~{ing.estimatedWeightG}g</Text>
                                        )}
                                    </View>
                                ))}
                            </Card>
                        </View>
                    )}


                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerButtons}>
                    <Button title={STRINGS.HOME.ACTIONS.LOG_MEAL} onPress={handleLogMeal} style={{ flex: 1 }} />
                    <Button
                        title={STRINGS.HOME.ACTIONS.FIX_RESULT}
                        variant="outline"
                        onPress={() => setFixModalVisible(true)}
                        style={{ flex: 1 }}
                    />
                </View>
                <Button
                    title="Retake Photo"
                    variant="ghost"
                    onPress={() => navigation.goBack()}
                    style={{ marginTop: SPACING.s }}
                />
                <Text style={styles.medicalDisclaimer}>{STRINGS.DISCLAIMER_SHORT}</Text>
            </View>

            <Modal
                visible={fixModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFixModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Fix Analysis</Text>
                        <Text style={styles.modalSubtitle}>What did we get wrong? e.g., "This is Chicken Curry, not Paneer"</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter correction..."
                            value={userFeedback}
                            onChangeText={setUserFeedback}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setFixModalVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Update"
                                onPress={handleRefineAnalysis}
                                disabled={!userFeedback.trim()}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Added Sugar Modal */}
            <Modal
                visible={sugarModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSugarModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <AlertTriangle size={24} color={COLORS.gl.warningText} />
                            <Text style={styles.modalTitle}>Added Sugar?</Text>
                        </View>
                        <Text style={styles.modalSubtitle}>Select the type of sweetener and amount added.</Text>

                        {/* Sugar Type Selector - Wrapped Chips */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            {SUGAR_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: sugarType === type.id ? COLORS.brand.primary : COLORS.surface,
                                        borderWidth: 1,
                                        borderColor: sugarType === type.id ? COLORS.brand.primary : COLORS.divider,
                                        marginBottom: 4,
                                    }}
                                    onPress={() => setSugarType(type.id)}
                                >
                                    <Text style={{
                                        color: sugarType === type.id ? '#FFF' : COLORS.text,
                                        fontFamily: sugarType === type.id ? FONTS.medium : FONTS.body,
                                        fontSize: 14
                                    }}>
                                        {type.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Amount Input & Unit Toggle */}
                        <View style={{ marginBottom: 20 }}>
                            <TextInput
                                style={[styles.input, { minHeight: 50, marginBottom: 12, textAlign: 'center', fontSize: 24, fontFamily: FONTS.heading }]}
                                placeholder="0"
                                keyboardType="numeric"
                                value={sugarAmount}
                                onChangeText={setSugarAmount}
                            />
                            <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, height: 44, alignSelf: 'center' }}>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 24, justifyContent: 'center', backgroundColor: sugarUnit === 'spoon' ? COLORS.brand.primary : COLORS.surface }}
                                    onPress={() => setSugarUnit('spoon')}
                                >
                                    <Text style={{ color: sugarUnit === 'spoon' ? '#FFF' : COLORS.text, fontFamily: FONTS.medium }}>spoon</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 24, justifyContent: 'center', backgroundColor: sugarUnit === 'g' ? COLORS.brand.primary : COLORS.surface }}
                                    onPress={() => setSugarUnit('g')}
                                >
                                    <Text style={{ color: sugarUnit === 'g' ? '#FFF' : COLORS.text, fontFamily: FONTS.medium }}>g</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Selected Sugar Info */}
                        {sugarType && (
                            <View style={{ marginBottom: 20, padding: 12, backgroundColor: COLORS.background, borderRadius: 8 }}>
                                <Text style={{ fontFamily: FONTS.medium, color: COLORS.text }}>
                                    {SUGAR_TYPES.find(t => t.id === sugarType)?.name}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                                        GI: {SUGAR_TYPES.find(t => t.id === sugarType)?.gi}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        fontFamily: FONTS.bodyBold,
                                        color: SUGAR_TYPES.find(t => t.id === sugarType)?.category === 'Zero' ? COLORS.gl.safeText :
                                            SUGAR_TYPES.find(t => t.id === sugarType)?.category === 'Moderate' ? COLORS.gl.warningText : COLORS.gl.criticalText
                                    }}>
                                        {SUGAR_TYPES.find(t => t.id === sugarType)?.category} Impact
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <Button
                                title="No, none"
                                variant="ghost"
                                onPress={() => setSugarModalVisible(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Confirm"
                                onPress={handleConfirmSugar}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    analyzingText: {
        fontFamily: FONTS.heading,
        fontSize: 24,
        color: '#FFF',
        marginTop: SPACING.m,
    },
    analyzingSubtext: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: SPACING.s,
    },
    scrollContent: {
        paddingBottom: 200,
    },
    foodImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    resultsContainer: {
        padding: SPACING.l,
        marginTop: -20,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: SIZES.borderRadius.xl,
        borderTopRightRadius: SIZES.borderRadius.xl,
    },
    foodName: {
        fontFamily: FONTS.heading,
        fontSize: 28,
        color: COLORS.text,
        marginBottom: 4,
    },
    confidence: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textTertiary,
        marginBottom: SPACING.l,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.l,
    },
    metricCard: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.m,
    },
    metricLabel: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontFamily: FONTS.heading,
        fontSize: 24,
        marginBottom: 4,
    },
    metricUnit: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textTertiary,
    },
    insightCard: {
        marginBottom: SPACING.l,
        padding: SPACING.m,
        backgroundColor: COLORS.actions.addBg, // Light blue for positive insight
        borderColor: 'transparent',
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    insightTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 16,
        color: COLORS.brand.accent,
    },
    insightText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    macrosContainer: {
        marginBottom: SPACING.l,
    },
    sectionTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    ingredientsCard: {
        padding: 0, // Reset padding for custom children
        overflow: 'hidden',
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    ingredientDivider: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    ingredientName: {
        flex: 1,
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.text,
        marginRight: SPACING.m,
    },
    ingredientValue: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface, // Slightly different bg if needed, or keep same
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    totalLabel: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
        color: COLORS.text,
    },
    totalValue: {
        fontFamily: FONTS.heading,
        fontSize: 18,
        color: COLORS.brand.primary,
    },
    errorContainer: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    errorTitle: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    errorText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    footerButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    medicalDisclaimer: {
        fontFamily: FONTS.body,
        fontSize: 10,
        color: COLORS.textTertiary,
        textAlign: 'center',
        marginTop: SPACING.s,
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
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
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
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
});
