import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS } from '../constants/strings';
import { STRINGS_HI } from '../constants/strings_hi';

type Language = 'en' | 'hi';
type StringsType = typeof STRINGS;

interface LanguageContextType {
    language: Language;
    strings: StringsType;
    toggleLanguage: () => void;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'cms_user_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load saved language preference
        const loadLanguage = async () => {
            try {
                const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
                if (savedLang === 'en' || savedLang === 'hi') {
                    setLanguageState(savedLang);
                }
            } catch (error) {
                console.error('Failed to load language preference', error);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        } catch (error) {
            console.error('Failed to save language preference', error);
        }
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'hi' : 'en');
    };

    const strings = language === 'hi' ? STRINGS_HI : STRINGS;

    // TypeScript check to ensure keys match
    // In a real app we might want more robust runtime checks or fallback logic

    return (
        <LanguageContext.Provider value={{ language, strings, toggleLanguage, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
