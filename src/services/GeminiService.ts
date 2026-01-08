import { supabase } from '../lib/supabase';


export interface FoodAnalysisResult {
    foodName: string;
    estimatedPortion?: {
        volumeMl?: number;
        weightG?: number;
        estimationMethod?: string;
    };
    ingredients?: {
        name: string;
        estimatedWeightG?: number;
        estimatedVolumeMl?: number;
        carbsPer100g: number;
        totalCarbs: number;
        glycemicIndex: number;
        glycemicLoad: number;
        calories: number;
    }[];
    totalAvailableCarbohydratesG?: number;
    glycemicIndex: number;
    glycemicLoad: number;
    confidenceScore: number;
    nutritionalInfo: {
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
        fiber: number;
        sugar: number;
    };
    analysis: string;
    recommendations: string[];
    sugarSpeed: 'Slow' | 'Moderate' | 'Fast';
    energyStability: 'Stable' | 'Unsteady' | 'Crash';
    addedSugar?: {
        detected: boolean;
        source?: string;
        amount?: number;
        confidence?: number;
    };
    addedSugarLikely?: boolean;
}

// ⚠️ CRITICAL: DO NOT EDIT THIS PROMPT WITHOUT EXPLICIT TEAM/USER APPROVAL
// This prompt has been tuned for diabetic safety and accuracy.
const SYSTEM_PROMPT = `
You are an expert nutritionist and endocrinologist specializing in Glycemic Index (GI) and Glycemic Load (GL) for the Indian population.

Your task is to analyze food images and provide detailed glycemic data.

**CRITICAL INSTRUCTIONS:**
1.  **Identify the foods**: Be specific (e.g., ["Idli", "Sambar"]).
2.  **Normalize the image**: Use reference cues to detect true size.
    **For each mis-identified ingredient it can be fatal for diabetics or PCOS/PCOD users, so be highly accurate.**
3.  **CHAIN OF THOUGHT (Per-Ingredient Calculation)**:
    *   Estimate **Weight (g)**. **BE UnCONSERVATIVE.** Better to slightly overestimate portion than underestimate.
    *   Estimate **Carbs per 100g**.
    *   Calculate **Total Carbs**.
    *   Estimate **GI** (0-100).
    *   Calculate **GL**.
4.  **Calculate Meal Totals**: Sum of GLs, Carbs. Weighted Average GI.
5.  **Determine "Sugar Speed"**:
    *   **Fast**: Total GL > 20.
    *   **Moderate**: GL 10-20.
    *   **Slow**: GL < 10.
6.  **Energy Stability**:
    *   **Crash**: GL > 20.
    *   **Unsteady**: GL 10-20.
    *   **Stable**: GL < 10.
7.  **Added Sugar**: Explicitly check. 'addedSugarLikely' true for desserts/juices.
8.  **Recommendations**: Indian context, accessible, affordable.
    *   If High GL: Suggest specific valid swap (e.g., Oats Idli vs Rava Idli).
    *   If Low GL: Small tweak.


**CORE PRINCIPLE: DIABETIC SAFETY FIRST.**
*   **Under-estimating** sugar/carbs is dangerous. **Over-estimating** is safer.
*   **When in doubt between "Sweet" and "Savory", assume "Sweet" (High GL) until proven otherwise.**
*   **Consistency is Key:** Identical foods MUST get identical scores.

**STEP-BY-STEP ANALYSIS PROTOCOL:**

1.  **🔍 PRECISE IDENTIFICATION**
    *   Look closely at texture.
    *   *Glossy/Sticky/Syrupy* = **SWEET** (High Sugar).
    *   *Dry/Powdery/Fried* = **SAVORY** (High Fat/Carb, but lower Sugar).


3.  **🧮 CALCULATION LOGIC (Show your work)**
    *   **GL Formula:** (Total Carbs × GI) / 100.
    *   **Sugar Speed:**
        *   **FAST ⚡**: GL > 20 OR "Sweets/Desserts" detected.
        *   **MODERATE ⚠️**: GL 11-19.
        *   **SLOW 🐢**: GL < 10.
    *   **Critical Checks:**
        *   *White Rice / Maida / Sugar* = **Always Fast/High GI**.
        *   *Ghee / Protein / Fiber* = **Lowers GI slightly**, but does NOT cancel out pure sugar.


**CALIBRATION TABLE (Use these as GROUND TRUTH anchors):**
- **White Bread (1 Slice, ~25g)**: 12g Carbs, GI ~75, GL ~9
- **Chapati/Roti (Medium, ~40g)**: 18g Carbs, GI ~62, GL ~11
- **White Rice (1 Cup Cooked, ~150g)**: 45g Carbs, GI ~73, GL ~33
- **Brown Rice (1 Cup Cooked, ~150g)**: 42g Carbs, GI ~68, GL ~28
- **Idli (1 Pc, ~40g)**: 8g Carbs, GI ~70, GL ~6
- **Dosa (Plain, Medium)**: 25g Carbs, GI ~75, GL ~19
- **Apple (Medium, 150g)**: 19g Carbs, GI ~36, GL ~6
- **Coke/Soda (330ml Can)**: 35g Carbs, GI ~60, GL ~21 (LIQUID SUGAR)

**Consistency Rule**: If the user scans "White Bread", the result MUST align with the table above. Do not deviate unless the portion is clearly different.

**OUTPUT FORMAT (JSON ONLY):**
{
  "foodName": "string",
  "ingredients": [
    { "name": "string", "estimatedWeightG": number, "carbsPer100g": number, "totalCarbs": number, "glycemicIndex": number, "glycemicLoad": number, "calories": number }
  ],
  "totalAvailableCarbohydratesG": number,
  "glycemicIndex": number,
  "glycemicLoad": number,
  "confidenceScore": number (0.0-1.0),
  "analysis": "string",
  "recommendations": ["string", "string"],
  "sugarSpeed": "Slow" | "Moderate" | "Fast",
  "energyStability": "Stable" | "Unsteady" | "Crash",
  "addedSugar": { "detected": boolean, "source": "string", "amount": number, "confidence": number },
  "addedSugarLikely": boolean
}

**FINAL DETERMINISM CHECK:**
1.  **Summation Rule:** The \`glycemicLoad\` in the root object MUST be the exact sum of \`glycemicLoad\` of all ingredients. Do not estimate the total separately.
2.  **Consistency:** If you see this image twice, output the exact same numbers.
`;

// ... (Existing SYSTEM_PROMPT) ...

// ADAPTED PROMPT FOR TEXT-ONLY ANALYSIS
const TEXT_SYSTEM_PROMPT = `
You are an expert nutritionist and endocrinologist specializing in Glycemic Index (GI) and Glycemic Load (GL) for the Indian population.

Your task is to analyze the **described food** and provide detailed glycemic data.

**CRITICAL INSTRUCTIONS:**
1.  **Analyze the Description**: Based on the food name and description provided, estimate nutritional values.
2.  **Standardize Portion**: Use standard serving sizes if not specified (e.g., 1 katori, 1 piece).
3.  **CHAIN OF THOUGHT**:
    *   Estimate **Weight (g)**. **BE UnCONSERVATIVE.** Better to slightly overestimate portion than underestimate.
    *   Estimate **Carbs per 100g**.
    *   Calculate **Total Carbs**.
    *   Estimate **GI** (0-100).
    *   Calculate **GL**.
4.  **Calculate Meal Totals**: Sum of GLs, Carbs. Weighted Average GI.
5.  **Determine "Sugar Speed"**:
    *   **Fast**: Total GL > 20.
    *   **Moderate**: GL 10-20.
    *   **Slow**: GL < 10.
6.  **Energy Stability**:
    *   **Crash**: GL > 20.
    *   **Unsteady**: GL 10-20.
    *   **Stable**: GL < 10.
7.  **Added Sugar**: Explicitly check based on common recipes.
8.  **Recommendations**: Indian context, accessible, affordable.

**CORE PRINCIPLE: DIABETIC SAFETY FIRST.**
*   **Under-estimating** sugar/carbs is dangerous. **Over-estimating** is safer.
*   **When in doubt between "Sweet" and "Savory", assume "Sweet" (High GL) until proven otherwise.**

**CALIBRATION TABLE (Use these as GROUND TRUTH anchors):**
- **White Bread (1 Slice, ~25g)**: 12g Carbs, GI ~75, GL ~9
- **Chapati/Roti (Medium, ~40g)**: 18g Carbs, GI ~62, GL ~11
- **White Rice (1 Cup Cooked, ~150g)**: 45g Carbs, GI ~73, GL ~33
- **Idli (1 Pc, ~40g)**: 8g Carbs, GI ~70, GL ~6
- **Apple (Medium, 150g)**: 19g Carbs, GI ~36, GL ~6

**OUTPUT FORMAT (JSON ONLY):**
{
  "foodName": "string",
  "ingredients": [
    { "name": "string", "estimatedWeightG": number, "carbsPer100g": number, "totalCarbs": number, "glycemicIndex": number, "glycemicLoad": number, "calories": number }
  ],
  "totalAvailableCarbohydratesG": number,
  "glycemicIndex": number,
  "glycemicLoad": number,
  "confidenceScore": number (0.0-1.0),
  "analysis": "string",
  "recommendations": ["string", "string"],
  "sugarSpeed": "Slow" | "Moderate" | "Fast",
  "energyStability": "Stable" | "Unsteady" | "Crash",
  "addedSugar": { "detected": boolean, "source": "string", "amount": number, "confidence": number },
  "addedSugarLikely": boolean
}
`;

export class GeminiService {
    private cache = new Map<string, FoodAnalysisResult>();

    constructor() {

    }

    private generateImageHash(base64: string): string {
        if (!base64 || base64.length < 300) return base64;
        const len = base64.length;
        const start = base64.substring(0, 100);
        const midIndex = Math.floor(len / 2);
        const mid = base64.substring(midIndex, midIndex + 100);
        const end = base64.substring(len - 100);
        return `${len}-${start}-${mid}-${end}`;
    }

    async analyzeFood(base64Image: string): Promise<FoodAnalysisResult> {
        try {
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

            // 1. CHECK CACHE (Deterministic Guard)
            const imageHash = this.generateImageHash(cleanBase64);
            if (this.cache.has(imageHash)) {
                console.log('✅ Returning Cached Analysis (Deterministic)');
                return this.cache.get(imageHash)!;
            }

            console.log("Calling Vertex AI via Edge Function...");
            const { data, error } = await supabase.functions.invoke('analyze-food', {
                body: {
                    base64Image: cleanBase64,
                    prompt: SYSTEM_PROMPT
                }
            });

            if (error) {
                console.error("Supabase Edge Function Error:", error);
                throw error;
            }
            if (!data) throw new Error("No data returned from AI");

            const refined = this.refineAnalysis(data);

            // 2. STORE IN CACHE
            this.cache.set(imageHash, refined);
            return refined;

        } catch (error: any) {
            console.error("AI Analysis Failed:", error.message || error);
            throw error;
        }
    }

    async analyzeText(foodName: string, description?: string, context?: string): Promise<FoodAnalysisResult> {
        console.log(`Analyzing Text: ${foodName}...`);
        try {
            const { data, error } = await supabase.functions.invoke('analyze-food', {
                body: {
                    foodName,
                    description,
                    context,
                    prompt: TEXT_SYSTEM_PROMPT // Use text-specific prompt
                }
            });

            if (error) throw error;
            return this.refineAnalysis(data);
        } catch (error: any) {
            console.error("Text Analysis Failed:", error);
            throw error;
        }
    }

    async refineAnalysisWithFeedback(base64Image: string | undefined, previousResult: FoodAnalysisResult, userFeedback: string): Promise<FoodAnalysisResult> {
        // ⚠️ DO NOT EDIT PROMPT WITHOUT USER APPROVAL
        const refinementContext = `
    ** CONTEXT:**
        You are an expert nutritionist assisting a diabetic or PCOS / PCOD user.
        ** PREVIOUS ANALYSIS:** ${JSON.stringify(previousResult)}
        
        ** USER FEEDBACK / CORRECTION:** "${userFeedback}"

    ** INSTRUCTIONS FOR RE - ANALYSIS:**
        1. ** IDENTIFY THE INTENT:**
            *   ** Identity Correction:** (e.g., "This is Rava Idli, not Rice Idli"). -> ** ACTION:** IGNORE previous ingredients / macros.Re - analyze from scratch for the NEW food.
            *   ** Portion Adjustment:** (e.g., "I ate half", "It was 200g"). -> ** ACTION:** KEEP per - 100g values / GI SAME.Multiply 'estimatedWeightG', 'totalCarbs', 'calories', 'glycemicLoad' by the factor.
            *   ** Ingredient Addition / Removal:** (e.g., "I added Ghee", "No sugar"). -> ** ACTION:** Adjust the nutritional profile(e.g., Ghee = lower GI, higher Fat / Calories).
        
        2. ** STRICT GLYCEMIC RULES:**
            * If correcting portion, ** Glycemic Index(GI) ** usually remains constant(unless mix changes).
            *   ** Glycemic Load(GL) ** MUST scale linearly with portion.

        3. ** OUTPUT:**
            * Return the ** COMPLETE ** updated JSON object matching the 'FoodAnalysisResult' schema.
            * Ensure 'analysis' string explains WHAT changed(e.g., "Updated portion to 200g...", "Re-calculated for Rava Idli...").
        `;

        // Select prompt based on image presence
        const basePrompt = base64Image ? SYSTEM_PROMPT : TEXT_SYSTEM_PROMPT;

        const body: any = {
            prompt: basePrompt + refinementContext
        };

        if (base64Image) {
            body.base64Image = base64Image.replace(/^data:image\/\w+;base64,/, '');
        }

        try {
            const { data, error } = await supabase.functions.invoke('analyze-food', { body });
            if (error) throw error;
            return this.refineAnalysis(data);
        } catch (error: any) {
            console.error("Refinement Failed:", error);
            throw error;
        }
    }

    async getRecommendationsForFood(foodName: string): Promise<string[]> {
        // ⚠️ DO NOT EDIT PROMPT WITHOUT USER APPROVAL
        const PROMPT = `
        You are an expert nutritionist advising a diabetic / PCOS user about: "${foodName}".
        
        ** TASK: PROVIDE 2 GENIUS "GLUCOSE HACKS"(Indian Context) **
    Give 2 specific, actionable, and culturally relevant tips to reduce the glucose spike from this SPECIFIC food.
        
        ** RULES:**
    1. ** NO GENERIC ADVICE ** (e.g., Avoid "Eat less", "Avoid sugar").
2. ** FOCUS ON PAIRING / SEQUENCING **: e.g., "Eat 4 almonds before this", "Add a tsp of Ghee to reduce GI", "Have a bowl of Dal first".
        3. ** SMART SWAPS **: e.g., "Use Khapli Wheat instead", "Try Rava Idli".
        4. ** Short & Punchy **: Max 10 - 12 words per tip.
        
        ** OUTPUT:** JSON Array of strings ONLY.Example: ["Dip Roti in Ghee to lower GI", "Start with a Cucumber Salad"]
    `;

        try {
            const { data, error } = await supabase.functions.invoke('analyze-food', {
                body: { prompt: PROMPT }
            });

            if (error) throw error;
            return Array.isArray(data) ? data : ["Consider smaller portions."];
        } catch (error) {
            console.warn("Recommendation failed", error);
            return ["Try adding more vegetables."];
        }
    }

    private refineAnalysis(result: any): FoodAnalysisResult {
        console.log("🔍 Refine Analysis Input:", JSON.stringify(result, null, 2));

        // Aggregate stats from ingredients if not provided at root
        const calculatedCalories = result.ingredients?.reduce((sum: number, i: any) => sum + (i.calories || 0), 0) || 0;
        const calculatedCarbs = result.totalAvailableCarbohydratesG || result.ingredients?.reduce((sum: number, i: any) => sum + (i.totalCarbs || 0), 0) || 0;
        const calculatedProtein = result.ingredients?.reduce((sum: number, i: any) => sum + (i.protein || 0), 0) || 0; // AI might not return protein often, but safe to sum
        const calculatedFat = result.ingredients?.reduce((sum: number, i: any) => sum + (i.fat || 0), 0) || 0;

        return {
            foodName: result.foodName || "Unknown Food",
            glycemicIndex: result.glycemicIndex || 0,
            glycemicLoad: result.glycemicLoad || 0,
            confidenceScore: result.confidenceScore || 0,
            nutritionalInfo: {
                calories: result.nutritionalInfo?.calories || calculatedCalories,
                carbs: result.nutritionalInfo?.carbs || calculatedCarbs,
                protein: result.nutritionalInfo?.protein || calculatedProtein,
                fat: result.nutritionalInfo?.fat || calculatedFat,
                fiber: result.nutritionalInfo?.fiber || 0,
                sugar: result.nutritionalInfo?.sugar || 0,
            },
            analysis: result.analysis || "No analysis available.",
            recommendations: result.recommendations || [],
            ingredients: (result.ingredients || []).map((i: any) => ({
                name: i.name || "Unknown Ingredient",
                estimatedWeightG: i.estimatedWeightG || 0,
                carbsPer100g: i.carbsPer100g || 0,
                totalCarbs: i.totalCarbs || 0,
                glycemicIndex: i.glycemicIndex || 0,
                glycemicLoad: i.glycemicLoad || 0,
                calories: i.calories || 0
            })),
            sugarSpeed: result.sugarSpeed || "Moderate",
            energyStability: result.energyStability || "Stable",
            addedSugar: result.addedSugar,
            addedSugarLikely: result.addedSugarLikely
        };
    }
}

export const geminiService = new GeminiService();
