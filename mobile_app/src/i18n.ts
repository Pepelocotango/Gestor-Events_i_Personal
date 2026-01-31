import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ca from './locales/ca.json';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
    ca: { translation: ca },
    es: { translation: es },
    en: { translation: en },
};

const initI18n = async () => {
    let languageCode = 'ca'; // Default fallback

    try {
        // 1. Try to get saved language
        const savedLanguage = await AsyncStorage.getItem('app_language');
        
        if (savedLanguage && ['ca', 'es', 'en'].includes(savedLanguage)) {
            languageCode = savedLanguage;
        } else {
            // 2. Fallback to device locale
            const locales = Localization.getLocales();
            if (locales && locales.length > 0) {
                const deviceLang = locales[0].languageTag.split('-')[0]; // 'es-ES' -> 'es'
                if (['ca', 'es', 'en'].includes(deviceLang)) {
                    languageCode = deviceLang;
                }
            }
        }
    } catch (error) {
        console.warn('Failed to load language preference, falling back to default:', error);
    }

    // 3. Initialize i18next
    // We use .use(initReactI18next) to pass the i18n instance to react-i18next.
    await i18n
        .use(initReactI18next)
        .init({
            compatibilityJSON: 'v4', // Important for Android/React Native
            resources: resources as any,
            lng: languageCode,
            fallbackLng: 'ca',
            interpolation: {
                escapeValue: false, // React already safes from xss
            },
            react: {
                useSuspense: false // Prevent UI blocking during loading
            }
        });
};

// Execute initialization and catch any critical startup errors
initI18n().catch(err => {
    console.error('Critical i18n initialization error:', err);
});

export default i18n;
