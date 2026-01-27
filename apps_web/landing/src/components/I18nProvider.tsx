import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import caTranslations from '../i18n/translations/ca.json';
import esTranslations from '../i18n/translations/es.json';
import enTranslations from '../i18n/translations/en.json';

interface I18nContextType {
  language: string;
  changeLanguage: (lang: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider: React.FC<{ children: React.ReactNode; initialLang?: string }> = ({ 
  children, 
  initialLang = 'ca' 
}) => {
  const [language, setLanguage] = useState(initialLang);

  useEffect(() => {
    // Initialize i18next
    i18n
      .use(initReactI18next)
      .init({
        resources: {
          ca: { translation: caTranslations },
          es: { translation: esTranslations },
          en: { translation: enTranslations }
        },
        lng: language,
        fallbackLng: 'ca',
        interpolation: {
          escapeValue: false
        }
      });
  }, [language]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <I18nContext.Provider value={{ language, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;
