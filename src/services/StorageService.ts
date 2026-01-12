import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';


const MEALS_KEY = 'meals_data';
const BUDGET_KEY = 'user_budget';

export class StorageService {

    // --- Public API ---

    // --- Public API ---

    // --- Public API ---

    // Deprecated methods removed for scalability audit


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

    // --- Private Helpers ---
    // Deprecated helpers removed.
}

export const storageService = new StorageService();
