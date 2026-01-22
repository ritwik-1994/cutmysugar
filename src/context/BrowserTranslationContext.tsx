import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type BrowserTranslationContextType = {
    enabled: boolean;
    setEnabled: (v: boolean) => void;
};

const BrowserTranslationContext = createContext<BrowserTranslationContextType | undefined>(undefined);

export const BrowserTranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            // 1. Check existing cookie or DOM to sync state
            const cookies = document.cookie.split(';');
            const googtrans = cookies.find(c => c.trim().startsWith('googtrans='));
            if (googtrans && (googtrans.includes('/en/hi') || googtrans.includes('/auto/hi'))) {
                setEnabled(true);
            }

            // 2. Define global callback for Google Translate
            (window as any).googleTranslateElementInit = () => {
                new (window as any).google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,hi',
                        autoDisplay: false,
                        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE
                    },
                    'google_translate_element'
                );
            };

            // 3. Inject Google Translate Script if missing
            if (!document.getElementById('google-translate-script')) {
                const script = document.createElement('script');
                script.id = 'google-translate-script';
                script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                script.async = true;
                document.body.appendChild(script);
            }
        }
    }, []);

    const toggle = (v: boolean) => {
        setEnabled(v);
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            const domain = window.location.hostname;
            const rootDomain = domain.split('.').slice(-2).join('.');
            const targetLang = v ? '/en/hi' : '/en/en';

            // Set cookies (backup for persistence)
            document.cookie = `googtrans=${targetLang}; path=/`;
            document.cookie = `googtrans=${targetLang}; path=/; domain=${domain}`;
            if (rootDomain !== domain) {
                document.cookie = `googtrans=${targetLang}; path=/; domain=.${rootDomain}`;
            }

            // Force reload to apply translation
            window.location.reload();
        }
    };

    return (
        <BrowserTranslationContext.Provider value={{ enabled, setEnabled: toggle }}>
            {children}
            {Platform.OS === 'web' && (
                <div id="google_translate_element" style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}></div>
            )}
        </BrowserTranslationContext.Provider>
    );
};

export const useBrowserTranslation = () => {
    const ctx = useContext(BrowserTranslationContext);
    if (!ctx) throw new Error('useBrowserTranslation must be used within BrowserTranslationProvider');
    return ctx;
};
