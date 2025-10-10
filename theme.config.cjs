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
    'background':           '40 7% 97%', // Color de fons principal de l'aplicació.
    'card':                 '40 7% 94%', // Color de fons per a components tipus "targeta" (cards), com els formularis o les cel·les del calendari.
    'popover':              '40 7% 94%', // Color de fons per a elements emergents (popovers), com els menús desplegables o tooltips.
    'secondary':            '40 7% 91%', // Color per a fons secundaris, com la barra de menú superior o capçaleres.
    'muted':                '40 7% 91%', // Color de fons per a elements amb menys èmfasi o desactivats.
    'border':               '40 7% 88%', // Color per a les vores de contenidors i controls d'input.
    'input':                '40 7% 88%', // Color de fons per als camps d'entrada (inputs). Lligat a 'border'.
    'accent':               '40 7% 85%', // Color utilitzat per a l'efecte "hover" (passar el ratolí per sobre) en llistes i botons.
    
    // --- TEXTOS ---
    'foreground':           '80 5% 15%', // Color principal del text a tota l'aplicació.
    'card-foreground':      '40 5% 15%', // Color del text dins de les "targetes". Garanteix el contrast amb 'card'.
    'popover-foreground':   '40 5% 15%', // Color del text dins dels "popovers". Garanteix el contrast amb 'popover'.
    'secondary-foreground': '40 5% 15%', // Color del text sobre fons 'secondary'.
    'muted-foreground':     '40 4% 45%', // Color per a textos secundaris, menys importants o atenuats.
    'accent-foreground':    '40 5% 15%', // Color del text sobre fons 'accent'.
    'primary-foreground':   '40 5% 98%', // Color del text que va sobre els botons amb fons 'primary', generalment blanc o molt clar.

    // --- COLORS D'ACCIÓ (ajustats per a la coherència) ---
    'primary':              '221.2 76% 53.3%', // Color principal per a botons i elements interactius destacats.
    'destructive':          '0 78% 60.2%',    // Color per a accions perilloses o de supressió (ex: botó "Eliminar").
    'success':              '142.1 65% 45.3%',// Color per a indicar èxit o estats positius (ex: notificació "Guardat correctament").
    'warning':              '47.9 88% 55%',   // Color per a advertències o estats que requereixen atenció.
    'info':                 '221.2 76% 53.3%',// Color per a missatges informatius. Per defecte, igual que 'primary'.
    'mixed-status':         '283 75% 58%',    // Color personalitzat per a estats mixts, com en els informes de material.
    'ring':                 '221.2 83.2% 53.3%',// Color de l'anell de focus que apareix en seleccionar un element interactiu (focus ring).

    // --- TEXTOS SOBRE COLORS D'ACCIÓ ---
    'destructive-foreground': '0 0% 98%',   // Color del text sobre fons 'destructive'.
    'success-foreground':   '0 0% 98%',     // Color del text sobre fons 'success'.
    'warning-foreground':   '48 95% 15%',   // Color del text sobre fons 'warning'.
    'info-foreground':      '0 0% 98%',     // Color del text sobre fons 'info'.
    'mixed-status-foreground':'0 0% 98%', // Color del text sobre fons 'mixed-status'.
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
    'warning-foreground':   '48 95% 15%',   // Color del text sobre fons 'warning' en mode fosc (comparteix amb el tema clar per contrast).
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