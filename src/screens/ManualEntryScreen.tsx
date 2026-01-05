import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Info } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useMeal } from '../context/MealContext';
import { NavigationProps, RootStackParamList } from '../navigation/types';
import { STRINGS } from '../constants/strings';
import { SUGAR_TYPES } from '../data/sugars';
import { AlertTriangle } from 'lucide-react-native';

type FoodCategory = 'Green' | 'Yellow' | 'Red';
type PortionSize = 'Small' | 'Medium' | 'Large';

import { geminiService } from '../services/GeminiService';
import { ActivityIndicator, Modal } from 'react-native';

type ManualEntryRouteProp = RouteProp<RootStackParamList, 'ManualEntry'>;

export default function ManualEntryScreen() {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<ManualEntryRouteProp>();
    const { logMeal } = useMeal();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Intuitive Mode State
    const [category, setCategory] = useState<FoodCategory>('Yellow');
    const [portion, setPortion] = useState<PortionSize>('Medium');
    const [useExactWeight, setUseExactWeight] = useState(false);
    const [weightInput, setWeightInput] = useState('');

    // Derived state
    const [estimatedCarbs, setEstimatedCarbs] = useState(0);
    const [gl, setGl] = useState(0);
    const [spikeRisk, setSpikeRisk] = useState<'Steady' | 'Balanced' | 'Fast Spike'>('Balanced');

    // AI Advice State
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [loadingRec, setLoadingRec] = useState(false);
    const [recModalVisible, setRecModalVisible] = useState(false);

    // Added Sugar State
    const [sugarModalVisible, setSugarModalVisible] = useState(false);
    const [sugarAmount, setSugarAmount] = useState('');
    const [sugarUnit, setSugarUnit] = useState<'g' | 'spoon'>('spoon');
    const [sugarType, setSugarType] = useState<string>('white_sugar');
    const [addedSugarData, setAddedSugarData] = useState<{ amount: number; unit: 'g' | 'spoon'; typeId: string } | undefined>(undefined);

    // Import SUGAR_TYPES if not already imported (will need to add import)
    // For now assuming we need to add the import or define it.
    // Let's add the import in a separate edit or assume it's available.
    // Wait, I need to add the import first. But I can do it in the same file.

    const handleConfirmSugar = () => {
        if (!sugarAmount) {
            // User clicked confirm but empty? Treat as none or alert?
            // If they want none, they should click "No, none".
            // But let's be lenient.
            setSugarModalVisible(false);
            handleSaveFinal();
            return;
        }

        const amount = parseFloat(sugarAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive number");
            return;
        }

        const sugarData = { amount, unit: sugarUnit, typeId: sugarType };
        setAddedSugarData(sugarData);
        setSugarModalVisible(false);
        handleSaveFinal(sugarData, aiResult); // Pass aiResult here
    };

    // AI Result State
    const [aiResult, setAiResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a food name');
            return;
        }

        setIsAnalyzing(true);
        try {
            // 1. Analyze with AI
            // Construct context with portion info
            let context = "";
            if (useExactWeight && weightInput) {
                context = `Weight: ${weightInput}g`;
            } else {
                context = `Portion Size: ${portion}`;
            }

            const result = await geminiService.analyzeText(name, description, context);
            setAiResult(result);

            // 2. Check for Added Sugar (AI Logic)
            // DEBUG: Alert to confirm AI ran
            // alert(`AI Analysis:\nLikely Sugar: ${result.addedSugarLikely}\nDetected: ${result.addedSugar?.detected}`);

            if (result.addedSugarLikely || result.addedSugar?.detected) {
                setSugarModalVisible(true);
            } else {
                // 3. No sugar suspected? Save directly with AI results
                // Optional: Show a quick toast or just save.
                // For now, let's just save to be fast, but maybe the user wants to know AI ran.
                // We can rely on the "Analyzing..." button state change as feedback.
                handleSaveFinal(undefined, result);
            }
        } catch (error) {
            console.error("Analysis failed, falling back to manual:", error);
            // Fallback to keyword check if AI fails
            const sugarKeywords = ['tea', 'coffee', 'latte', 'cappuccino', 'chai', 'juice', 'shake', 'smoothie', 'cake', 'cookie', 'dessert', 'sweet', 'chocolate', 'ice cream', 'laddoo', 'barfi', 'halwa', 'kheer', 'payasam', 'jam', 'syrup', 'honey', 'sugar'];
            const lowerName = name.toLowerCase();
            if (sugarKeywords.some(keyword => lowerName.includes(keyword))) {
                setSugarModalVisible(true);
            } else {
                handleSaveFinal();
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveFinal = (sugarData?: { amount: number; unit: 'g' | 'spoon'; typeId: string }, explicitAiResult?: any) => {
        // Use the AI result passed in OR the one in state
        const finalAiResult = explicitAiResult || aiResult;

        // Base values: Prefer AI, fallback to manual estimates
        let finalGL = finalAiResult ? finalAiResult.glycemicLoad : gl;
        let finalCarbs = finalAiResult ? finalAiResult.nutritionalInfo.carbs : estimatedCarbs;

        if (sugarData) {
            const grams = sugarData.unit === 'spoon' ? sugarData.amount * 4 : sugarData.amount;
            const glIncrease = (grams * 65) / 100;
            finalGL += glIncrease;
            finalCarbs += grams;
        }

        logMeal({
            name: name.trim(),
            gl: Math.round(finalGL),
            sugarSpeed: finalAiResult ? finalAiResult.sugarSpeed : (spikeRisk === 'Fast Spike' ? 'Fast' : spikeRisk === 'Balanced' ? 'Moderate' : 'Slow'),
            energyStability: finalGL > 20 ? 'Likely Crash' : finalGL > 10 ? 'Okay' : 'Steady',
            analysisResult: {
                foodName: name.trim(),
                glycemicIndex: finalAiResult ? finalAiResult.glycemicIndex : (category === 'Green' ? 30 : category === 'Yellow' ? 55 : 75),
                glycemicLoad: Math.round(finalGL),
                confidenceScore: finalAiResult ? finalAiResult.confidenceScore : 0.8,
                nutritionalInfo: {
                    calories: finalCarbs * 4,
                    carbs: Math.round(finalCarbs),
                    protein: finalAiResult ? finalAiResult.nutritionalInfo.protein : 0,
                    fat: finalAiResult ? finalAiResult.nutritionalInfo.fat : 0,
                    fiber: finalAiResult ? finalAiResult.nutritionalInfo.fiber : 0,
                    sugar: sugarData ? (sugarData.unit === 'spoon' ? sugarData.amount * 4 : sugarData.amount) : (finalAiResult ? finalAiResult.nutritionalInfo.sugar : 0)
                },
                analysis: finalAiResult ? finalAiResult.analysis : `Manual entry based on ${category} category and ${portion} portion.${description ? `\nNote: ${description}` : ''}`,
                recommendations: finalAiResult ? finalAiResult.recommendations : recommendations,
                sugarSpeed: finalAiResult ? finalAiResult.sugarSpeed : (spikeRisk === 'Fast Spike' ? 'Fast' : spikeRisk === 'Balanced' ? 'Moderate' : 'Slow'),
                energyStability: finalGL > 20 ? 'Likely Crash' : finalGL > 10 ? 'Okay' : 'Steady',
                addedSugar: sugarData ? {
                    detected: true,
                    source: sugarData.typeId,
                    amount: sugarData.amount
                } : undefined
            },
            timestamp: route.params?.date ? new Date(route.params.date) : new Date(),
        });

        navigation.navigate('Home');
    };

    useEffect(() => {
        calculateMetrics();
    }, [category, portion, useExactWeight, weightInput]);

    const calculateMetrics = () => {
        // 1. Determine Weight
        let weight = 0;
        if (useExactWeight) {
            weight = parseFloat(weightInput) || 0;
        } else {
            switch (portion) {
                case 'Small': weight = 150; break; // Bowl/Snack
                case 'Medium': weight = 300; break; // Plate
                case 'Large': weight = 500; break; // Feast
            }
        }

        // 2. Determine Carb Density (g carbs per 100g food)
        let carbDensity = 0;
        let giValue = 0;

        switch (category) {
            case 'Green':
                carbDensity = 5; // 5% carbs (Veggies)
                giValue = 30;    // Low GI
                break;
            case 'Yellow':
                carbDensity = 20; // 20% carbs (Dal, Roti, Fruits)
                giValue = 55;     // Medium GI
                break;
            case 'Red':
                carbDensity = 50; // 50% carbs (Rice, Sweets)
                giValue = 75;     // High GI
                break;
        }

        // 3. Calculate Total Carbs
        const totalCarbs = (weight * carbDensity) / 100;
        setEstimatedCarbs(Math.round(totalCarbs));

        // 4. Calculate GL
        const calculatedGL = (totalCarbs * giValue) / 100;
        setGl(Math.round(calculatedGL));

        // 5. Determine Spike Risk
        if (category === 'Red' || calculatedGL > 20) {
            setSpikeRisk('Fast Spike');
        } else if (category === 'Yellow' || calculatedGL > 10) {
            setSpikeRisk('Balanced');
        } else {
            setSpikeRisk('Steady');
        }
    };

    // Auto-Analyze Effect
    // Removed useEffect for AI analysis on name change. AI analysis is now triggered by handleSave.

    const handleAIAnalyze = async () => {
        if (!name.trim()) return;

        setLoadingRec(true);
        try {
            const result = await geminiService.analyzeText(name, description);

            // Update metrics with AI results
            setEstimatedCarbs(result.nutritionalInfo.carbs);
            setGl(result.glycemicLoad);

            // Map AI sugar speed to local state
            if (result.sugarSpeed === 'Fast') setSpikeRisk('Fast Spike');
            else if (result.sugarSpeed === 'Moderate') setSpikeRisk('Balanced');
            else setSpikeRisk('Steady');

            // Set recommendations if available
            if (result.recommendations && result.recommendations.length > 0) {
                setRecommendations(result.recommendations);
            }

            // Check for added sugar
            if (result.addedSugarLikely || result.addedSugar?.detected) {
                setSugarModalVisible(true);
            }

            // Silent update - no alert
        } catch (error) {
            console.error("AI Analysis Failed:", error);
        } finally {
            setLoadingRec(false);
        }
    };

    const handleGetAdvice = async () => {
        if (!name.trim()) {
            alert("Please enter a food name first.");
            return;
        }
        setLoadingRec(true);
        setRecModalVisible(true);
        try {
            // Use description for better context if available
            const query = description.trim() ? `${name} (${description})` : name;
            const recs = await geminiService.getRecommendationsForFood(query);
            setRecommendations(recs);
        } catch (error) {
            setRecommendations(["Could not fetch advice. Try reducing portion size."]);
        } finally {
            setLoadingRec(false);
        }
    };

    // Old handleSave removed, replaced by handleSave (trigger) and handleSaveFinal (action)

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{STRINGS.LOGGING.MANUAL.TITLE}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Food Name */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Food Name</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="e.g., Chicken Biryani"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                            />
                            {loadingRec && <ActivityIndicator size="small" color={COLORS.brand.primary} />}
                        </View>
                    </View>

                    {/* Description (Optional) */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 60 }]}
                            placeholder="e.g., Homemade, less oil, extra chicken"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    {/* Category Selector (Traffic Light) */}
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s }}>
                            <Text style={styles.label}>Food Category</Text>
                            <TouchableOpacity onPress={() => alert("Green: Veggies, Salads\nYellow: Roti, Dal, Fruits\nRed: Rice, Sweets, Bread")}>
                                <Info size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.categoryContainer}>
                            <TouchableOpacity
                                style={[styles.categoryButton, category === 'Green' && { backgroundColor: COLORS.sugarScore.safe, borderColor: COLORS.sugarScore.safe }]}
                                onPress={() => setCategory('Green')}
                            >
                                <Text style={styles.categoryEmoji}>🥗</Text>
                                <Text style={[styles.categoryTitle, category === 'Green' && { color: COLORS.sugarScore.safeText }]}>Light Snack</Text>
                                <Text style={[styles.categorySub, category === 'Green' && { color: COLORS.sugarScore.safeText }]}>Veggies, Nuts</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.categoryButton, category === 'Yellow' && { backgroundColor: COLORS.sugarScore.warning, borderColor: COLORS.sugarScore.warning }]}
                                onPress={() => setCategory('Yellow')}
                            >
                                <Text style={styles.categoryEmoji}>🍛</Text>
                                <Text style={[styles.categoryTitle, category === 'Yellow' && { color: COLORS.sugarScore.warningText }]}>Balanced</Text>
                                <Text style={[styles.categorySub, category === 'Yellow' && { color: COLORS.sugarScore.warningText }]}>Roti, Dal</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.categoryButton, category === 'Red' && { backgroundColor: COLORS.sugarScore.danger, borderColor: COLORS.sugarScore.danger }]}
                                onPress={() => setCategory('Red')}
                            >
                                <Text style={styles.categoryEmoji}>🍰</Text>
                                <Text style={[styles.categoryTitle, category === 'Red' && { color: COLORS.sugarScore.criticalText }]}>Heavy/Sweet</Text>
                                <Text style={[styles.categorySub, category === 'Red' && { color: COLORS.sugarScore.criticalText }]}>Rice, Sweets</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Portion Size */}
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s }}>
                            <Text style={styles.label}>Portion Size</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.switchLabel}>Exact Grams</Text>
                                <Switch
                                    value={useExactWeight}
                                    onValueChange={setUseExactWeight}
                                    trackColor={{ false: COLORS.divider, true: COLORS.brand.primary }}
                                />
                            </View>
                        </View>

                        {useExactWeight ? (
                            <TextInput
                                style={[styles.input, { fontSize: 24, fontFamily: FONTS.heading, textAlign: 'center' }]}
                                placeholder="Enter weight in grams"
                                keyboardType="numeric"
                                value={weightInput}
                                onChangeText={setWeightInput}
                            />
                        ) : (
                            <View style={styles.segmentContainer}>
                                {(['Small', 'Medium', 'Large'] as const).map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[
                                            styles.segmentButton,
                                            portion === size && styles.segmentActive
                                        ]}
                                        onPress={() => setPortion(size)}
                                    >
                                        <Text style={[
                                            styles.segmentText,
                                            portion === size && styles.segmentTextActive
                                        ]}>
                                            {size}
                                        </Text>
                                        <Text style={styles.segmentSubtext}>
                                            {size === 'Small' ? 'Bowl' : size === 'Medium' ? 'Plate' : 'Feast'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Live Preview Card */}
                    <Card style={styles.previewCard} variant="solid">
                        <View style={styles.previewHeader}>
                            <Text style={styles.previewTitle}>{STRINGS.LOGGING.MANUAL.IMPACT_ESTIMATE}</Text>
                            <Text style={styles.previewSub}>~{estimatedCarbs}g Carbs</Text>
                        </View>

                        <View style={styles.metricsRow}>
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>{STRINGS.METRICS.SUGAR_SCORE}</Text>
                                <Text style={[styles.metricValue, { color: COLORS.brand.primary }]}>
                                    {gl}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.metricItem}>
                                <Text style={styles.metricLabel}>{STRINGS.METRICS.SPIKE_ALERT}</Text>
                                <Text style={[styles.metricValue, {
                                    fontSize: 18,
                                    color: spikeRisk === 'Steady' ? COLORS.sugarScore.safeText :
                                        spikeRisk === 'Balanced' ? COLORS.sugarScore.warningText :
                                            COLORS.sugarScore.criticalText
                                }]}>
                                    {spikeRisk === 'Fast Spike' ? STRINGS.METRICS.SUGAR_RUSH.FAST :
                                        spikeRisk === 'Balanced' ? STRINGS.METRICS.SUGAR_RUSH.MODERATE : STRINGS.METRICS.SUGAR_RUSH.SLOW}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* AI Advice Button for High Risk */}
                    {spikeRisk === 'Fast Spike' && (
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#F0FDF4',
                                padding: SPACING.m,
                                borderRadius: SIZES.borderRadius.m,
                                marginTop: SPACING.m,
                                borderWidth: 1,
                                borderColor: COLORS.brand.primary,
                                gap: 8
                            }}
                            onPress={handleGetAdvice}
                        >
                            <Text style={{ fontSize: 18 }}>💡</Text>
                            <Text style={{ fontFamily: FONTS.medium, color: COLORS.brand.primary }}>Get Smart Swap Advice</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title={isAnalyzing ? "Analyzing..." : STRINGS.HOME.ACTIONS.LOG_MEAL}
                        onPress={handleSave}
                        disabled={!name || isAnalyzing}
                        icon={isAnalyzing ? <ActivityIndicator color="#FFF" size="small" /> : <Check size={20} color="#FFF" />}
                    />
                </View>

                {/* AI Advice Modal */}
                <Modal
                    visible={recModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setRecModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
                                <Text style={styles.modalTitle}>Smart Swaps 💡</Text>
                                <TouchableOpacity onPress={() => setRecModalVisible(false)}>
                                    <Text style={{ fontSize: 20, color: COLORS.textSecondary }}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {loadingRec ? (
                                <View style={{ padding: SPACING.xl, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={COLORS.brand.primary} />
                                    <Text style={{ marginTop: SPACING.m, color: COLORS.textSecondary, fontFamily: FONTS.medium }}>Finding Indian alternatives...</Text>
                                </View>
                            ) : (
                                <View>
                                    <Text style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.text, marginBottom: SPACING.m }}>
                                        Here are some better choices for <Text style={{ fontFamily: FONTS.heading }}>{name}</Text>:
                                    </Text>
                                    {recommendations.map((rec, index) => (
                                        <View key={index} style={{ flexDirection: 'row', gap: 12, marginBottom: 12, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8 }}>
                                            <Text style={{ fontSize: 18 }}>🥗</Text>
                                            <Text style={{ fontFamily: FONTS.medium, color: COLORS.text, flex: 1, lineHeight: 22 }}>{rec}</Text>
                                        </View>
                                    ))}
                                    <Button
                                        title="Got it!"
                                        onPress={() => setRecModalVisible(false)}
                                        style={{ marginTop: SPACING.m }}
                                    />
                                </View>
                            )}
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

                            <View style={styles.modalButtons}>
                                <Button
                                    title="No, none"
                                    variant="ghost"
                                    onPress={() => {
                                        setSugarModalVisible(false);
                                        handleSaveFinal();
                                    }}
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

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 18,
        color: COLORS.text,
    },
    content: {
        padding: SPACING.l,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
    },
    switchLabel: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    categoryButton: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: SPACING.m,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        ...SHADOWS.light,
    },
    categoryEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryTitle: {
        fontFamily: FONTS.heading,
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 2,
    },
    categorySub: {
        fontFamily: FONTS.body,
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    segmentButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: SIZES.borderRadius.s,
    },
    segmentActive: {
        backgroundColor: COLORS.brand.primary,
    },
    segmentText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    segmentTextActive: {
        fontFamily: FONTS.heading,
        color: '#FFF',
    },
    segmentSubtext: {
        fontFamily: FONTS.body,
        fontSize: 10,
        color: COLORS.textTertiary,
        marginTop: 2,
    },
    previewCard: {
        marginTop: SPACING.m,
        backgroundColor: COLORS.surface,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        paddingBottom: SPACING.s,
        marginBottom: SPACING.m,
    },
    previewTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 16,
        color: COLORS.text,
    },
    previewSub: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontFamily: FONTS.heading,
        fontSize: 28,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.divider,
    },
    footer: {
        padding: SPACING.l,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
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
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginTop: SPACING.m,
    },
});
