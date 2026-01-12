import React, { useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { MealProvider } from './src/context/MealContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('SplashScreen.preventAutoHideAsync error:', e);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('SplashScreen.hideAsync error:', e);
      }
    }
  }, [fontsLoaded]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider onLayout={onLayoutRootView} style={{ flex: 1 }}>
        <AuthProvider>
          <MealProvider>
            <StatusBar style="dark" />
            {!fontsLoaded ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Loading Fonts...</Text>
              </View>
            ) : (
              <AppNavigator />
            )}
          </MealProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
