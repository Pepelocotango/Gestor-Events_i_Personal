// theme.config.js
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació.
// Aquest fitxer és utilitzat per l'script 'scripts/build-theme.js' per generar automàticament:
// 1. Les variables CSS a 'src/index.css' per als temes clar i fosc.
// 2. L'objecte JavaScript a 'src/utils/themeDefinition.ts' per a la generació de PDFs.

const themeConfig = {
  // Colors amb variants per al tema clar i fosc.
  // Els valors són strings HSL "H S% L%".
  light: {
    // --- BASE DE GRISOS CÀLIDS UNIFICADA (to groc/marronós molt subtil) ---
    'background':           '40 7% 97%', // Gris quasi blanc original -> 
    'card':                 '40 7% 94%', // Gris clar per a targetes i controls
    'popover':              '40 7% 94%',
    'secondary':            '40 7% 91%', // Gris per a fons secundaris (barra de menú)
    'muted':                '40 7% 91%',
    'border':               '40 7% 88%', // Vores i inputs
    'input':                '40 7% 88%',
    'accent':               '40 7% 85%', // Per a l'efecte hover
    
    // --- TEXTOS ---
    'foreground':           '80 5% 15%', // Text principal (gris molt fosc)
    'card-foreground':      '40 5% 15%',
    'popover-foreground':   '40 5% 15%',
    'secondary-foreground': '40 5% 15%',
    'muted-foreground':     '40 4% 45%', // Text atenuat
    'accent-foreground':    '40 5% 15%',
    'primary-foreground':   '40 5% 98%', // Text sobre botons (blanc trencat)

    // --- COLORS D'ACCIÓ (ajustats per a la coherència) ---
    'primary':              '221.2 76% 53.3%',
    'destructive':          '0 78% 60.2%',
    'success':              '142.1 65% 45.3%',
    'warning':              '47.9 88% 55%',
    'info':                 '221.2 76% 53.3%',
    'mixed-status':         '283 75% 58%',
    'ring':                 '221.2 83.2% 53.3%',

    // --- TEXTOS SOBRE COLORS D'ACCIÓ ---
    'destructive-foreground': '0 0% 98%',
    'success-foreground':   '0 0% 98%',
    'warning-foreground':   '48 95% 15%',
    'info-foreground':      '0 0% 98%',
    'mixed-status-foreground':'0 0% 98%',
  },
  dark: {
    // --- BASE DE GRISOS CÀLIDS FOSCOS UNIFICADA ---
    'background':           '40 6% 10%', // Gris fosc (base)
    'card':                 '40 6% 15%', // Targetes una mica més clares
    'popover':              '40 6% 15%',
    'border':               '40 6% 21%', // Vores i inputs
    'input':                '40 6% 21%',
    'secondary':            '40 6% 25%', // Fons secundaris
    'muted':                '40 6% 25%',
    'accent':               '40 6% 25%',
    
    // --- TEXTOS ---
    'foreground':           '40 5% 96%', // Text principal (blanc trencat)
    'card-foreground':      '40 5% 96%',
    'popover-foreground':   '40 5% 96%',
    'secondary-foreground': '40 5% 96%',
    'muted-foreground':     '40 4% 65%',
    'accent-foreground':    '40 5% 96%',
    
    // --- COLORS D'ACCIÓ ---
    'primary':              '221.2 76% 53.3%',
    'destructive':          '0 68% 50.6%',
    'success':              '142.1 65% 45.3%',
    'warning':              '47.9 88% 55%',
    'info':                 '215 68% 48%',
    'mixed-status':         '283 65% 50%',
    'ring':                 '221.2 83.2% 53.3%',

    // --- TEXTOS SOBRE COLORS D'ACCIÓ ---
    'primary-foreground':   '220 13% 97%',
    'destructive-foreground':'210 20% 98%',
    'success-foreground':   '145 60% 98%',
    'warning-foreground':   '48 95% 15%',
    'info-foreground':      '210 20% 98%',
    'mixed-status-foreground':'280 60% 98%',
  },
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