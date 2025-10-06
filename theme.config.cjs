// theme.config.js
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació.
// Aquest fitxer és utilitzat per l'script 'scripts/build-theme.js' per generar automàticament:
// 1. Les variables CSS a 'src/index.css' per als temes clar i fosc.
// 2. L'objecte JavaScript a 'src/utils/themeDefinition.ts' per a la generació de PDFs.

const themeConfig = {
  // Colors amb variants per al tema clar i fosc.
  // Els valors són strings HSL "H S% L%".
  light: {
    // Fons principal de les pàgines.
    'background': '240 5.9% 90%',
    // Color del text per defecte.
    'foreground': '222.2 47.4% 11.2%',
    // Fons per a elements continguts, com targetes (Gris molt clar en lloc de blanc pur).
    'card': '0 0% 98%',
    // Color del text dins de les targetes.
    'card-foreground': '222.2 47.4% 11.2%',
    // Fons per a popovers i menús desplegables (Gris molt clar en lloc de blanc pur).
    'popover': '0 0% 98%',
    // Color del text dins de popovers.
    'popover-foreground': '222.2 47.4% 11.2%',
    // Color primari per a botons principals i elements destacats.
    'primary': '221.2 83.2% 53.3%',
    // Color del text sobre fons primari (Gris molt clar en lloc de blanc pur).
    'primary-foreground': '0 0% 98%',
    // Color secundari per a botons i elements menys importants.
    'secondary': '240 5% 96.1%',
    // Color del text sobre fons secundari.
    'secondary-foreground': '222.2 47.4% 11.2%',
    // Color per a text o elements atenuats.
    'muted': '240 5% 96.1%',
    // Color del text atenuat.
    'muted-foreground': '215.4 16.3% 46.9%',
    // Color d'accent per a destacar elements o en passar el ratolí.
    'accent': '240 5.9% 90%',
    // Color del text sobre fons d'accent.
    'accent-foreground': '222.2 47.4% 11.2%',
    // Color per a accions destructives (eliminar, errors).
    'destructive': '0 84.2% 60.2%',
    // Color del text sobre fons destructiu (Gris molt clar en lloc de blanc pur).
    'destructive-foreground': '0 0% 98%',
    // Color per a vores i separadors.
    'border': '214.3 31.8% 91.4%',
    // Color de fons per a camps d'entrada de formulari.
    'input': '214.3 31.8% 91.4%',
    // Color de l'anell de focus per a l'accessibilitat.
    'ring': '221.2 83.2% 53.3%',
    // Color per a estats d'èxit (verd).
    'success': '142.1 70.6% 45.3%',
    // Color del text sobre fons d'èxit (Gris molt clar en lloc de blanc pur).
    'success-foreground': '0 0% 98%',
    // Color per a estats d'advertència (groc).
    'warning': '47.9 95.8% 53.1%',
    // Color del text sobre fons d'advertència.
    'warning-foreground': '240 5.9% 10%',
    // Color per a missatges informatius (blau).
    'info': '221.2 83.2% 53.3%',
    // Color del text sobre fons informatiu (Gris molt clar en lloc de blanc pur).
    'info-foreground': '0 0% 98%',
    // Color per a l'estat "Mixt" a les assignacions (lila).
    'mixed-status': '283 81% 58%',
    // Color del text sobre fons d'estat "Mixt" (Gris molt clar en lloc de blanc pur).
    'mixed-status-foreground': '0 0% 98%',
  },
  dark: {
    // Fons principal de les pàgines (Gris fosc en lloc de gairebé negre).
    'background': '240 5.9% 12%',
    // Color del text per defecte.
    'foreground': '210 40% 98%',
    // Fons per a elements continguts, com targetes.
    'card': '240 5.9% 19%',
    // Color del text dins de les targetes.
    'card-foreground': '210 40% 98%',
    // Fons per a popovers i menús desplegables (Gris fosc en lloc de gairebé negre).
    'popover': '240 5.9% 12%',
    // Color del text dins de popovers.
    'popover-foreground': '210 40% 98%',
    // Color primari per a botons principals i elements destacats.
    'primary': '221.2 83.2% 53.3%',
    // Color del text sobre fons primari (Gris molt clar en lloc de blanc pur).
    'primary-foreground': '0 0% 98%',
    // Color secundari per a botons i elements menys importants.
    'secondary': '240 5.1% 26.1%',
    // Color del text sobre fons secundari.
    'secondary-foreground': '210 40% 98%',
    // Color per a text o elements atenuats.
    'muted': '240 5.1% 26.1%',
    // Color del text atenuat.
    'muted-foreground': '215.4 16.3% 56.9%',
    // Color d'accent per a destacar elements o en passar el ratolí.
    'accent': '240 5.1% 26.1%',
    // Color del text sobre fons d'accent.
    'accent-foreground': '210 40% 98%',
    // Color per a accions destructives (eliminar, errors).
    'destructive': '0 72.2% 50.6%',
    // Color del text sobre fons destructiu (Gris molt clar en lloc de blanc pur).
    'destructive-foreground': '0 0% 98%',
    // Color per a vores i separadors.
    'border': '217.2 32.6% 17.5%',
    // Color de fons per a camps d'entrada de formulari.
    'input': '240 5% 34.1%',
    // Color de l'anell de focus per a l'accessibilitat.
    'ring': '221.2 83.2% 53.3%',
    // Color per a estats d'èxit (verd).
    'success': '142.1 70.6% 45.3%',
    // Color del text sobre fons d'èxit (Gris molt clar en lloc de blanc pur).
    'success-foreground': '0 0% 98%',
    // Color per a estats d'advertència (groc).
    'warning': '47.9 95.8% 53.1%',
    // Color del text sobre fons d'advertència (Gris fosc en lloc de gairebé negre).
    'warning-foreground': '240 5.9% 12%',
    // Color per a missatges informatius (blau).
    'info': '215 75% 45%',
    // Color del text sobre fons informatiu (Gris molt clar en lloc de blanc pur).
    'info-foreground': '0 0% 98%',
    // Color per a l'estat "Mixt" a les assignacions (lila).
    'mixed-status': '283 71% 48%',
    // Color del text sobre fons d'estat "Mixt" (Gris molt clar en lloc de blanc pur).
    'mixed-status-foreground': '0 0% 98%',
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