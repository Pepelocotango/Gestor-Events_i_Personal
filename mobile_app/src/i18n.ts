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
    // Try to load saved language preference first
    let languageCode = 'ca'; // Default to Catalan
    
    try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && ['ca', 'es', 'en'].includes(savedLanguage)) {
            languageCode = savedLanguage;
        } else {
            // Fallback to device language if no saved preference
            const locales = Localization.getLocales();
            const languageTag = locales && locales.length > 0 ? locales[0].languageTag : 'ca';
            const deviceLang = languageTag.split('-')[0]; // 'es-ES' -> 'es'
            
            // Map device language to supported languages
            if (deviceLang === 'ca') languageCode = 'ca';
            else if (deviceLang === 'es') languageCode = 'es';
            else if (deviceLang === 'en') languageCode = 'en';
            else languageCode = 'ca'; // Default to Catalan for unsupported languages
        }
    } catch (error) {
        console.error('Error loading language preference:', error);
        // Fallback to device language
        const locales = Localization.getLocales();
        const languageTag = locales && locales.length > 0 ? locales[0].languageTag : 'ca';
        const deviceLang = languageTag.split('-')[0];
        
        if (deviceLang === 'ca') languageCode = 'ca';
        else if (deviceLang === 'es') languageCode = 'es';
        else if (deviceLang === 'en') languageCode = 'en';
    }

    i18n
        .use(initReactI18next)
        .init({
            resources: resources as any,
            lng: languageCode,
            fallbackLng: 'ca',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
