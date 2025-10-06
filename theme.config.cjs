// theme.config.js
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació.
// Aquest fitxer és utilitzat per l'script 'scripts/build-theme.js' per generar automàticament:
// 1. Les variables CSS a 'src/index.css' per als temes clar i fosc.
// 2. L'objecte JavaScript a 'src/utils/themeDefinition.ts' per a la generació de PDFs.

const themeConfig = {
  // Colors amb variants per al tema clar i fosc.
  // Els valors són strings HSL "H S% L%".
  light: {
    'background': '240 5.9% 90%',
    'foreground': '222.2 47.4% 11.2%',
    'card': '0 0% 100%',
    'card-foreground': '222.2 47.4% 11.2%',
    'popover': '0 0% 100%',
    'popover-foreground': '222.2 47.4% 11.2%',
    'primary': '221.2 83.2% 53.3%',
    'primary-foreground': '0 0% 100%',
    'secondary': '240 5% 96.1%',
    'secondary-foreground': '222.2 47.4% 11.2%',
    'muted': '240 5% 96.1%',
    'muted-foreground': '215.4 16.3% 46.9%',
    'accent': '240 5.9% 90%',
    'accent-foreground': '222.2 47.4% 11.2%',
    'destructive': '0 84.2% 60.2%',
    'destructive-foreground': '0 0% 100%',
    'border': '214.3 31.8% 91.4%',
    'input': '214.3 31.8% 91.4%',
    'ring': '221.2 83.2% 53.3%',
    'success': '142.1 70.6% 45.3%',
    'success-foreground': '0 0% 100%',
    'warning': '47.9 95.8% 53.1%',
    'warning-foreground': '240 5.9% 10%',
    'info': '221.2 83.2% 53.3%',
    'info-foreground': '0 0% 100%',
    'mixed-status': '283 81% 58%',
    'mixed-status-foreground': '0 0% 100%',
  },
  dark: {
    'background': '240 5.9% 10%',
    'foreground': '210 40% 98%',
    'card': '240 5.9% 19%',
    'card-foreground': '210 40% 98%',
    'popover': '240 5.9% 10%',
    'popover-foreground': '210 40% 98%',
    'primary': '221.2 83.2% 53.3%',
    'primary-foreground': '0 0% 100%',
    'secondary': '240 5.1% 26.1%',
    'secondary-foreground': '210 40% 98%',
    'muted': '240 5.1% 26.1%',
    'muted-foreground': '215.4 16.3% 56.9%',
    'accent': '240 5.1% 26.1%',
    'accent-foreground': '210 40% 98%',
    'destructive': '0 72.2% 50.6%',
    'destructive-foreground': '0 0% 100%',
    'border': '217.2 32.6% 17.5%',
    'input': '240 5% 34.1%',
    'ring': '221.2 83.2% 53.3%',
    'success': '142.1 70.6% 45.3%',
    'success-foreground': '0 0% 100%',
    'warning': '47.9 95.8% 53.1%',
    'warning-foreground': '240 5.9% 10%',
    'info': '215 75% 45%',
    'info-foreground': '0 0% 100%',
    'mixed-status': '283 71% 48%',
    'mixed-status-foreground': '0 0% 100%',
  },
  // Colors addicionals que només s'utilitzen en la generació de PDFs
  // i no formen part del sistema de variables CSS de Tailwind.
  // Els valors són arrays numèrics [H, S, L].
  pdfExtras: {
    grayMedium: [75, 85, 99],
    graySubtle: [240, 5, 92],
    grayLightest: [240, 5, 98],
    orange: [25, 95, 53],
  },
  // Mapeig per generar l'objecte 'themeHslColors' a 'themeDefinition.ts'.
  // L'script utilitzarà aquest mapa per obtenir el valor correcte del tema 'light'
  // o 'dark' i assignar-lo a la clau corresponent en l'objecte JS.
  pdfMapping: {
    primary: 'light.primary',
    success: 'light.success',
    warning: 'light.warning',
    destructive: 'light.destructive',
    foreground: 'light.foreground',
    foregroundMuted: 'light.muted-foreground',
    foregroundWhite: 'light.primary-foreground',
    grayDark: 'dark.secondary', // Cas especial: utilitza un valor del tema fosc
    grayBorder: 'light.border',
    grayMuted: 'light.muted',
  }
};

module.exports = { themeConfig };