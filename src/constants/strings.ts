export const STRINGS = {
    APP_NAME: 'CutMySugar',
    TAGLINE: 'Master your metabolism without giving up the foods you love.',

    ONBOARDING: {
        WELCOME: {
            TITLE: 'CutMySugar',
            SUBTITLE: 'Eat what you love, just smarter. Master your metabolism in 30 seconds a day.',
            CTA: "Let's Start",
            TITLE_USER: "Almost there! 🎉",
            TITLE_GUEST: "Cutting sugar is easy with CutMySugar",
            SUBTITLE_USER: "Let's finish setting up your profile.",
            SUBTITLE_GUEST: "Let's get to know you. What should we call you?",
            PLACEHOLDER: "Enter your name",
            CTA_EXISTING: "I already have an account",
            ERRORS: {
                REQUIRED: "Please enter your name to continue.",
                ACCOUNT_NOT_FOUND: "Account Not Found. Please Sign Up.",
            },
        },
        PROBLEM: {
            TITLE: 'It’s Not About Calories',
            SUBTITLE: 'It’s about the Spike. Fast sugar spikes lead to energy crashes and fat storage.',
            CTA: 'How do I fix it?',
        },
        SOLUTION: {
            TITLE: 'Flatten the Curve',
            SUBTITLE: 'We analyze your food to help you keep your energy steady and your sugar low.',
            CTA: 'Sounds good',
        },
        DISCLAIMER: {
            TITLE: 'We Are Not a Doctor',
            SUBTITLE: 'CutMySugar provides insights for awareness only. Always follow your doctor\'s advice for medical decisions.',
            CHECKBOX: 'I understand this is not medical advice.',
            CTA: 'I Understand',
        },
        PERMISSIONS: {
            TITLE: 'We Need Your Eyes',
            SUBTITLE: 'Enable Camera to scan food. Images are analyzed by AI to find your Sugar Score.',
            NOTE: 'We process images to analyze food, then they are discarded. See Privacy Policy.',
            CTA: 'Enable Camera',
        },
        READY: {
            TITLE: 'All Set!',
            SUBTITLE: 'Your Daily Sugar Limit is set to 100. Let\'s see how your next meal scores.',
            CTA: 'Scan My First Meal',
        },
        LOGIN: {
            TITLE: "Almost there.",
            SUBTITLE: "Create an account to save your data.",
            CONTINUE_PHONE: "Continue with Phone",
            CONTINUE_GOOGLE: "Continue with Google",
            TERMS: "By continuing, you agree to our Terms & Privacy Policy.",
        },
    },

    HOME: {
        SUMMARY: {
            TITLE: "Today's Sugar Limit",
            SUBTEXT: 'of 100 limit',
            STATUS: {
                STEADY: 'Steady Zone 🌊',
                WARNING: 'Watch Out ⚠️',
                LIMIT: 'Limit Reached 🛑',
            },
        },
        EMPTY: {
            TEXT: 'Your plate is empty.',
            SUBTEXT: 'Log your first meal to start tracking spikes.',
            CTA: 'Scan Meal',
        },
        ACTIONS: {
            LOG_MEAL: 'Add Food',
            FIX_RESULT: 'Edit',
        },
    },

    METRICS: {
        SUGAR_SCORE: 'Sugar Score',
        SUGAR_LIMIT: 'Daily Sugar Limit',
        SUGAR_RUSH: {
            LABEL: 'Sugar Rush',
            FAST: 'Fast Rush ⚡',
            MODERATE: 'Moderate 🚶',
            SLOW: 'Slow Burn 🐢',
        },
        ENERGY_FLOW: {
            LABEL: 'Energy Flow',
            CRASH: 'Crash',
            UNSTABLE: 'Unsteady',
            STEADY: 'Stable',
        },
        SPIKE_ALERT: 'Spike Alert',
        SPEEDOMETER: {
            TITLE: "DAILY GLUCOSE BUDGET",
            SPIKES: "Spikes",
            ENERGY: "Energy",
            LOAD: "Load",
            STATUS: {
                SAFE: "Safe",
                WARNING: "Watch Out",
                OVER_LIMIT: "Over Limit",
            },
        },
    },

    LOGGING: {
        SCAN: {
            TITLE: 'Snap Your Meal',
            HELPER: 'Ensure food is well-lit and in frame.',
            ERROR_DARK: 'Too dark. Turn on light?',
            ERROR_NO_FOOD: 'No food detected. Try again.',
            SUCCESS: 'Got it! Analyzing...',
        },
        BARCODE: {
            TITLE: 'Scan Package',
            HELPER: 'Point at the barcode.',
            ERROR: 'Product not found. Try searching?',
            SUCCESS: 'Found it!',
        },
        SEARCH: {
            TITLE: 'Search Database',
            HELPER: "Type a food name (e.g., 'Roti').",
            EMPTY: "No foods found. Try 'Manual Add'.",
        },
        MANUAL: {
            TITLE: 'Quick Add',
            HELPER: 'Estimate the impact.',
            IMPACT_ESTIMATE: 'Estimated Impact',
            LABELS: {
                GREEN: 'Light Snack / Veggies',
                YELLOW: 'Balanced Meal',
                RED: 'Heavy / Sweet',
            },
        },
    },

    ANALYSIS: {
        SCORE_EXPLAIN: 'Impact on your blood sugar.',
        ADDED_SUGAR: 'Possible hidden sugars detected.',
        BETTER_CHOICE: 'Make it Better',
        DISCLAIMER: 'AI estimates may vary. For awareness only.',
        ANALYZING: 'Analyzing Food...',
    },

    DISCLAIMER_FULL: 'CutMySugar is a wellness tool, not a medical device. Data is estimated by AI and may not be 100% accurate. Do not use this app to calculate insulin doses or make medical decisions. Always consult a doctor.',
    DISCLAIMER_SHORT: 'Not Medical Advice',
    PRIVACY_NOTICE: 'To analyze your food, we send images to our secure AI partner. Images are processed instantly and are not used to train public models. You can delete your data at any time.',
};
