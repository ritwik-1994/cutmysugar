import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Welcome: undefined;
    Problem: undefined;
    Solution: undefined;
    Disclaimer: undefined;
    Permissions: undefined;
    Ready: undefined;
    TwoSignals: undefined; // Keeping for now
    ProteinMyth: undefined; // Keeping for now
    Preferences: undefined; // Keeping for now
    HeightWeight: undefined; // Keeping for now
    Login: undefined;
    PhoneNumber: undefined;
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
