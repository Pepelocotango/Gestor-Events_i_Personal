// theme.config.js
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació.
// Aquest fitxer és utilitzat per l'script 'scripts/build-theme.js' per generar automàticament:
// 1. Les variables CSS a 'src/index.css' per als temes clar i fosc.
// 2. L'objecte JavaScript a 'src/utils/themeDefinition.ts' per a la generació de PDFs.

const themeConfig = {
  // Colors amb variants per al tema clar i fosc.
  // Els valors són strings HSL "H S% L%".
    light: {
    // === PROVA CONTUNDENT: TOT LILA ===
    'background': '270 90% 70%', // Lila clar per al fons
    'card': '270 90% 75%',       // Lila una mica més clar per a les targetes
    'popover': '270 90% 75%',
    'secondary': '270 80% 80%',
    'muted': '270 80% 80%',
    'accent': '270 85% 78%',
    'primary': '270 95% 60%',     // Blau original canviat a un lila més fort
    'destructive': '270 95% 60%', // Vermell original canviat a lila
    'success': '270 95% 60%',     // Verd original canviat a lila
    'warning': '270 95% 60%',     // Groc original canviat a lila
    'info': '270 95% 60%',         // Blau info canviat a lila
    'mixed-status': '270 95% 60%', // Lila original canviat a lila

    // === PROVA CONTUNDENT: TOT VERMELL ===
    'foreground': '0 90% 50%',              // Text principal vermell
    'card-foreground': '0 90% 50%',
    'popover-foreground': '0 90% 50%',
    'primary-foreground': '0 90% 50%',
    'secondary-foreground': '0 90% 50%',
    'muted-foreground': '0 80% 60%',         // Text atenuat vermell clar
    'accent-foreground': '0 90% 50%',
    'destructive-foreground': '0 90% 50%',
    'success-foreground': '0 90% 50%',
    'warning-foreground': '0 90% 50%',
    'info-foreground': '0 90% 50%',
    'mixed-status-foreground': '0 90% 50%',

    // === PROVA CONTUNDENT: TOT GROC ===
    'border': '50 100% 50%',  // Vores grogues
    'input': '50 100% 50%',   // Fons d'inputs groc
    'ring': '50 100% 50%',    // Anell de focus groc
  },
  dark: {
    // El tema fosc el deixem igual per no confondre'ns.
    'background': '240 5.9% 12%',
    'foreground': '210 40% 97%',
    'card': '240 5.9% 19%',
    'card-foreground': '210 40% 97%',
    'popover': '240 5.9% 12%',
    'popover-foreground': '210 40% 97%',
    'primary': '221.2 76% 53.3%',
    'primary-foreground': '0 0% 97%',
    'secondary': '240 5.1% 26.1%',
    'secondary-foreground': '210 40% 97%',
    'muted': '240 5.1% 26.1%',
    'muted-foreground': '215.4 16.3% 56.9%',
    'accent': '240 5.1% 26.1%',
    'accent-foreground': '210 40% 97%',
    'destructive': '0 68% 50.6%',
    'destructive-foreground': '0 0% 97%',
    'border': '217.2 32.6% 17.5%',
    'input': '240 5% 34.1%',
    'ring': '221.2 76% 53.3%',
    'success': '142.1 65% 45.3%',
    'success-foreground': '0 0% 97%',
    'warning': '47.9 88% 55%',
    'warning-foreground': '240 5.9% 12%',
    'info': '215 68% 48%',
    'info-foreground': '0 0% 97%',
    'mixed-status': '283 65% 50%',
  
  // ... (la resta de l'arxiu es manté igual)
  pdfExtras: {
    grayMedium: [75, 85, 99],
    graySubtle: [240, 5, 92],
    grayLightest: [240, 5, 98],
    orange: [25, 95, 53],
  },
  pdfMapping: {
    primary: 'light.primary',
    success: 'light.success',
    warning: 'light.warning',
    destructive: 'light.destructive',
    foreground: 'light.foreground',
    foregroundMuted: 'light.muted-foreground',
    foregroundWhite: 'light.primary-foreground',
    grayDark: 'dark.secondary',
    grayBorder: 'light.border',
    grayMuted: 'light.muted',
  }
};

module.exports = { themeConfig };