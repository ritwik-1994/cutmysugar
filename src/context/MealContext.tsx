import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FoodAnalysisResult } from '../services/GeminiService';


export interface Meal {
    id: string;
    name: string;
    gl: number;
    sugarSpeed: 'Slow' | 'Moderate' | 'Fast';
    energyStability: 'Steady' | 'Okay' | 'Likely Crash';
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

export type UserGoal = 'blood_sugar' | 'avoid_spikes' | 'energy' | 'pcos';

interface MealContextType {
    userGoal: UserGoal | null;
    dailyBudget: number;
    glConsumed: number;
    spikeCount: number;
    meals: Meal[];
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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedMeals = await AsyncStorage.getItem('meals_data');
                const storedBudget = await AsyncStorage.getItem('user_budget');

                if (storedMeals) {
                    // Need to revive Date objects from JSON strings
                    const parsedMeals = JSON.parse(storedMeals, (key, value) => {
                        if (key === 'timestamp') return new Date(value);
                        return value;
                    });
                    setMeals(parsedMeals);
                }

                if (storedBudget) {
                    setDailyBudget(parseInt(storedBudget));
                }
            } catch (e) {
                console.error('Failed to load meal data', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    // Save meals whenever they change
    useEffect(() => {
        if (!isLoaded) return;
        const saveMeals = async () => {
            try {
                await AsyncStorage.setItem('meals_data', JSON.stringify(meals));
            } catch (e) {
                console.error('Failed to save meals', e);
            }
        };
        saveMeals();
    }, [meals, isLoaded]);

    // Save budget whenever it changes
    useEffect(() => {
        if (!isLoaded) return;
        const saveBudget = async () => {
            try {
                await AsyncStorage.setItem('user_budget', dailyBudget.toString());
            } catch (e) {
                console.error('Failed to save budget', e);
            }
        };
        saveBudget();
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

    return (
        <MealContext.Provider value={{
            userGoal,
            dailyBudget,
            glConsumed,
            spikeCount,
            meals,
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
