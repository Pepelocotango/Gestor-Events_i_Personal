// theme.config.js
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació.
// Aquest fitxer és utilitzat per l'script 'scripts/build-theme.js' per generar automàticament:
// 1. Les variables CSS a 'src/index.css' per als temes clar i fosc.
// 2. L'objecte JavaScript a 'src/utils/themeDefinition.ts' per a la generació de PDFs.

const themeConfig = {
  // Colors amb variants per al tema clar i fosc.
  // Els valors són strings HSL "H S% L%".
 

  // NOVA PALETA DE COLORS PER AL TEMA CLAR (Càlid, Fons Foscos, Text Saturat - "Taller d'Artesà")
light: {
  // --- BASE DE FONS CÀLIDA (SENSE CANVIS, MANTENIM "TALLER D'ARTESÀ") ---
  'background':           '35 25% 92%',
  'card':                 '35 15% 85%',
  'popover':              '35 15% 85%',
  'secondary':            '35 15% 82%',
  'muted':                '35 15% 82%',
  'border':               '35 10% 70%',
  'input':                '35 15% 88%',
  'accent':               '35 15% 83%',
  
  // --- TEXTOS AMB BASE GRIS/NEGRE (MÉS FOSCOS I NEUTRES) ---
  'foreground':           '240 10% 10%', // Text principal quasi negre, amb un to fred subtil.
  'card-foreground':      '240 10% 10%',
  'popover-foreground':   '240 10% 10%',
  'secondary-foreground': '240 8% 25%',
  'muted-foreground':     '240 5% 40%',  // Text secundari més fosc per a millor contrast.
  'accent-foreground':    '240 10% 10%',
  'primary-foreground':   '210 40% 98%',

  // --- COLORS D'ACCIÓ HARMONITZATS (SENSE CANVIS) ---
  'primary':              '220 35% 25%',
  'destructive':          '0 75% 55%',
  'success':              '140 65% 40%',
  'warning':              '45 85% 55%',
  'info':                 '210 70% 45%',
  'mixed-status':         '280 40% 55%',
  'ring':                 '220 35% 45%',

  // --- TEXTOS SOBRE COLORS D'ACCIÓ (AJUSTATS A LA NOVA BASE NEUTRA) ---
  'destructive-foreground': '30 100% 98%',
  'success-foreground':   '140 100% 98%',
  'warning-foreground':   '240 10% 10%', // Text principal fosc per a màxima llegibilitat sobre groc.
  'info-foreground':      '210 100% 98%',
  'mixed-status-foreground':'280 100% 98%',
},
  
  dark: {
    // --- BASE DE GRISOS CÀLIDS FOSCOS UNIFICADA ---
    'background':           '40 6% 10%', // Color de fons principal de l'aplicació en mode fosc.
    'card':                 '40 6% 15%', // Color de fons per a "targetes" en mode fosc.
    'popover':              '40 6% 15%', // Color de fons per a "popovers" en mode fosc.
    'border':               '40 6% 21%', // Color per a les vores en mode fosc.
    'input':                '40 6% 21%', // Color de fons per als camps d'entrada en mode fosc.
    'secondary':            '40 6% 25%', // Color per a fons secundaris en mode fosc.
    'muted':                '40 6% 25%', // Color de fons per a elements atenuats en mode fosc.
    'accent':               '40 6% 25%', // Color per a l'efecte "hover" en mode fosc.
    
    // --- TEXTOS ---
    'foreground':           '40 5% 96%', // Color principal del text en mode fosc.
    'card-foreground':      '40 5% 96%', // Color del text dins de les "targetes" en mode fosc.
    'popover-foreground':   '40 5% 96%', // Color del text dins dels "popovers" en mode fosc.
    'secondary-foreground': '40 5% 96%', // Color del text sobre fons 'secondary' en mode fosc.
    'muted-foreground':     '40 4% 65%', // Color per a textos secundaris o atenuats en mode fosc.
    'accent-foreground':    '40 5% 96%', // Color del text sobre fons 'accent' en mode fosc.
    
    // --- COLORS D'ACCIÓ ---
    'primary':              '221.2 76% 53.3%', // Color principal per a accions en mode fosc.
    'destructive':          '0 68% 50.6%',    // Color per a accions destructives en mode fosc.
    'success':              '142.1 65% 45.3%',// Color per a indicadors d'èxit en mode fosc.
    'warning':              '47.9 88% 55%',   // Color per a advertències en mode fosc.
    'info':                 '215 68% 48%',    // Color per a informació en mode fosc.
    'mixed-status':         '283 65% 50%',    // Color per a estats mixts en mode fosc.
    'ring':                 '221.2 83.2% 53.3%',// Color de l'anell de focus en mode fosc.

    // --- TEXTOS SOBRE COLORS D'ACCIÓ ---
    'primary-foreground':   '220 13% 97%',   // Color del text sobre fons 'primary' en mode fosc.
    'destructive-foreground':'210 20% 98%', // Color del text sobre fons 'destructive' en mode fosc.
    'success-foreground':   '145 60% 98%',   // Color del text sobre fons 'success' en mode fosc.
    'warning-foreground':   '48 95% 98%',   // CANVIAT: Ara és un color clar (groc molt pàl·lid) per a la consistència.
    'info-foreground':      '210 20% 98%',   // Color del text sobre fons 'info' en mode fosc.
    'mixed-status-foreground':'280 60% 98%', // Color del text sobre fons 'mixed-status' en mode fosc.
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