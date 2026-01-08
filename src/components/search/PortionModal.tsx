import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { X, Check, Scale, Utensils, AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS, FONTS } from '../../styles/theme';
import { FoodItem } from '../../services/FoodDatabaseService';
import { useMeal } from '../../context/MealContext';
import { SUGAR_TYPES } from '../../data/sugars';
import { Button } from '../ui/Button';
import { GeminiService, geminiService } from '../../services/GeminiService';

interface PortionModalProps {
    visible: boolean;
    food: FoodItem;
    onClose: () => void;
    onAdd: () => void;
    date?: string;
}

type InputMode = 'servings' | 'grams';

export default function PortionModal({ visible, food, onClose, onAdd, date }: PortionModalProps) {
    const { logMeal, startTextAnalysis } = useMeal();
    const [mode, setMode] = useState<InputMode>('servings');
    const [quantity, setQuantity] = useState('1'); // Default 1 serving
    const [calculatedGL, setCalculatedGL] = useState(food.gl_median);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Removed local instantiation

    // Added Sugar State
    const [sugarModalVisible, setSugarModalVisible] = useState(false);
    const [sugarAmount, setSugarAmount] = useState('');
    const [sugarUnit, setSugarUnit] = useState<'g' | 'spoon'>('spoon');
    const [sugarType, setSugarType] = useState<string>('white_sugar');

    // Reset state when food changes
    useEffect(() => {
        if (visible) {
            setMode('servings');
            setQuantity('1');
            setSugarModalVisible(false);
            setSugarAmount('');
            setIsAnalyzing(false);
        }
    }, [visible, food]);

    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        let grams = 0;

        if (mode === 'servings') {
            grams = qty * food.serving_size_g;
        } else {
            grams = qty;
        }

        // GL = (GI * Available Carbs) / 100
        // Calculate carbs based on grams
        const carbsPerGram = food.available_carbs_g / food.serving_size_g;
        const totalCarbs = carbsPerGram * grams;
        const newGL = (food.gi * totalCarbs) / 100;

        setCalculatedGL(newGL);
    }, [quantity, mode, food]);

    const handleConfirmSugar = () => {
        if (!sugarAmount) {
            setSugarModalVisible(false);
            handleLogFinal();
            return;
        }

        const amount = parseFloat(sugarAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid positive number");
            return;
        }

        const sugarData = { amount, unit: sugarUnit, typeId: sugarType };
        setSugarModalVisible(false);
        handleLogFinal(sugarData);
    };

    const handleAdd = async () => {
        // Skip AI for database items as requested.
        // Use local DB values for GL and macros.
        handleLogFinal();
    };

    const handleLogFinal = (sugarData?: { amount: number; unit: 'g' | 'spoon'; typeId: string }) => {
        const qty = parseFloat(quantity) || 0;
        let grams = 0;

        if (mode === 'servings') {
            grams = qty * food.serving_size_g;
        } else {
            grams = qty;
        }

        let finalGL = calculatedGL;
        if (sugarData) {
            const sugarGrams = sugarData.unit === 'spoon' ? sugarData.amount * 4 : sugarData.amount;
            const glIncrease = (sugarGrams * 65) / 100;
            finalGL += glIncrease;
        }

        logMeal({
            name: food.canonical_name,
            gl: Math.round(finalGL),
            sugarSpeed: food.gl_category === 'High' ? 'Fast' : 'Moderate',
            energyStability: food.gl_category === 'High' ? 'Likely Crash' : 'Steady',
            imageUri: undefined,
            timestamp: date ? new Date(date) : new Date(),
            addedSugar: sugarData
        });
        onAdd();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContainer}
                        >
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.title}>Adjust Portion</Text>
                                    <Text style={styles.subtitle}>How much did you eat?</Text>
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X color={COLORS.textSecondary} size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.content}>
                                <View style={styles.foodInfo}>
                                    <Text style={styles.foodName}>{food.canonical_name}</Text>
                                    <Text style={styles.foodCategory}>{food.primary_category}</Text>
                                </View>

                                {/* Toggle Switch */}
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.toggleOption, mode === 'servings' && styles.toggleActive]}
                                        onPress={() => {
                                            setMode('servings');
                                            setQuantity('1');
                                        }}
                                    >
                                        <Utensils size={16} color={mode === 'servings' ? COLORS.brand.primary : COLORS.textSecondary} />
                                        <Text style={[styles.toggleText, mode === 'servings' && styles.toggleTextActive]}>Servings</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleOption, mode === 'grams' && styles.toggleActive]}
                                        onPress={() => {
                                            setMode('grams');
                                            setQuantity(food.serving_size_g.toString());
                                        }}
                                    >
                                        <Scale size={16} color={mode === 'grams' ? COLORS.brand.primary : COLORS.textSecondary} />
                                        <Text style={[styles.toggleText, mode === 'grams' && styles.toggleTextActive]}>Grams</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        keyboardType="numeric"
                                        selectTextOnFocus
                                        autoFocus
                                    />
                                    <Text style={styles.unitText}>{mode === 'servings' ? food.serving_type || 'serving(s)' : 'g'}</Text>
                                </View>

                                <Text style={styles.helperText}>
                                    {mode === 'servings'
                                        ? `1 ${food.serving_type || 'serving'} ≈ ${food.serving_size_g}g`
                                        : `Standard serving: ${food.serving_size_g}g${food.serving_size_min_g && food.serving_size_max_g
                                            ? ` (Range: ${food.serving_size_min_g}-${food.serving_size_max_g}g)`
                                            : ''
                                        }`}
                                </Text>

                                <View style={styles.statsContainer}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Est. GL</Text>
                                        <Text style={[styles.statValue, { color: COLORS.brand.primary }]}>
                                            {Math.round(calculatedGL)}
                                        </Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Glycemic Index</Text>
                                        <Text style={styles.statValue}>{Math.round(food.gi)}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.addButton, isAnalyzing && { opacity: 0.7 }]}
                                    onPress={handleAdd}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <ActivityIndicator color="white" size="small" style={{ marginRight: 8 }} />
                                            <Text style={styles.addButtonText}>Analyzing...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.addButtonText}>Add to Log</Text>
                                            <Check color="white" size={20} style={styles.checkIcon} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>

            {/* Added Sugar Modal */}
            <Modal
                visible={sugarModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSugarModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.overlay}
                >
                    <View style={styles.modalContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <AlertTriangle size={24} color={COLORS.gl.warningText} />
                            <Text style={styles.title}>Added Sugar?</Text>
                        </View>
                        <Text style={styles.subtitle}>Select the type of sweetener and amount added.</Text>

                        {/* Sugar Type Selector - Wrapped Chips */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, marginTop: 16 }}>
                            {SUGAR_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: sugarType === type.id ? COLORS.brand.primary : COLORS.background,
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
                                style={[styles.input, { minHeight: 50, marginBottom: 12, textAlign: 'center', fontSize: 24, fontFamily: FONTS.heading, borderWidth: 1, borderColor: COLORS.divider, borderRadius: 12 }]}
                                placeholder="0"
                                keyboardType="numeric"
                                value={sugarAmount}
                                onChangeText={setSugarAmount}
                            />
                            <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, height: 44, alignSelf: 'center' }}>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 24, justifyContent: 'center', backgroundColor: sugarUnit === 'spoon' ? COLORS.brand.primary : COLORS.background }}
                                    onPress={() => setSugarUnit('spoon')}
                                >
                                    <Text style={{ color: sugarUnit === 'spoon' ? '#FFF' : COLORS.text, fontFamily: FONTS.medium }}>spoon</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 24, justifyContent: 'center', backgroundColor: sugarUnit === 'g' ? COLORS.brand.primary : COLORS.background }}
                                    onPress={() => setSugarUnit('g')}
                                >
                                    <Text style={{ color: sugarUnit === 'g' ? '#FFF' : COLORS.text, fontFamily: FONTS.medium }}>g</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Button
                                title="No, none"
                                variant="ghost"
                                onPress={() => {
                                    setSugarModalVisible(false);
                                    handleLogFinal();
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
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.borderRadius.xl,
        borderTopRightRadius: SIZES.borderRadius.xl,
        padding: SPACING.l,
        paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.l,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        gap: SPACING.m,
    },
    foodInfo: {
        marginBottom: SPACING.s,
    },
    foodName: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    foodCategory: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: SIZES.borderRadius.m,
        padding: 4,
        marginBottom: SPACING.s,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: SIZES.borderRadius.s,
        gap: 8,
    },
    toggleActive: {
        backgroundColor: COLORS.surface,
        ...SHADOWS.light,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    toggleTextActive: {
        color: COLORS.brand.primary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.brand.primary,
        borderRadius: SIZES.borderRadius.l,
        paddingHorizontal: SPACING.l,
        height: 64,
    },
    input: {
        flex: 1,
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text,
        height: '100%',
    },
    unitText: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    helperText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: -8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.l,
        marginTop: SPACING.s,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: COLORS.divider,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    addButton: {
        backgroundColor: COLORS.brand.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.l,
        marginTop: SPACING.s,
        ...SHADOWS.medium,
    },
    addButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginRight: SPACING.s,
    },
    checkIcon: {
        marginLeft: 4,
    },
});
