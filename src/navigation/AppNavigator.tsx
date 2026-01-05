import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { COLORS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

// Screens
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import ProblemScreen from '../screens/Onboarding/ProblemScreen';
import SolutionScreen from '../screens/Onboarding/SolutionScreen';
import DisclaimerScreen from '../screens/Onboarding/DisclaimerScreen';
import PermissionsScreen from '../screens/Onboarding/PermissionsScreen';
import ReadyScreen from '../screens/Onboarding/ReadyScreen';
import PreferencesScreen from '../screens/Onboarding/PreferencesScreen';
import HeightWeightScreen from '../screens/Onboarding/HeightWeightScreen';
import LoginScreen from '../screens/Onboarding/LoginScreen';
import PhoneNumberScreen from '../screens/Onboarding/PhoneNumberScreen';
import HomeScreen from '../screens/HomeScreen';
import ScanFoodScreen from '../screens/ScanFoodScreen';
import FoodAnalysisScreen from '../screens/FoodAnalysisScreen';
import ScanBarcodeScreen from '../screens/ScanBarcodeScreen';
import SearchFoodScreen from '../screens/SearchFoodScreen';
import ManualEntryScreen from '../screens/ManualEntryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => {
    const { user } = useAuth();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'slide_from_right',
            }}
        >
            {user ? (
                // App Stack
                <>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen
                        name="ScanFood"
                        component={ScanFoodScreen}
                        options={{
                            presentation: 'fullScreenModal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                    <Stack.Screen
                        name="FoodAnalysis"
                        component={FoodAnalysisScreen}
                        options={{
                            headerShown: false,
                            animation: 'fade'
                        }}
                    />

                    <Stack.Screen
                        name="SearchFood"
                        component={SearchFoodScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ManualEntry"
                        component={ManualEntryScreen}
                        options={{ headerShown: false }}
                    />
                </>
            ) : (
                // Auth Stack (Onboarding)
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Problem" component={ProblemScreen} />
                    <Stack.Screen name="Solution" component={SolutionScreen} />
                    <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
                    <Stack.Screen name="Permissions" component={PermissionsScreen} />
                    <Stack.Screen name="Preferences" component={PreferencesScreen} />
                    <Stack.Screen name="HeightWeight" component={HeightWeightScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
                    <Stack.Screen name="Ready" component={ReadyScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <AppStack />
        </NavigationContainer>
    );
}

