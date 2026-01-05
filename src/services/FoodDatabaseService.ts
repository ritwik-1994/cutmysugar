import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { Platform } from 'react-native';

export interface FoodItem {
    food_id: string;
    canonical_name: string;
    primary_category: string;
    serving_type: string;
    gi: number;
    gl_median: number;
    gl_category: 'Low' | 'Medium' | 'High';
    serving_size_g: number;
    serving_size_min_g?: number;
    serving_size_max_g?: number;
    available_carbs_g: number;
}

class FoodDatabaseService {
    private database: FoodItem[] = [];
    private isLoaded: boolean = false;

    async loadDatabase(): Promise<void> {
        if (this.isLoaded) return;

        try {
            const asset = Asset.fromModule(require('../assets/data/gi_gl_master.csv'));
            await asset.downloadAsync();

            let fileContent: string;

            if (Platform.OS === 'web') {
                const response = await fetch(asset.uri);
                fileContent = await response.text();
            } else {
                fileContent = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);
            }

            return new Promise((resolve, reject) => {
                Papa.parse(fileContent, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        this.database = results.data as FoodItem[];
                        this.isLoaded = true;
                        console.log(`[FoodDatabase] Loaded ${this.database.length} items.`);
                        resolve();
                    },
                    error: (error: Error) => {
                        console.error('[FoodDatabase] Parse error:', error);
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error('[FoodDatabase] Load error:', error);
            // Don't throw, just log so app doesn't crash
            // throw error; 
        }
    }

    search(query: string): FoodItem[] {
        if (!query || query.length < 2) return [];

        const lowerQuery = query.toLowerCase();
        return this.database.filter(item =>
            item.canonical_name && item.canonical_name.toLowerCase().includes(lowerQuery)
        ).slice(0, 50); // Limit results for performance
    }

    getFoodById(id: string): FoodItem | undefined {
        return this.database.find(item => item.food_id === id);
    }
}

export const foodDatabaseService = new FoodDatabaseService();
