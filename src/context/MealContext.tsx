import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { geminiService, FoodAnalysisResult } from '../services/GeminiService';
import { storageService } from '../services/StorageService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Meal {
    id: string; // Now UUID from Supabase
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
    // Supabase fields
    user_id?: string;
    created_at?: string;
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
    dietaryPreference: string | null;
    dailyBudget: number;
    glConsumed: number;
    spikeCount: number;
    meals: Meal[];
    isLoaded: boolean;
    pendingActions: PendingAction[];
    startScan: (imageUri: string, base64: string, date?: string) => void;
    startTextAnalysis: (name: string, description: string, context: string, sugarData?: any, date?: string) => void;
    startRefinement: (mealId: string, imageBase64: string | undefined, previousResult: FoodAnalysisResult, feedback: string) => void;
    logMeal: (meal: Omit<Meal, 'id' | 'timestamp'> & { timestamp?: Date }) => void;
    updateMeal: (id: string, updatedMeal: Partial<Meal>) => void;
    setGoal: (goal: UserGoal) => void;
    setDailyBudget: (budget: number) => void;
}

const MealContext = createContext<MealContextType | undefined>(undefined);

export const MealProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
    const [dietaryPreference, setDietaryPreference] = useState<string | null>(null);
    const [dailyBudget, setDailyBudget] = useState(100);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load from AsyncStorage (Fast) + Supabase (Sync)
    useEffect(() => {
        const loadLocalSettings = async () => {
            try {
                const localGoal = await AsyncStorage.getItem('user_goal');
                const localDiet = await AsyncStorage.getItem('user_diet');
                const localBudget = await AsyncStorage.getItem('daily_budget');

                if (localGoal) setUserGoal(localGoal as UserGoal);
                if (localDiet) setDietaryPreference(localDiet);
                if (localBudget) setDailyBudget(parseFloat(localBudget));
            } catch (e) {
                console.log("Error loading local settings:", e);
            }
        };
        loadLocalSettings();
    }, []);

    // Sync from Supabase (when user changes)
    useEffect(() => {
        if (!user || !user.id) {
            setMeals([]);
            return;
        }

        const loadData = async () => {
            console.log("🔄 MealContext: Loading data from Supabase for user:", user.id);
            try {
                // 1. Load Settings from Profiles
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const budget = profile.daily_budget || 100;
                    setDailyBudget(budget);
                    AsyncStorage.setItem('daily_budget', budget.toString());

                    if (profile.primary_goal) {
                        setUserGoal(profile.primary_goal as UserGoal);
                        AsyncStorage.setItem('user_goal', profile.primary_goal);
                    }
                    if (profile.dietary_preference) {
                        setDietaryPreference(profile.dietary_preference);
                        AsyncStorage.setItem('user_diet', profile.dietary_preference);
                    }
                }

                // 2. Load Meals
                // ... (rest of loading logic)
                console.log("DEBUG: Fetching meals for user:", user.id);
                const { data: mealsData, error: mealsError } = await supabase
                    .from('meals')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('timestamp', { ascending: false })
                    .limit(100); // Scalability: Limit to recent 100 items

                console.log("DEBUG: Fetch Result:", {
                    count: mealsData?.length,
                    error: mealsError,
                    firstMeal: mealsData?.[0]
                });

                if (mealsError) {
                    console.error("Error loading meals:", mealsError);
                    Alert.alert("Sync Error", "Failed to load meals from the cloud. Please check your connection.");
                } else if (mealsData) {
                    console.log(`DEBUG: Successfully loaded ${mealsData.length} meals.`);
                    const loadedMeals: Meal[] = mealsData.map(m => ({
                        id: m.id,
                        name: m.name,
                        gl: m.gl,
                        sugarSpeed: m.sugar_speed,
                        energyStability: m.energy_stability,
                        timestamp: new Date(m.timestamp),
                        imageUri: m.image_uri, // This might be a cloud path or local URI depending on strategy
                        analysisResult: m.analysis_result,
                        // We don't have addedSugar in DB schema explicitly yet, it's inside analysisResult Usually. 
                        // But TypeScript interface has it. Let's assume it's part of analysisResult or we need a column.
                        // For now, map if inside analysisResult
                        addedSugar: m.analysis_result?.addedSugar
                    }));
                    setMeals(loadedMeals);
                }

                setIsLoaded(true);
            } catch (e) {
                console.error("Failed to load user data:", e);
                // Alert.alert("Sync Error", "Unexpected error loading data."); // reduce noise
            }
        };

        loadData();
    }, [user?.id]);

    // Derived state (Memoized for performance)
    const glConsumed = useMemo(() => meals.reduce((total, meal) => total + meal.gl, 0), [meals]);
    const spikeCount = useMemo(() => meals.filter(m => m.sugarSpeed === 'Fast').length, [meals]);

    // --- Actions ---

    const setGoal = async (goal: UserGoal) => {
        setUserGoal(goal);
        let newBudget = 100;
        switch (goal) {
            case 'blood_sugar': newBudget = 70; break;
            case 'avoid_spikes': newBudget = 90; break;
            case 'energy': newBudget = 110; break;
            case 'pcos': newBudget = 75; break;
        }
        setDailyBudget(newBudget);

        AsyncStorage.setItem('user_goal', goal);
        AsyncStorage.setItem('daily_budget', newBudget.toString());

        if (user) {
            await supabase.from('profiles').update({
                primary_goal: goal,
                daily_budget: newBudget,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);
        }
    };

    const setDailyBudgetAction = async (budget: number) => {
        setDailyBudget(budget);
        if (user) {
            await supabase.from('profiles').update({
                daily_budget: budget,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);
        }
    }

    const logMeal = async (newMeal: Omit<Meal, 'id' | 'timestamp'> & { timestamp?: Date }) => {
        if (!user) {
            Alert.alert("Not Logged In", "You must be logged in to save meals.");
            return;
        }

        console.log("LOGGING MEAL: Starting for user:", user.id); // DEBUG

        // Optimistic UI Update - TEMPORARILY DISABLED FOR DEBUGGING
        /*
        const tempId = Math.random().toString(36).substr(2, 9);
        const optimisticMeal: Meal = {
            ...newMeal,
            id: tempId,
            timestamp: newMeal.timestamp || new Date(),
            user_id: user.id
        };
        setMeals(prev => [optimisticMeal, ...prev]);
        */

        // Persist to Supabase
        try {
            console.log("LOGGING MEAL: Sending insert request..."); // DEBUG
            console.log("DEBUG: Meal Timestamp being saved:", (newMeal.timestamp || new Date()).toISOString());
            const payload = {
                user_id: user.id,
                name: newMeal.name,
                gl: newMeal.gl,
                sugar_speed: newMeal.sugarSpeed,
                energy_stability: newMeal.energyStability,
                timestamp: (newMeal.timestamp || new Date()).toISOString(),
                image_uri: newMeal.imageUri || null,
                analysis_result: newMeal.analysisResult
            };
            console.log("Payload:", JSON.stringify(payload)); // DEBUG

            const { data, error } = await supabase.from('meals').insert(payload).select().single();

            if (error) {
                console.error("Error logging meal:", error);
                Alert.alert("Save Failed", `Could not save meal: ${error.message} (${error.code})`);
            } else if (data) {
                console.log("LOGGING MEAL: Success!", data); // DEBUG

                // IMMEDIATE VERIFICATION
                console.log("VERIFICATION: Checking if row exists in DB...");
                const { data: verifyData, error: verifyError } = await supabase
                    .from('meals')
                    .select('*')
                    .eq('id', data.id)
                    .single();

                if (verifyData) {
                    console.log("VERIFICATION: Row found!", verifyData);
                    // Manually update state with REAL data from DB
                    const savedMeal: Meal = {
                        id: data.id,
                        name: data.name,
                        gl: data.gl,
                        sugarSpeed: data.sugar_speed,
                        energyStability: data.energy_stability,
                        timestamp: new Date(data.timestamp),
                        imageUri: data.image_uri,
                        analysisResult: data.analysis_result,
                        addedSugar: data.analysis_result?.addedSugar,
                        user_id: data.user_id
                    };
                    setMeals(prev => [savedMeal, ...prev]);
                    Alert.alert("Success", "Meal saved and verified in cloud.");
                } else {
                    console.error("VERIFICATION: Row NOT found immediately after insert!", verifyError);
                    Alert.alert("Ghost Save", "Server reported success, but data vanished. Check RLS policies.");
                }
            } else {
                console.warn("LOGGING MEAL: No data returned but no error?");
            }

        } catch (e) {
            console.error("Exception logging meal:", e);
            Alert.alert("Save Error", "Network or server error.");
        }
    };

    const updateMeal = async (id: string, updatedMeal: Partial<Meal>) => {
        // Optimistic Update
        setMeals(prev => prev.map(meal =>
            meal.id === id ? { ...meal, ...updatedMeal } : meal
        ));

        if (!user) return;

        // Prepare DB payload
        const updates: any = {};
        if (updatedMeal.name) updates.name = updatedMeal.name;
        if (updatedMeal.gl !== undefined) updates.gl = updatedMeal.gl;
        if (updatedMeal.sugarSpeed) updates.sugar_speed = updatedMeal.sugarSpeed;
        if (updatedMeal.energyStability) updates.energy_stability = updatedMeal.energyStability;
        if (updatedMeal.analysisResult) updates.analysis_result = updatedMeal.analysisResult;

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from('meals').update(updates).eq('id', id).eq('user_id', user.id);
            if (error) console.error("Error updating meal:", error);
        }
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

    // Helper to get current profile state for AI
    const getUserProfile = () => ({
        goal: userGoal || undefined,
        diet: dietaryPreference || 'non-veg' // Default to non-veg if unknown to avoid strict blocking? Or 'veg' for safety? Defaulting 'non-veg' assumes user can filter, but 'veg' is safer. Let's stick to what we have.
    });

    const processScan = async (action: PendingAction) => {
        const { id, imageBase64, imageUri, data } = action;
        if (!imageBase64) return;

        let isMounted = true;
        try {
            updateActionStatus(id, 'analyzing', 20);

            const t1 = setTimeout(() => { if (isMounted) updateActionStatus(id, 'separating', 50); }, 2500);
            const t2 = setTimeout(() => { if (isMounted) updateActionStatus(id, 'calculating', 75); }, 4500);

            // PASS USER PROFILE HERE
            const result = await geminiService.analyzeFood(imageBase64, getUserProfile(), imageUri);

            clearTimeout(t1);
            clearTimeout(t2);

            if (!isMounted) return;
            updateActionStatus(id, 'finalizing', 100);

            let finalImageUri = imageUri;
            if (imageUri) {
                finalImageUri = await storageService.saveImage(imageUri);
            }

            const timestamp = data?.date ? new Date(data.date) : new Date();

            await logMeal({
                name: result.foodName,
                gl: result.glycemicLoad,
                sugarSpeed: result.sugarSpeed,
                energyStability: result.energyStability,
                imageUri: finalImageUri,
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

            // PASS USER PROFILE HERE
            const result = await geminiService.analyzeText(
                data.name || '',
                data.description,
                data.context,
                getUserProfile()
            );

            clearTimeout(t1);

            if (!isMounted) return;
            updateActionStatus(id, 'finalizing', 100);

            let finalGL = result.glycemicLoad;
            if (data.sugarData) {
                const grams = data.sugarData.unit === 'spoon' ? data.sugarData.amount * 4 : data.sugarData.amount;
                finalGL += (grams * 65) / 100;
            }

            const timestamp = data.date ? new Date(data.date) : new Date();

            await logMeal({
                name: result.foodName,
                gl: Math.round(finalGL),
                sugarSpeed: result.sugarSpeed,
                energyStability: result.energyStability,
                analysisResult: {
                    ...result,
                    glycemicLoad: Math.round(finalGL),
                    userDescription: data.description, // Save the input text!
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

            // PASS USER PROFILE HERE
            const result = await geminiService.refineAnalysisWithFeedback(
                imageBase64,
                data.previousResult,
                data.userFeedback || '',
                getUserProfile()
            );

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
            dietaryPreference,
            dailyBudget,
            glConsumed,
            spikeCount,
            meals,
            isLoaded,
            pendingActions,
            startScan,
            startTextAnalysis,
            startRefinement,
            logMeal,
            updateMeal,
            setGoal,
            setDailyBudget: setDailyBudgetAction
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
