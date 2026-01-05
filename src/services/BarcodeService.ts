import { Platform } from 'react-native';

export interface ProductData {
    barcode: string;
    name: string;
    brand: string;
    image?: string;
    ingredients?: string;
    nutriments?: {
        carbohydrates_100g?: number;
        sugars_100g?: number;
        fiber_100g?: number;
        proteins_100g?: number;
        fat_100g?: number;
        energy_kcal_100g?: number;
    };
    serving_size?: string;
}

const BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';

export const barcodeService = {
    async getProduct(barcode: string): Promise<ProductData | null> {
        try {
            console.log(`[BarcodeService] Fetching data for: ${barcode}`);
            const response = await fetch(`${BASE_URL}/${barcode}.json`);

            if (!response.ok) {
                console.warn(`[BarcodeService] API Error: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data.status === 1 && data.product) {
                const p = data.product;
                return {
                    barcode: barcode,
                    name: p.product_name || p.product_name_en || 'Unknown Product',
                    brand: p.brands || 'Unknown Brand',
                    image: p.image_url || p.image_front_url,
                    ingredients: p.ingredients_text || p.ingredients_text_en,
                    nutriments: p.nutriments,
                    serving_size: p.serving_size,
                };
            } else {
                console.log('[BarcodeService] Product not found');
                return null;
            }
        } catch (error) {
            console.error('[BarcodeService] Network error:', error);
            return null;
        }
    }
};
