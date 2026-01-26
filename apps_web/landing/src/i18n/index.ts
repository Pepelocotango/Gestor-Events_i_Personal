import type { AstroGlobal } from 'astro';

export interface Translations {
  navigation: {
    home: string;
    features: string;
    download: string;
    contact: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  features: {
    title: string;
    calendar_management: {
      title: string;
      description: string;
    };
    personnel_management: {
      title: string;
      description: string;
    };
    material_inventory: {
      title: string;
      description: string;
    };
    technical_sheets: {
      title: string;
      description: string;
    };
    export_import: {
      title: string;
      description: string;
    };
    google_sync: {
      title: string;
      description: string;
    };
  };
  download: {
    title: string;
    desktop_title: string;
    desktop_description: string;
    mobile_title: string;
    mobile_description: string;
    download_desktop: string;
    download_mobile: string;
    requirements: string;
    windows: string;
    macos: string;
    linux: string;
    android: string;
    ios: string;
  };
  footer: {
    collaborate_title: string;
    collaborate_description: string;
    view_github: string;
    view_features: string;
    copyright: string;
  };
}

const translations: Record<string, () => Promise<Translations>> = {
  ca: () => import('./translations/ca.json').then(m => m.default),
  es: () => import('./translations/es.json').then(m => m.default),
  en: () => import('./translations/en.json').then(m => m.default),
};

export async function getTranslations(Astro: AstroGlobal): Promise<Translations> {
  const lang = Astro.currentLocale || 'ca';
  const translationFunction = translations[lang] || translations.ca;
  return await translationFunction();
}

export function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  
  if (['ca', 'es', 'en'].includes(locale)) {
    return locale;
  }
  
  return 'ca'; // Default locale
}
