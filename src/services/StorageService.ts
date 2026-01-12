import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Meal } from '../context/MealContext';

const MEALS_KEY = 'meals_data';
const BUDGET_KEY = 'user_budget';

export class StorageService {

    // --- Public API ---

    // --- Public API ---

    async saveMeals(meals: Meal[]): Promise<void> {
        // Deprecated: Meals are now saved to Supabase
        // console.log("StorageService.saveMeals is deprecated");
    }

    async loadMeals(): Promise<Meal[]> {
        // Deprecated: Meals are loaded from Supabase
        console.log("StorageService.loadMeals is deprecated");
        return [];
    }

    async saveBudget(budget: number): Promise<void> {
        // Deprecated: Budget is saved to Supabase user_settings
    }

    async loadBudget(): Promise<number | null> {
        // Deprecated
        return null;
    }

    /**
     * Move a temporary image (from camera/picker) to permanent storage (Native)
     * OR return safe Data URI (Web).
     */
    async saveImage(tempUri: string): Promise<string> {
        if (!tempUri) return tempUri;

        if (Platform.OS === 'web') {
            // On Web, we can't "move" files. 
            // If it's a blob: URI, we hope the caller also provided a base64 string 
            // which will be saved in the meal object directly.
            // This function creates a side-effect on Native but is identity on Web 
            // UNLESS we want to convert Blob to Base64 here? 
            // For now, assume MealContext handles Base64 generation.
            return tempUri;
        }

        // Native Logic
        try {
            const FS = FileSystem as any;
            const rawDocDir = FS.documentDirectory;
            if (!rawDocDir) {
                console.warn('⚠️ StorageService: No document directory');
                return tempUri;
            }

            const docDir = rawDocDir.endsWith('/') ? rawDocDir : rawDocDir + '/';
            const fileName = tempUri.split('/').pop() || `img-${Date.now()}.jpg`;
            const mealsDir = docDir + 'meals/';
            const newPath = mealsDir + fileName;

            const dirInfo = await FS.getInfoAsync(mealsDir);
            if (!dirInfo.exists) {
                await FS.makeDirectoryAsync(mealsDir, { intermediates: true });
            }

            await FS.copyAsync({ from: tempUri, to: newPath });
            // Return resolved path (absolute) for now, will be normalized on saveMeals
            return newPath;

        } catch (error) {
            console.error("❌ StorageService: Failed to save image", error);
            return tempUri; // Fallback to original
        }
    }

    // --- Private Helpers ---

    private prepareMealsForStorage(meals: Meal[]): any[] {
        return meals.map(m => {
            // Shallow clone
            const clone = { ...m };

            if (Platform.OS === 'web') {
                // WEB: Persist base64 (Data URI logic)
                // If it's a blob url and we have base64, ensure we keep base64
                // We don't strip anything.
                return clone;
            }

            // NATIVE: Persist FileSystem Path
            // 1. Strip Base64 to save space
            delete clone.imageBase64;

            // 2. Strip Data URIs from imageUri if they exist (should not on native)
            if (clone.imageUri?.startsWith('data:')) {
                clone.imageUri = undefined;
            }

            // 3. Normalize Path for Sandbox Rotation
            const FS = FileSystem as any;
            const rawDocDir = FS.documentDirectory;
            const docDir = rawDocDir ? (rawDocDir.endsWith('/') ? rawDocDir : rawDocDir + '/') : null;

            if (clone.imageUri && docDir && clone.imageUri.startsWith(docDir)) {
                clone.imageUri = clone.imageUri.replace(docDir, '{{DOC_DIR}}');
            }

            return clone;
        });
    }

    private hydrateMeals(meals: any[]): Meal[] {
        // Native Doc Dir
        let docDir: string | null = null;
        if (Platform.OS !== 'web') {
            const FS = FileSystem as any;
            const raw = FS.documentDirectory;
            docDir = raw ? (raw.endsWith('/') ? raw : raw + '/') : null;
        }

        return meals.map(m => {
            if (!m) return null;
            const meal = { ...m };

            // NATIVE: Hydrate Path
            if (Platform.OS !== 'web' && docDir && meal.imageUri && meal.imageUri.includes('{{DOC_DIR}}')) {
                meal.imageUri = meal.imageUri.replace('{{DOC_DIR}}', docDir);
            }

            // WEB: Fallback from imageBase64 if imageUri is lost/blob
            if (Platform.OS === 'web') {
                if (!meal.imageUri && meal.imageBase64) {
                    meal.imageUri = `data:image/jpeg;base64,${meal.imageBase64}`;
                }
            }

            return meal;
        }).filter(Boolean);
    }
}

export const storageService = new StorageService();
