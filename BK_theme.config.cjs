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
    'background': '240 5.9% 88%',
    // Color del text per defecte.
    'foreground': '222.2 47.4% 11.2%',
    // Fons per a elements continguts, com targetes.
    'card': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color del text dins de les targetes.
    'card-foreground': '222.2 47.4% 11.2%',
    // Fons per a popovers i menús desplegables.
    'popover': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color del text dins de popovers.
    'popover-foreground': '222.2 47.4% 11.2%',
    // Color primari per a botons principals i elements destacats.
    'primary': '221.2 76% 53.3%', 
    // Color del text sobre fons primari.
    'primary-foreground': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color secundari per a botons i elements menys importants.
    'secondary': '240 5% 90%', // Canvi clau: 92% -> 90%
    // Color del text sobre fons secundari.
    'secondary-foreground': '222.2 47.4% 11.2%',
    // Color per a text o elements atenuats.
    'muted': '240 5% 90%', // Canvi clau: 92% -> 90%
    // Color del text atenuat.
    'muted-foreground': '215.4 16.3% 46.9%',
    // Color d'accent per a destacar elements o en passar el ratolí.
    'accent': '240 5.9% 87%', // Canvi clau: 88% -> 87% (per diferenciar-se del fons)
    // Color del text sobre fons d'accent.
    'accent-foreground': '222.2 47.4% 11.2%',
    // Color per a accions destructives (eliminar, errors).
    'destructive': '0 78% 60.2%',
    // Color del text sobre fons destructiu.
    'destructive-foreground': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color per a vores i separadors.
    'border': '214.3 31.8% 87%', // Canvi clau: 85% -> 87%
    // Color de fons per a camps d'entrada de formulari.
    'input': '214.3 31.8% 87%', // Canvi clau: 85% -> 87%
    // Color de l'anell de focus per a l'accessibilitat.
    'ring': '221.2 76% 53.3%',
    // Color per a estats d'èxit (verd).
    'success': '142.1 65% 45.3%',
    // Color del text sobre fons d'èxit.
    'success-foreground': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color per a estats d'advertència (groc).
    'warning': '47.9 88% 55%',
    // Color del text sobre fons d'advertència.
    'warning-foreground': '240 5.9% 10%',
    // Color per a missatges informatius (blau).
    'info': '221.2 76% 53.3%',
    // Color del text sobre fons informatiu.
    'info-foreground': '0 0% 91%', // Canvi clau: 94% -> 91%
    // Color per a l'estat "Mixt" a les assignacions (lila).
    'mixed-status': '283 75% 58%',
    // Color del text sobre fons d'estat "Mixt".
    'mixed-status-foreground': '0 0% 91%', // Canvi clau: 94% -> 91%
  },
  dark: {
    // ... (el tema fosc es manté igual que a la nostra versió anterior)
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
    'mixed-status-foreground': '0 0% 97%',
  },
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