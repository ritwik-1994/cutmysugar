# Technical State: GlucoWiseAI

## 1. The Gist
GlucoWiseAI is a React Native (Expo) app that helps users track the Glycemic Load (GL) of their meals. It's not just a calorie counter; it uses AI to analyze food photos and give insights like "Sugar Speed" and "Energy Stability".

The codebase is pretty fresh. It's a prototype focused on the "Happy Path" — scanning food, getting results, and seeing the dashboard update.

## 2. Getting Started

### Quick Start
You should be up and running in about 15 minutes.
1.  **Node & Repo**: Make sure you have Node 18+. Clone the repo and `npm install`.
2.  **Secrets**: Check `src/config/secrets.ts`. Right now, there's a placeholder API key. You'll need a valid Google Gemini API key to get the AI features working.
3.  **Run it**:
    *   **iOS**: `npm run ios` (Needs Xcode)
    *   **Android**: `npm run android` (Needs Android Studio)
    *   **Web**: `npm run web` (Good for quick layout tweaks, but the Camera won't work the same way).

### Common Gotchas
*   **"Camera not authorized"**: If the permission dialog doesn't pop up on the Simulator, try a real device or check the Expo Go permissions settings.
*   **Blank Screen**: If the fonts fail to load, the app returns `null`. Check the console for `Outfit` font loading errors.

## 3. The Stack
We're keeping it standard and modern:
*   **Core**: React Native 0.81.5 + Expo SDK 54.
*   **Language**: TypeScript everywhere.
*   **Nav**: React Navigation v7 (Native Stack).
*   **State**: Just React Context (`AuthContext`, `MealContext`). No Redux or Zustand yet.
*   **AI**: Google Gemini SDK (`@google/generative-ai`).
*   **Styling**: `StyleSheet` + `react-native-svg` for charts.

## 4. How It's Organized
Everything that matters is in `src/`.
```
src/
├── components/   # The building blocks (Buttons, Cards, Charts)
├── context/      # Global state (User, Meals)
├── navigation/   # Stack definitions
├── screens/      # The actual pages
├── services/     # API wrappers (Gemini, Barcode, DB)
└── styles/       # Design tokens (colors, fonts)
```

## 5. Key Flows

### Navigation
It's a single stack, but logically split:
1.  **Onboarding**: `Welcome` -> `TwoSignals` -> `Preferences` -> `Login`.
2.  **Main App**: `Home` is the hub. From there you can:
    *   Tap **(+)** to Scan Food (`ScanFood` -> `FoodAnalysis`).
    *   Tap **Barcode** to scan a product (`ScanBarcode`).
    *   Tap **Search** to look up food manually (`SearchFood`).

### Data Flow
*   **Auth**: Currently mocked. `AuthContext` just simulates a login delay.
*   **Meals**: Stored in `MealContext`.
    *   **Heads Up**: There is **NO persistence** right now. If you reload the app, your meal history is gone. This is a known gap.

## 6. External Services
*   **Google Gemini**: Used for analyzing food photos. Logic is in `GeminiService.ts`. It sends the image as base64 and gets back a JSON object with GL estimates.
*   **OpenFoodFacts**: Used for barcode lookup. Logic is in `BarcodeService.ts`.
*   **Local DB**: We have a CSV file (`gi_gl_master.csv`) for manual search. It's parsed client-side using `papaparse`.

## 7. Known Issues & TODOs
If you're looking for something to fix, here's where the bodies are buried:
1.  **Persistence**: As mentioned, data wipes on reload. We need `AsyncStorage` or a local DB ASAP.
2.  **Secrets**: The API key is hardcoded in `secrets.ts`. This needs to move to `.env`.
3.  **Auth**: It's fake. Needs a real Firebase or Supabase integration.
4.  **Testing**: There are zero tests. No unit tests, no E2E.

## 8. Where to Look First
*   **`App.tsx`**: See how the providers and navigation are wired up.
*   **`src/screens/HomeScreen.tsx`**: The main dashboard logic.
*   **`src/services/GeminiService.ts`**: The prompt engineering and AI interaction.
*   **`src/context/MealContext.tsx`**: Where the data lives.
