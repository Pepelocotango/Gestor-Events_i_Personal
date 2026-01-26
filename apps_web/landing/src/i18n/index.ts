import type { AstroGlobal } from 'astro';

export interface Translations {
  navigation: {
    home: string;
    features: string;
    product_tour: string;
    gallery: string;
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
  features_section: {
    label: string;
    title: string;
    description: string;
    privacy_title: string;
    privacy_description: string;
    team_management_title: string;
    team_management_description: string;
    tech_sheets_title: string;
    tech_sheets_description: string;
    inventory_title: string;
    inventory_description: string;
    google_integration_title: string;
    google_integration_description: string;
    beta_tag: string;
  };
  download_section: {
    label: string;
    title: string;
    description: string;
    version_info_title: string;
    version_info_description: string;
    limitations_title: string;
    limitation_1: string;
    limitation_2: string;
    recommendation: string;
  };
  footer: {
    title: string;
    version: string;
    source_code: string;
    documentation: string;
    collaborate_title: string;
    collaborate_description: string;
    view_github: string;
    view_features: string;
    copyright: string;
  };
  tour_sections: Array<{
    id: string;
    title: string;
    description: string;
    features: string[];
    icon: string;
    image: string;
  }>;
  gallery: {
    label: string;
    title: string;
    subtitle: string;
  };
  carousel: {
    light_mode: string;
    dark_mode: string;
    previous_image: string;
    next_image: string;
    go_to_image: string;
  };
  tour: {
    title: string;
    description: string;
    features: string;
    loading: string;
    loading_description: string;
  };
}

const translations: Record<string, () => Promise<Translations>> = {
  ca: () => import('./translations/ca.json').then(m => m.default),
  es: () => import('./translations/es.json').then(m => m.default),
  en: () => import('./translations/en.json').then(m => m.default),
};

export async function getTranslations(Astro: AstroGlobal & { locale?: string }): Promise<Translations> {
  // Use provided locale or extract from pathname
  const lang = Astro.locale || Astro.currentLocale || getLocaleFromPath(Astro.url.pathname);
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
