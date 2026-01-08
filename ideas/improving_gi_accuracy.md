# Improving Gemini's GI Prediction Accuracy

**Problem:** Gemini's GI/GL predictions are variable because it currently estimates the *final* composite numbers directly (or roughly), without explicitly outputting the per-ingredient math. This allows "hallucinations" to go unchecked.

**Goal:** Force the model to "show its work" and align with ground-truth data.

## Strategy 1: Chain-of-Thought (CoT) Schema
Update the JSON output schema to require granular, per-ingredient metrics. This forces the model to decompose the meal before aggregating.

**Current Output:**
```json
"ingredients": [{"name": "Rice", "weight": 150}],
"totalGL": 45 // Model "guesses" this based on training data intuition
```

**Proposed Output:**
```json
"ingredients": [
  {
    "name": "White Rice",
    "weight": 150,
    "carbsPer100g": 28,
    "totalCarbs": 42,
    "gi": 72,
    "gl": 30.24
  },
  {
    "name": "Dal Fry",
    "weight": 200,
    "carbsPer100g": 12,
    "totalCarbs": 24,
    "gi": 45,
    "gl": 10.8
  }
],
"totalGL": 41.04 // Sum of above. Harder to hallucinate significantly.
```

## Strategy 2: Two-Pass Hybrid Architecture (The "Golden Record" Impl)
Use Gemini for **Identification** and **Quantification**, but use the Database for **Valuation**.

**Workflow:**
1.  **Pass 1 (Vision)**: Gemini analyzes image.
    *   Output: `[{"id": "rice_white_cooked", "quantity": "1.5 cups"}]`
    *   *Prompt Constraints*: "Identify ingredients and map them to standard generic IDs."
2.  **Pass 2 (Logic)**: App takes this list.
    *   Look up `rice_white_cooked` in `gi_gl_master.csv`.
    *   Get Ground Truth: GI = 72, Carbs = 28g/100g.
    *   Calculate GL deterministically via code.
3.  **Fallback**: If ID not found in DB, ask Gemini to estimate using Strategy 1.

## Strategy 3: Context Injection (Cheat Sheet)
If Strategy 2 is too complex to implement immediately, we can inject a "Mini-DB" into the System Prompt.

**Prompt Injection:**
"Here are the standard GI values for common Indian foods. USE THESE if detected:"
- Roti: GI 62, Carbs 45g/100g
- White Rice: GI 72, Carbs 28g/100g
- Idli: GI 70, Carbs 25g/pc
...

## Recommendation
Start with **Strategy 1 (CoT Schema)** immediately as it requires no architecture changes, just prompt tuning. It yields the highest ROI for effort.
Then, move to **Strategy 2** for the "Universal Consistency" goal.
