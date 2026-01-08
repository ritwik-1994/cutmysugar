import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiService, FoodAnalysisResult } from '../services/GeminiService';

export interface Meal {
    id: string;
    name: string;
    gl: number;
    sugarSpeed: 'Slow' | 'Moderate' | 'Fast';
    energyStability: 'Stable' | 'Unsteady' | 'Crash';
    timestamp: Date;
    imageUri?: string;
    imageBase64?: string;
    analysisResult?: FoodAnalysisResult;
    addedSugar?: {
        amount: number;
        unit: 'g' | 'spoon';
        typeId: string;
    };
}

export type ScanStatus = 'uploading' | 'analyzing' | 'separating' | 'calculating' | 'finalizing' | 'failed';

export type ActionType = 'scan' | 'text' | 'refine';

export interface PendingAction {
    id: string;
    type: ActionType;
    label: string;
    imageUri?: string;
    imageBase64?: string;
    status: ScanStatus;
    progress: number;
    timestamp: Date;
    data?: {
        name?: string;
        description?: string;
        context?: string;
        mealId?: string;
        previousResult?: FoodAnalysisResult;
        userFeedback?: string;
        sugarData?: { amount: number; unit: 'g' | 'spoon'; typeId: string };
        date?: string; // Add date field
    };
}

export type UserGoal = 'blood_sugar' | 'avoid_spikes' | 'energy' | 'pcos';

interface MealContextType {
    userGoal: UserGoal | null;
    dailyBudget: number;
    glConsumed: number;
    spikeCount: number;
    meals: Meal[];
    pendingActions: PendingAction[];
    startScan: (imageUri: string, base64: string, date?: string) => void; // Update signature
    startTextAnalysis: (name: string, description: string, context: string, sugarData?: any, date?: string) => void;
    startRefinement: (mealId: string, imageBase64: string | undefined, previousResult: FoodAnalysisResult, feedback: string) => void;
    logMeal: (meal: Omit<Meal, 'id' | 'timestamp'> & { timestamp?: Date }) => void;
    updateMeal: (id: string, updatedMeal: Partial<Meal>) => void;
    setGoal: (goal: UserGoal) => void;
    setDailyBudget: (budget: number) => void;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: ReactNode }) => {
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
    const [dailyBudget, setDailyBudget] = useState(100);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            console.log("🔄 MealContext: Loading data...");
            try {
                let storedMeals: string | null = null;
                let storedBudget: string | null = null;

                if (Platform.OS === 'web') {
                    storedMeals = window.localStorage.getItem('meals_data');
                    storedBudget = window.localStorage.getItem('user_budget');
                } else {
                    storedMeals = await AsyncStorage.getItem('meals_data');
                    storedBudget = await AsyncStorage.getItem('user_budget');
                }

                if (storedMeals) {
                    try {
                        const parsedMeals = JSON.parse(storedMeals, (key, value) => {
                            if (key === 'timestamp' && typeof value === 'string') {
                                const d = new Date(value);
                                return isNaN(d.getTime()) ? new Date() : d; // Safe date parsing
                            }
                            return value;
                        });
                        console.log(`✅ MealContext: Loaded ${parsedMeals.length} meals.`);
                        setMeals(parsedMeals);
                    } catch (parseError) {
                        console.error("❌ MealContext: JSON Parse Error", parseError);
                    }
                } else {
                    console.log("ℹ️ MealContext: No stored meals found.");
                }

                if (storedBudget) {
                    setDailyBudget(parseInt(storedBudget));
                }
            } catch (e) {
                console.error('❌ MealContext: Failed to load meal data', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Save data
    useEffect(() => {
        if (!isLoaded) return;

        // Strip heavy images to prevent LocalStorage Quota Exceeded (5MB Limit)
        const mealsToPersist = meals.map(m => {
            const { imageBase64, ...rest } = m;
            // Also check if URI is a massive data URL and strip it if needed
            if (rest.imageUri?.startsWith('data:')) {
                rest.imageUri = undefined;
            }
            return rest;
        });

        console.log(`💾 MealContext: Saving ${mealsToPersist.length} meals (text only) to storage.`);
        const json = JSON.stringify(mealsToPersist);

        if (Platform.OS === 'web') {
            try {
                window.localStorage.setItem('meals_data', json);
            } catch (err) {
                console.error("❌ MealContext: LocalStorage Quota Exceeded!", err);
            }
        } else {
            AsyncStorage.setItem('meals_data', json).catch(e =>
                console.error("❌ MealContext: Save Failed", e)
            );
        }
    }, [meals, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        const budgetStr = dailyBudget.toString();
        if (Platform.OS === 'web') {
            window.localStorage.setItem('user_budget', budgetStr);
        } else {
            AsyncStorage.setItem('user_budget', budgetStr).catch(console.error);
        }
    }, [dailyBudget, isLoaded]);

    // Derived state
    const glConsumed = meals.reduce((total, meal) => total + meal.gl, 0);
    const spikeCount = meals.filter(m => m.sugarSpeed === 'Fast').length;

    const setGoal = (goal: UserGoal) => {
        setUserGoal(goal);
        switch (goal) {
            case 'blood_sugar': setDailyBudget(70); break;
            case 'avoid_spikes': setDailyBudget(90); break;
            case 'energy': setDailyBudget(110); break;
            case 'pcos': setDailyBudget(75); break;
        }
    };

    const logMeal = (newMeal: Omit<Meal, 'id' | 'timestamp'> & { timestamp?: Date }) => {
        const meal: Meal = {
            ...newMeal,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: newMeal.timestamp || new Date(),
        };
        setMeals(prev => [meal, ...prev]);
    };

    const updateMeal = (id: string, updatedMeal: Partial<Meal>) => {
        setMeals(prev => prev.map(meal =>
            meal.id === id ? { ...meal, ...updatedMeal } : meal
        ));
    };

    // --- Helpers ---

    const updateActionStatus = (id: string, status: ScanStatus, progress: number) => {
        setPendingActions(prev => prev.map(a =>
            a.id === id ? { ...a, status, progress } : a
        ));
    };

    const removeAction = (id: string, delayMs = 1000) => {
        setTimeout(() => {
            setPendingActions(prev => prev.filter(a => a.id !== id));
        }, delayMs);
    };

    // --- Processors ---

    const processScan = async (action: PendingAction) => {
        const { id, imageBase64, imageUri, data } = action;
        if (!imageBase64) return;

        let isMounted = true;
        try {
            updateActionStatus(id, 'analyzing', 20);

            const t1 = setTimeout(() => { if (isMounted) updateActionStatus(id, 'separating', 50); }, 2500);
            const t2 = setTimeout(() => { if (isMounted) updateActionStatus(id, 'calculating', 75); }, 4500);

            const result = await geminiService.analyzeFood(imageBase64);
            clearTimeout(t1);
            clearTimeout(t2);

            if (!isMounted) return;
            updateActionStatus(id, 'finalizing', 100);

            // Use provided date or fallback to now
            const timestamp = data?.date ? new Date(data.date) : new Date();

            logMeal({
                name: result.foodName,
                gl: result.glycemicLoad,
                sugarSpeed: result.sugarSpeed,
                energyStability: result.energyStability,
                imageUri,
                imageBase64,
                analysisResult: result,
                timestamp: timestamp
            });
            removeAction(id);
        } catch (error) {
            console.error('Scan Failed:', error);
            if (isMounted) {
                updateActionStatus(id, 'failed', 0);
                removeAction(id, 3000);
            }
        }
    };

    const processTextAnalysis = async (action: PendingAction) => {
        const { id, data } = action;
        if (!data) return;

        let isMounted = true;
        try {
            updateActionStatus(id, 'analyzing', 30);
            const t1 = setTimeout(() => { if (isMounted) updateActionStatus(id, 'calculating', 70); }, 2000);

            const result = await geminiService.analyzeText(data.name || '', data.description, data.context);
            clearTimeout(t1);

            if (!isMounted) return;
            updateActionStatus(id, 'finalizing', 100);

            let finalGL = result.glycemicLoad;
            if (data.sugarData) {
                const grams = data.sugarData.unit === 'spoon' ? data.sugarData.amount * 4 : data.sugarData.amount;
                finalGL += (grams * 65) / 100;
            }

            // Use provided date or fallback to now
            const timestamp = data.date ? new Date(data.date) : new Date();

            logMeal({
                name: result.foodName,
                gl: Math.round(finalGL),
                sugarSpeed: result.sugarSpeed,
                energyStability: result.energyStability,
                analysisResult: {
                    ...result,
                    glycemicLoad: Math.round(finalGL),
                    addedSugar: data.sugarData ? {
                        detected: true,
                        source: data.sugarData.typeId,
                        amount: data.sugarData.amount
                    } : result.addedSugar
                },
                addedSugar: data.sugarData,
                timestamp: timestamp
            });
            removeAction(id);
        } catch (error) {
            console.error('Text Analysis Failed:', error);
            if (isMounted) {
                updateActionStatus(id, 'failed', 0);
                removeAction(id, 3000);
            }
        }
    };

    const processRefinement = async (action: PendingAction) => {
        const { id, data, imageBase64 } = action;
        if (!data || !data.previousResult) return;

        let isMounted = true;
        try {
            updateActionStatus(id, 'analyzing', 30);
            const result = await geminiService.refineAnalysisWithFeedback(imageBase64, data.previousResult, data.userFeedback || '');

            if (!isMounted) return;
            updateActionStatus(id, 'finalizing', 100);

            if (data.mealId) {
                updateMeal(data.mealId, {
                    name: result.foodName,
                    gl: result.glycemicLoad,
                    sugarSpeed: result.sugarSpeed,
                    energyStability: result.energyStability,
                    analysisResult: result
                });
            }
            removeAction(id);
        } catch (error) {
            console.error('Refinement Failed:', error);
            if (isMounted) {
                updateActionStatus(id, 'failed', 0);
                removeAction(id, 3000);
            }
        }
    };

    // --- Action Starters ---

    const startScan = (imageUri: string, base64: string, date?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const action: PendingAction = {
            id, type: 'scan', label: 'Scanning Food...',
            imageUri, imageBase64: base64,
            status: 'uploading', progress: 10, timestamp: new Date(),
            data: { date }
        };
        setPendingActions(prev => [action, ...prev]);
        processScan(action);
    };

    const startTextAnalysis = (name: string, description: string, context: string, sugarData?: any, date?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const action: PendingAction = {
            id, type: 'text', label: `Analyzing ${name}...`,
            status: 'uploading', progress: 10, timestamp: new Date(),
            data: { name, description, context, sugarData, date }
        };
        setPendingActions(prev => [action, ...prev]);
        processTextAnalysis(action);
    };

    const startRefinement = (mealId: string, imageBase64: string | undefined, previousResult: FoodAnalysisResult, feedback: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const action: PendingAction = {
            id, type: 'refine', label: `Updating ${previousResult.foodName}...`,
            imageBase64,
            status: 'uploading', progress: 10, timestamp: new Date(),
            data: { mealId, previousResult, userFeedback: feedback }
        };
        setPendingActions(prev => [action, ...prev]);
        processRefinement(action);
    };

    return (
        <MealContext.Provider value={{
            userGoal,
            dailyBudget,
            glConsumed,
            spikeCount,
            meals,
            pendingActions,
            startScan,
            startTextAnalysis,
            startRefinement,
            logMeal,
            updateMeal,
            setGoal,
            setDailyBudget
        }}>
            {children}
        </MealContext.Provider>
    );
};

export const useMeal = () => {
    const context = useContext(MealContext);
    if (context === undefined) {
        throw new Error('useMeal must be used within a MealProvider');
    }
    return context;
};
