import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Welcome: undefined;
    OnboardingWizard: undefined;
    Disclaimer: undefined; // Keeping as separate or part of wizard? Wizard has it.
    Permissions: undefined;
    Ready: undefined;
    Login: { isRegistering?: boolean };
    PhoneNumber: { isRegistering?: boolean };
    Home: undefined;
    ScanFood: { date?: string };
    SearchFood: { date?: string };
    ScanBarcode: { date?: string };
    ManualEntry: { date?: string };
    FoodAnalysis: {
        imageUri?: string;
        base64?: string;
        productData?: any;
        mealId?: string;
        existingResult?: any;
        date?: string;
    };
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
