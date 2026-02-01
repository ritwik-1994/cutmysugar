import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
export interface User {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    hasCompletedOnboarding?: boolean;
    // Extended Profile Fields
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;
    primary_goal?: string;
    dietary_preference?: string;
    daily_budget?: number;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signInWithGoogle: (idToken?: string) => Promise<void>;
    signInWithPhone: (phone: string, isWhatsApp?: boolean) => Promise<{ error: any }>;
    signInWithMockPhone: (phone: string, isRegistering?: boolean) => Promise<{ session: Session | null; error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any; session?: Session | null }>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

// --- Helpers ---

// Timeout wrapper to prevent async operations from hanging indefinitely
const withTimeout = <T,>(promise: Promise<T>, ms: number = 3000, errorMsg: string = "Operation timed out"): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
};

// Map Supabase User to App User
const mapSessionToUser = (u: SupabaseUser, profile?: any): User => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: profile?.full_name || u.user_metadata?.full_name || u.user_metadata?.name,
    hasCompletedOnboarding: false, // Default, updated during profile sync
    height: profile?.height,
    weight: profile?.weight,
    age: profile?.age,
    gender: profile?.gender,
    primary_goal: profile?.primary_goal,
    dietary_preference: profile?.dietary_preference,
    daily_budget: profile?.daily_budget,
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- Core Logic: Handle Session Changes Linearly ---
    const handleSessionChange = async (newSession: Session | null, event: string) => {
        if (!newSession) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
            return;
        }

        // 1. Optimistic Update REMOVED for Strict Quarantine
        setSession(newSession);

        // 2. Strict Login Check & Profile Sync
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            setIsLoading(true);
            try {
                await withTimeout(
                    processLoginAndSync(newSession.user, event),
                    4000,
                    "Profile Sync Timed Out"
                );
            } catch (err) {
                console.error("Auth Flow: Critical Error during sync:", err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    const processLoginAndSync = async (authUser: SupabaseUser, event: string) => {
        // A. Strict Login Enforcement (Allowlist)
        let { data: existingProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();

        // SELF-HEALING: If profile is missing (PGRST116), create it explicitly.
        if (profileError && profileError.code === 'PGRST116') {
            const payload = {
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'New User',
                phone: authUser.phone,
                daily_budget: 100, // Default
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase.from('profiles').insert([payload]);

            if (insertError) {
                console.error("Self-Healing Failed:", insertError);
            } else {
                // Re-fetch
                const retry = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                existingProfile = retry.data;
                profileError = retry.error;
            }
        }

        if (profileError) {
            console.error("Profile Fetch Failed:", profileError.message);
        }

        // CHECK: Distinguish between "Real User" and "Ghost Trigger-Created User"
        const hasValidProfile = existingProfile && (existingProfile.full_name || existingProfile.name || existingProfile.username);

        const authIntent = await AsyncStorage.getItem('auth_intent');
        const cachedOnboardingStatus = await AsyncStorage.getItem('user_onboarded_status');

        // B. Handle "Register" flow / Temp Data Sync
        const tempGoal = await AsyncStorage.getItem('temp_goal');

        // RULE: If NO VALID profile exists, and intent is NOT 'register', REJECT.
        // FIX: Also check if tempGoal exists (implies partially completed onboarding)
        const isStrictCheck = event !== 'INITIAL_SESSION';

        if (isStrictCheck && !hasValidProfile && authIntent !== 'register' && !tempGoal) {
            await AsyncStorage.setItem('auth_error', 'USER_NOT_FOUND_GOOGLE'); // UI Prompt
            await logout(); // FORCE FULL CLEANUP
            throw new Error("Strict Login Rejection");
        }

        if (authIntent === 'register' || tempGoal) {
            await syncTempDataToProfile(authUser, existingProfile);
        }

        // CONSUME INTENT
        await AsyncStorage.removeItem('auth_intent');

        // C. Update Onboarding Status in Local State
        let isComplete = false;
        if (tempGoal) {
            isComplete = true; // Just finished onboarding
        } else if (existingProfile) {
            isComplete = !!(existingProfile.primary_goal || (existingProfile.height && existingProfile.weight));
        }

        if (!isComplete && !existingProfile) {
            const cached = await AsyncStorage.getItem('user_onboarded_status');
            if (cached === 'true') isComplete = true;
        }

        // UNLOCK THE UI
        const validUser = mapSessionToUser(authUser, existingProfile);
        validUser.hasCompletedOnboarding = isComplete;

        // CLEAR ERROR
        await AsyncStorage.removeItem('auth_error');

        setUser(validUser);
        AsyncStorage.setItem('user_onboarded_status', isComplete ? 'true' : 'false').catch(() => { });
    };

    const syncTempDataToProfile = async (authUser: SupabaseUser, existingProfile: any) => {
        const tempName = await AsyncStorage.getItem('temp_user_name');
        const tempGoal = await AsyncStorage.getItem('temp_goal');
        const tempDiet = await AsyncStorage.getItem('temp_diet_pref');
        const tempDisclaimer = await AsyncStorage.getItem('temp_medical_disclaimer');
        const tempHeight = await AsyncStorage.getItem('temp_height_cm');
        const tempWeight = await AsyncStorage.getItem('temp_weight_kg');
        const tempAge = await AsyncStorage.getItem('temp_age');
        const tempGender = await AsyncStorage.getItem('temp_gender');

        // PRESERVE EXISTING DATA (The "Safe Merge")
        // Logic: If the user IS already onboarded (has a goal), we respect their existing data.
        // If they are NOT onboarded (Ghost or New), we use the Temp Data.

        const isRealUser = !!existingProfile?.primary_goal;

        // 1. Name Logic
        let fullName = existingProfile?.full_name;
        // If no existing name, or it's a placeholder, use Temp Name
        if ((!fullName || fullName === 'New User') && tempName) {
            fullName = tempName;
        }
        // Fallback checks
        if (!fullName) fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'New User';


        // 2. Budget Logic
        let finalBudget = existingProfile?.daily_budget || 100;
        const finalGoal = existingProfile?.primary_goal || tempGoal;

        // If we have a goal (either existing or new), calculate the standard budget
        let calculatedBudget = 100;
        if (finalGoal) {
            switch (finalGoal) {
                case 'blood_sugar': calculatedBudget = 70; break;
                case 'avoid_spikes': calculatedBudget = 90; break;
                case 'energy': calculatedBudget = 110; break;
                case 'pcos': calculatedBudget = 75; break;
            }
        }

        // CRITICAL FIX: If this is a Ghost Profile (not real user), OVERWRITE the budget with the calculated one.
        // Don't let the default '100' from the DB trigger block the correct goal-based budget.
        if (!isRealUser && finalGoal) {
            finalBudget = calculatedBudget;
        }

        const payload = {
            id: authUser.id,
            email: authUser.email,
            phone: authUser.phone,
            full_name: fullName,
            primary_goal: finalGoal || null,
            daily_budget: finalBudget,
            dietary_preference: existingProfile?.dietary_preference || tempDiet || null,
            medical_disclaimer_accepted: existingProfile?.medical_disclaimer_accepted || (tempDisclaimer === 'true'),
            height: existingProfile?.height || (tempHeight ? parseFloat(tempHeight) : null),
            weight: existingProfile?.weight || (tempWeight ? parseFloat(tempWeight) : null),
            age: existingProfile?.age || (tempAge ? parseInt(tempAge) : null),
            gender: existingProfile?.gender || tempGender || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) console.error("Auth Flow: Profile Upsert Failed. Details:", JSON.stringify(error, null, 2));
        else {
            console.log("Auth Flow: Profile Upsert Success");
            await AsyncStorage.multiRemove(['temp_user_name', 'temp_goal', 'temp_diet_pref', 'temp_medical_disclaimer', 'temp_height_cm', 'temp_weight_kg', 'temp_age', 'temp_gender']);
        }
    };


    // --- Effect: subscription ---
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            // Initial Session Check (Fallback/Validation)
            const { data, error } = await supabase.auth.getSession();
            if (!mounted) return;
            if (error) console.warn("Auth Init Error:", error.message);
            // Manually trigger handler for initial session
            if (data.session) {
                handleSessionChange(data.session, 'INITIAL_SESSION');
            } else {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // 2. Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;
            // Debounce IGNORED here because we want to catch all real events, 
            // but the unmount check handles the duplicates from component remounts.
            handleSessionChange(session, event);
        });

        // 3. Deep Link Listener (unchanged logic)
        const handleDeepLink = (event: { url: string }) => {
            if (!mounted) return;
            const url = event.url;
            if (url && url.includes('access_token')) {
                const params: Record<string, string> = {};
                const queryString = url.split('#')[1] || url.split('?')[1];
                if (queryString) {
                    queryString.split('&').forEach(p => {
                        const [k, v] = p.split('=');
                        params[k] = decodeURIComponent(v);
                    });
                }
                if (params.access_token && params.refresh_token) {
                    supabase.auth.setSession({
                        access_token: params.access_token,
                        refresh_token: params.refresh_token,
                    });
                }
            }
        };
        const subUrl = Linking.addEventListener('url', handleDeepLink);
        Linking.getInitialURL().then(url => url && handleDeepLink({ url }));

        return () => {
            mounted = false; // Block pending promises
            subscription.unsubscribe();
            subUrl.remove();
        };
    }, []);

    // --- Exposed Methods ---
    const signInWithGoogle = async (idToken?: string) => {
        setIsLoading(true); // Manually set loading for better UX
        try {
            // DYNAMIC REDIRECT: Critical for Web vs Mobile Production
            const redirectUrl = Platform.OS === 'web'
                ? (typeof window !== 'undefined' ? window.location.origin : undefined)
                : 'cutmysugar://auth/callback';

            console.log("OAuth Redirect URL:", redirectUrl);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: 'offline', // Request refresh token
                        prompt: 'consent',
                    }
                }
            });
            if (error) throw error;
        } catch (e) {
            console.error(e);
            setIsLoading(false);
            throw e;
        }
    };

    const signInWithPhone = async (phone: string, isWhatsApp = false) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone,
                options: { channel: isWhatsApp ? 'whatsapp' : 'sms' }
            });
            return { error };
        } catch (error) { return { error }; } finally { setIsLoading(false); }
    };

    const signInWithMockPhone = async (phone: string, isRegistering = true) => {
        setIsLoading(true);
        const MVP_PASSWORD = "MvpPassword123!";
        try {
            // Try Login first
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                phone, password: MVP_PASSWORD
            });

            if (!signInError && signInData.session) return { session: signInData.session, error: null };

            // Handle Failures
            const isUserNotFound = signInError && (signInError.message.includes("Invalid login") || (signInError as any).code === "user_not_found");

            if (isUserNotFound) {
                if (!isRegistering) return { error: { message: "USER_NOT_FOUND" }, session: null }; // Strict Login Reject

                // Attempt Signup
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    phone, password: MVP_PASSWORD
                });
                if (signUpError) {
                    if (signUpError.message.includes("already registered")) return { error: { message: "USER_ALREADY_EXISTS" }, session: null };
                    throw signUpError;
                }
                return { session: signUpData.session, error: null };
            }
            throw signInError;
        } catch (error) { return { error, session: null }; } finally { setIsLoading(false); }
    };

    const verifyOtp = async (phone: string, token: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
            return { error, session: data.session };
        } catch (error) { return { error, session: null }; } finally { setIsLoading(false); }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await withTimeout(supabase.auth.signOut(), 3000, "Logout Timeout");
        } catch (e) { console.warn("Logout forced:", e); }
        finally {
            // Clear all local storage keys related to app
            try {
                const keys = await AsyncStorage.getAllKeys();
                const appKeys = keys.filter(k =>
                    k.startsWith('sb-') ||
                    k === 'supabase.auth.token' ||
                    k.includes('auth') ||
                    k === 'user_onboarded_status' // FIX: Explicitly remove this flag
                );
                await AsyncStorage.multiRemove(appKeys);
            } catch (e) { }

            setSession(null);
            setUser(null);
            setIsLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<User>) => {
        if (!user || !session?.user.id) return { error: "No user logged in" };

        // Optimistic UI update
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        try {
            // Map User updates to Supabase columns
            const payload: any = {};
            if (updates.name) payload.full_name = updates.name;
            if (updates.email) payload.email = updates.email;
            if (updates.phone) payload.phone = updates.phone;
            // For other fields (height, weight, goal, diet) we need to extend the User type or handle them separately if not in User interface yet.
            // Based on context, User interface only has basic fields.
            // Let's assume we pass a payload that matches the profile table directly for this specific method 
            // OR we update the User interface to include these fields. 

            // Allow passing arbitrary profile fields for now via casting or extending the type locally in the method signature if needed.
            // But better: Let's assume 'updates' contains the keys we want to save.

            const profilePayload: any = { updated_at: new Date().toISOString() };

            // Map known UI keys to DB keys
            if (updates.name) profilePayload.full_name = updates.name;
            if ('height' in updates) profilePayload.height = updates.height;
            if ('weight' in updates) profilePayload.weight = updates.weight;
            if ('age' in updates) profilePayload.age = updates.age;
            if ('gender' in updates) profilePayload.gender = updates.gender;
            if ('primary_goal' in updates) profilePayload.primary_goal = (updates as any).primary_goal;
            if ('dietary_preference' in updates) profilePayload.dietary_preference = (updates as any).dietary_preference;
            if ('daily_budget' in updates) profilePayload.daily_budget = (updates as any).daily_budget;

            const { error } = await supabase
                .from('profiles')
                .update(profilePayload)
                .eq('id', session.user.id);

            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            console.error("Update Profile Error:", error);
            // Revert optimistic update if needed? For now we just log.
            return { error };
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signInWithPhone, signInWithMockPhone, verifyOtp, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
