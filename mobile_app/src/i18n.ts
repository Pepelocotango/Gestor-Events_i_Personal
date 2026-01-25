import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ca from './locales/ca.json';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
    ca: { translation: ca },
    es: { translation: es },
    en: { translation: en },
};

const initI18n = async () => {
    // Detect language
    const locales = Localization.getLocales();
    const languageTag = locales && locales.length > 0 ? locales[0].languageTag : 'ca';
    const lang = languageTag.split('-')[0]; // 'es-ES' -> 'es'

    i18n
        .use(initReactI18next)
        .init({
            resources: resources as any,
            lng: lang,
            fallbackLng: 'ca',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
