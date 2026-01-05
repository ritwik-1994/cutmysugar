import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/secrets';

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
        availableCarbohydratesG: number;
        giMedian: number;
        giRange: [number, number];
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
    energyStability: 'Steady' | 'Okay' | 'Likely Crash';
    addedSugar?: {
        detected: boolean;
        source?: string;
        amount?: number;
        confidence?: number;
    };
    addedSugarLikely?: boolean;
}

const SYSTEM_PROMPT = `
You are an expert nutritionist and endocrinologist specializing in Glycemic Index (GI) and Glycemic Load (GL) for the Indian population.

Your task is to analyze food images and provide detailed glycemic data.

**CRITICAL INSTRUCTIONS:**
1.  **Identify the food**: Be specific (e.g., "Idli with Sambar", "Paneer Butter Masala", "Brown Rice").
2.  **Estimate GI & GL**:
    *   **Glycemic Index (GI)**: 0-100 scale.
    *   **Glycemic Load (GL)**: (GI * Carbs) / 100.
    *   **GL Ranges**:
        *   Low: 0-10
        *   Medium: 11-19
        *   High: 20+
3.  **Analyze Nutritional Content**: Estimate Calories, Carbs, Protein, Fat, Fiber, Sugar.
4.  **Determine "Sugar Speed" (Spike Risk)**:
    *   **Slow**: Complex carbs, high fiber/protein/fat (e.g., Dal, Salad).
    *   **Moderate**: Balanced meals (e.g., Roti with Sabzi).
    *   **Fast**: Simple sugars, refined carbs (e.g., Sweets, White Rice, Juice).
5.  **Determine "Energy Stability"**:
    *   **Steady**: Sustained energy (Low GL).
    *   **Okay**: Moderate fluctuations (Medium GL).
    *   **Likely Crash**: High spike followed by a drop (High GL).
6.  **Detect Added Sugar**:
    *   Explicitly check for added sugars (cane sugar, jaggery, honey, syrups).
    *   If detected, set 'addedSugar.detected' to true and estimate amount.
    *   **Determine 'addedSugarLikely'**: Set to true if the food is commonly prepared with added sugar (e.g., Coffee, Tea, Desserts, Juices, Breakfast Cereals). Set to false for savory dishes (e.g., Dal, Roti, Salad).
7.  **Provide Recommendations**:
    *   **Context**: Focus on the **Indian context**. Suggestions must be **accessible** (common ingredients) and **affordable**.
    *   **If High GL (>20)**: Suggest a specific **alternative meal** or **smart swap**.
        *   *Example*: "Try Oats Idli instead of Rava Idli" or "Swap White Rice for Brown Rice or Quinoa".
    *   **If Moderate/Low GL**: Suggest a small tweak to improve it further.
        *   *Example*: "Add a side of cucumber salad" or "Walk for 10 mins after eating".
    *   **Format**: Return 1-2 short, actionable strings.

**OUTPUT FORMAT (JSON ONLY):**
{
  "foodName": "string",
  "ingredients": [
    {
      "name": "string",
      "estimatedWeightG": number,
      "calories": number
    }
  ],
  "glycemicIndex": number,
  "glycemicLoad": number,
  "confidenceScore": number (0.0-1.0),
  "nutritionalInfo": {
    "calories": number,
    "carbs": number,
    "protein": number,
    "fat": number,
    "fiber": number,
    "sugar": number
  },
  "analysis": "string (brief summary)",
  "recommendations": ["string", "string"],
  "sugarSpeed": "Slow" | "Moderate" | "Fast",
  "energyStability": "Steady" | "Okay" | "Likely Crash",
  "addedSugar": {
    "detected": boolean,
    "source": "string (optional)",
    "amount": number (optional),
    "confidence": number (optional)
  },
  "addedSugarLikely": boolean
}
`;

export class GeminiService {
    private model: any;
    private backupModel: any;

    constructor() {
        if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            this.backupModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        }
    }

    async analyzeFood(base64Image: string): Promise<FoodAnalysisResult> {
        if (!this.model) {
            console.log('Using Mock Backend Response (No API Key provided)');
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        foodName: "Sample Meal (Mock)",
                        glycemicIndex: 55,
                        glycemicLoad: 15,
                        confidenceScore: 0.9,
                        nutritionalInfo: {
                            calories: 350,
                            carbs: 45,
                            protein: 12,
                            fat: 10,
                            fiber: 5,
                            sugar: 4
                        },
                        analysis: "This is a balanced meal with a moderate glycemic impact.",
                        recommendations: [
                            "Consider adding more leafy greens.",
                            "A 10-minute walk after this meal would be beneficial."
                        ],
                        sugarSpeed: "Moderate",
                        energyStability: "Steady",
                        addedSugar: { detected: false }
                    });
                }, 1500);
            });
        }

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                // Create a timeout promise (increased to 60s for safety)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 60000)
                );

                const modelToUse = attempts === 0 ? this.model : this.backupModel;
                console.log(`Attempt ${attempts + 1}: Using model ${attempts === 0 ? 'Primary' : 'Backup (Lite)'}`);

                const result: any = await Promise.race([
                    modelToUse.generateContent([
                        SYSTEM_PROMPT,
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image.replace(/^data:image\/\w+;base64,/, '')
                            }
                        }
                    ]),
                    timeoutPromise
                ]);
                const response = await result.response;
                const text = response.text();
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return this.refineAnalysis(JSON.parse(cleanedText));
            } catch (error: any) {
                console.error(`Gemini Analysis Attempt ${attempts + 1} (${attempts === 0 ? 'Primary' : 'Backup'}) Failed:`, error.message || error);
                attempts++;
                if (attempts >= maxAttempts) throw error;

                // Exponential Backoff: Wait longer between retries (e.g., 2s, 4s) to let rate limits reset
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("Analysis failed after retries");
    }

    async refineAnalysisWithFeedback(base64Image: string | undefined, previousResult: FoodAnalysisResult, userFeedback: string): Promise<FoodAnalysisResult> {
        if (!this.model) {
            // Mock refinement
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        ...previousResult,
                        foodName: userFeedback.includes("not") ? userFeedback.split("not")[1].trim() : previousResult.foodName,
                        analysis: `Refined analysis based on feedback: "${userFeedback}".`,
                        confidenceScore: 0.95
                    });
                }, 1000);
            });
        }

        let prompt = "";
        let inlineData = undefined;

        if (base64Image) {
            // Image-based refinement
            prompt = `
            ${SYSTEM_PROMPT}

            **CONTEXT:**
            You previously analyzed this image and provided the following result:
            ${JSON.stringify(previousResult)}

            **USER FEEDBACK:**
            The user has provided the following correction/feedback:
            "${userFeedback}"

            **TASK:**
            Re-analyze the image and the previous result in light of the user's feedback.
            - If the user corrected the food name, update the nutritional values and GL accordingly.
            - If the user pointed out specific ingredients, adjust the analysis.
            - Maintain the same JSON output format.
            -Ensure the new GL/GI values makes sense in light of the new feedback, previous GI/GL values using core GL calculation principles. 
            -Example: Adding Paneer to Flatbread should usually LOWER or keep GL similar, if portion size of carbs stays constant.
            Gemini must NOT:
                Increase GL without carb increase
            `;

            inlineData = {
                mimeType: "image/jpeg",
                data: base64Image.replace(/^data:image\/\w+;base64,/, '')
            };
        } else {
            // Text-only refinement (for Manual/DB entries)
            prompt = `
            ${SYSTEM_PROMPT}

            **CONTEXT:**
            You previously provided this analysis for a food item (no image available):
            ${JSON.stringify(previousResult)}

            **USER FEEDBACK:**
            The user has provided the following correction/feedback:
            "${userFeedback}"

            **TASK:**
            Update the analysis based on the user's feedback.
            - Trust the user's correction (e.g., if they say "It's Brown Rice", treat it as Brown Rice).
            - Recalculate GL, Sugar Speed, and Stability based on the new information.
            - Maintain the same JSON output format.
            `;
        }

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                const content: any[] = [prompt];
                if (inlineData) {
                    content.push({ inlineData });
                }

                // Create a timeout promise (increased to 60s)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 60000)
                );

                const modelToUse = attempts === 0 ? this.model : this.backupModel;
                console.log(`Refinement Attempt ${attempts + 1}: Using model ${attempts === 0 ? 'Primary' : 'Backup (Lite)'}`);

                const result: any = await Promise.race([
                    modelToUse.generateContent(content),
                    timeoutPromise
                ]);
                const response = await result.response;
                const text = response.text();
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return this.refineAnalysis(JSON.parse(cleanedText));
            } catch (error: any) {
                console.error(`Gemini Refinement Attempt ${attempts + 1} (${attempts === 0 ? 'Primary' : 'Backup'}) Failed:`, error.message || error);
                attempts++;
                if (attempts >= maxAttempts) throw error;

                // Exponential Backoff
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("Refinement failed after retries");
    }

    async analyzeText(foodName: string, description?: string, context?: string): Promise<FoodAnalysisResult> {
        if (!this.model) {
            // Mock response
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        foodName: foodName,
                        glycemicIndex: 60,
                        glycemicLoad: 18,
                        confidenceScore: 0.85,
                        nutritionalInfo: {
                            calories: 250,
                            carbs: 30,
                            protein: 5,
                            fat: 8,
                            fiber: 3,
                            sugar: 2
                        },
                        analysis: `AI Analysis for ${foodName}.`,
                        recommendations: ["Consider a smaller portion."],
                        sugarSpeed: "Moderate",
                        energyStability: "Okay",
                        addedSugar: { detected: false },
                        addedSugarLikely: false
                    });
                }, 1000);
            });
        }

        const prompt = `
        ${SYSTEM_PROMPT}

        **INPUT:**
        Food Name: "${foodName}"
        Description: "${description || ''}"
        Context: "${context || ''}"

        **TASK:**
        Analyze the food based on the name, description, and context provided.
        - If context specifies a portion size or weight, adjust nutritional values (Carbs, GL, Calories) accordingly.
        - Estimate nutritional values, GI, and GL.
        - Provide recommendations.
        - Return the standard JSON format.
        `;

        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
            try {
                // Create a timeout promise (increased to 60s)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 60000)
                );

                const modelToUse = attempts === 0 ? this.model : this.backupModel;
                console.log(`Text Analysis Attempt ${attempts + 1}: Using model ${attempts === 0 ? 'Primary' : 'Backup (Lite)'}`);

                const result: any = await Promise.race([
                    modelToUse.generateContent(prompt),
                    timeoutPromise
                ]);
                const response = await result.response;
                const text = response.text();
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return this.refineAnalysis(JSON.parse(cleanedText));
            } catch (error: any) {
                console.error(`Gemini Text Analysis Attempt ${attempts + 1} (${attempts === 0 ? 'Primary' : 'Backup'}) Failed:`, error.message || error);
                attempts++;
                if (attempts >= maxAttempts) throw error;

                // Exponential Backoff
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("Text analysis failed after retries");
    }

    async getRecommendationsForFood(foodName: string): Promise<string[]> {
        if (!this.model) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        "Try Brown Rice or Quinoa instead for more fiber.",
                        "Add a side of Cucumber Raita to lower the glycemic impact."
                    ]);
                }, 1000);
            });
        }

        const PROMPT = `
        You are an expert nutritionist specializing in Indian diets.
        The user is eating: "${foodName}".
        This food likely has a High Glycemic Load.

        **TASK:**
        Suggest 1-2 specific, **Indian-context**, **accessible**, and **affordable** alternatives or modifications to lower the Glycemic Load.
        
        **EXAMPLES:**
        - "Try Oats Idli instead of Rava Idli."
        - "Add a bowl of Sprouts Salad to balance the meal."
        - "Swap White Rice for Foxtail Millet."

        **OUTPUT FORMAT:**
        Return ONLY a JSON array of strings. Example: ["Suggestion 1", "Suggestion 2"]
        `;

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 10000)
            );

            const result: any = await Promise.race([
                this.model.generateContent(PROMPT),
                timeoutPromise
            ]);
            const response = await result.response;
            const text = response.text();
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("Gemini Recommendation Error:", error);
            return ["Could not fetch recommendations. Try adding fiber or protein!"];
        }
    }

    private refineAnalysis(result: any): FoodAnalysisResult {
        return {
            foodName: result.foodName || "Unknown Food",
            glycemicIndex: result.glycemicIndex || 0,
            glycemicLoad: result.glycemicLoad || 0,
            confidenceScore: result.confidenceScore || 0,
            nutritionalInfo: {
                calories: result.nutritionalInfo?.calories || 0,
                carbs: result.nutritionalInfo?.carbs || 0,
                protein: result.nutritionalInfo?.protein || 0,
                fat: result.nutritionalInfo?.fat || 0,
                fiber: result.nutritionalInfo?.fiber || 0,
                sugar: result.nutritionalInfo?.sugar || 0,
            },
            analysis: result.analysis || "No analysis available.",
            recommendations: result.recommendations || [],
            ingredients: result.ingredients || [],
            sugarSpeed: result.sugarSpeed || "Moderate",
            energyStability: result.energyStability || "Okay",
            addedSugar: result.addedSugar,
            addedSugarLikely: result.addedSugarLikely
        };
    }
}

export const geminiService = new GeminiService();
