# Universal Consistency for Food Metrics

**Objective:** specific food + specific quantity MUST yield a consistent GL range across all users and sessions.
*Example:* 750ml of Red Wine must always result in a GL between 40-60, regardless of the user, lighting condition, or slight variations in wording.

## 1. The "Golden Record" Approach (Canonical Database)
Instead of relying on Gemini to *guess* nutritional values every time, we treat Gemini primarily as a **Classifier** and **Quantifier**, while outsourcing the **Valuation** to a deterministic database.

### Workflow:
1.  **Identify**: Gemini analyzes the image/text to identify the food (e.g., "Red Wine").
2.  **Quantify**: Gemini estimates the portion size (e.g., "750ml").
3.  **Lookup**: The system queries a "Golden Master Database" for the base metrics of "Red Wine" (e.g., "Red Wine" = 3.8g Carbs / 100ml, GL Factor = Low).
4.  **Calculate**: The final GL is calculated deterministically:
    $$ \text{GL} = \frac{\text{Base Carbs per unit} \times \text{Quantity} \times \text{GI}}{100} $$
5.  **Output**: The app displays this calculated value, overriding any hallucinated numbers from the LLM.

## 2. RAG (Retrieval-Augmented Generation) with Bounds
If strict database lookup isn't possible for all foods (due to variety), we use RAG to constrain the LLM.

### Workflow:
1.  **Retrieve Context**: When "Wine" is detected, fetch the "Standard Range" for typical wines from the database.
    *   *Context*: "Standard Red Wine is 3-5g carbs per 100ml. GI is ~35."
2.  **Prompt Constraints**: Inject this context into the Gemini System Prompt.
    *   *Prompt*: "You identified Wine. Based on standard data, a 750ml bottle MUST have a GL between 40-60. If your calculation is outside this range, Self-Correct before outputting."
3.  **Validation**: A post-processing layer checks the output. If the result is distinct from the expected range (e.g., GL 6 for 750ml wine), the system flags it or clamps it to the nearest valid bound.

## 3. Implementation Steps

### Phase 1: Database Expansion
- Expand `gi_gl_master.csv` to include `metric_per_100g` for carbs, calories, etc.
- Create a map of "Canonical Names" to these base values.

### Phase 2: Classification Pipeline
- Update `GeminiService` to return a `foodId` map instead of just raw strings.
- Implementation:
  ```typescript
  // Pseudo-code
  const identification = await gemini.identify(image); // "Red Wine", "750ml"
  const goldenRecord = database.find(identification.name);
  if (goldenRecord) {
      const calculatedGL = calculateGL(goldenRecord, identification.quantity);
      return { ...identification, gl: calculatedGL }; // Deterministic override
  } else {
      return gemini.estimate(image); // Fallback to AI estimation
  }
  ```

### Phase 3: Collaborative Calibration (Crowdsourcing consistency)
- If multiple users scan "Maggi" and correct the portion/GL, aggregate this data.
- Once a confidence threshold is reached, promote this to a temporary "Golden Record" so future scans of "Maggi" align with this consensus.

## 4. Why this solves the issue
- **Variability**: Eliminated because the base math ($Unit \times Quantity$) is constant.
- **Hallucinations**: Prevented because the LLM is demoted from "Nutritionist" to "Identifier".
- **Trust**: Users see consistent data that matches medical standards.
