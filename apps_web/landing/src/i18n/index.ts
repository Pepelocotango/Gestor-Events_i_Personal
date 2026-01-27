import type { AstroGlobal } from 'astro';

export interface Translations {
  navigation: {
    home: string;
    features: string;
    product_tour: string;
    gallery: string;
    download: string;
    contact: string;
    menu: string;
    logo_text: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
    scroll_down: string;
    open_source_free: string;
    platform_support: string;
    discover_more: string;
    loading_animation: string;
  };
  site: {
    title: string;
    description: string;
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
    open_source: {
      title: string;
      description: string;
    };
    cta: {
      title: string;
      description: string;
      button_start: string;
      button_github: string;
    };
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
    installation_instructions: string;
    windows_setup: {
      title: string;
      available_versions: string;
      installer_title: string;
      installer_desc: string;
      portable_title: string;
      portable_desc: string;
      security_note: string;
    };
    macos_setup: {
      title: string;
      available_versions: string;
      step_1: string;
      step_2: string;
      step_3: string;
      step_4: string;
      step_5: string;
      security_title: string;
      security_description: string;
      standard_method: string;
      standard_step_1: string;
      standard_step_2: string;
      standard_step_3: string;
      advanced_method: string;
      option_a: string;
      option_b: string;
      terminal_command_desc: string;
      first_time_only: string;
    };
    linux_setup: {
      title: string;
      step_1: string;
      step_2: string;
      step_3: string;
      fuse_note_prefix: string;
      fuse_note_command: string;
    };
    other_versions: {
      title: string;
      description: string;
      button: string;
    };
    requirements_section: {
      title: string;
      minimum: string;
      recommended: string;
      cpu_min: string;
      ram_min: string;
      disk_min: string;
      cpu_rec: string;
      ram_rec: string;
      disk_rec: string;
    };
    source_code_github: string;
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
    loading_images: string;
  };
  tour: {
    title: string;
    description: string;
    features: string;
    loading: string;
    loading_description: string;
  };
  releases: {
    error_title: string;
    error_description: string;
    go_to_github: string;
    recommended: string;
    download_apk: string;
    download_for: string;
    view_releases: string;
    at_github: string;
    manual_installation: string;
    not_on_play_store: string;
    contains_apk: string;
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
