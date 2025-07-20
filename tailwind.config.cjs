const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Escaneja els paquets de FullCalendar per a les classes fc-*
    "./node_modules/@fullcalendar/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Pots afegir colors personalitzats aquí si vols
    },
  },
  plugins: [
    plugin(function({ addBase, addComponents, theme }) {
      addBase({
        // Estils per als esdeveniments que s'apliquen sempre
        '.event-complete': {
          backgroundColor: theme('colors.green.500'),
          borderColor: theme('colors.green.600'),
          color: theme('colors.white'),
        },
        '.event-incomplete': {
          backgroundColor: theme('colors.blue.500'),
          borderColor: theme('colors.blue.600'),
          color: theme('colors.white'),
        },

        // Estils per al tema clar
        '.fc': {
          '.fc-daygrid-day': {
            overflow: 'visible',
          },
        },
        
        // --- NOVES REGLES PER AL DIA D'AVUI (TEMA CLAR) ---
        // Eliminem el fons de la cel·la: .fc-day-today { ... }
        
        '.fc-day-today .fc-daygrid-day-number': {
          backgroundColor: theme('colors.gray.700'), // Cercle gris fosc
          color: theme('colors.white'),
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex', // <<< CENTRAT AMB FLEXBOX
          alignItems: 'center', // <<< CENTRAT AMB FLEXBOX
          justifyContent: 'center', // <<< CENTRAT AMB FLEXBOX
          padding: '0', // <<< RESET DE PADDING
          margin: '2px', // <<< AJUST DE MARGE
        },

        // Estils específics per al TEMA FOSC
        '.dark .fc': {
          '--fc-border-color': theme('colors.gray.600'),
          
          '.fc-button': {
            backgroundColor: theme('colors.gray.700'),
            color: theme('colors.gray.200'),
            borderColor: theme('colors.gray.600'),
          },
          '.fc-button:hover': {
            backgroundColor: theme('colors.gray.600'),
          },
          '.fc-button-primary:not(:disabled).fc-button-active': {
            backgroundColor: theme('colors.blue.600'),
            borderColor: theme('colors.blue.600'),
          },
          '.fc-col-header-cell-cushion': {
            color: theme('colors.gray.300'),
            textDecoration: 'none',
          },
          '.fc-col-header': {
            backgroundColor: theme('colors.gray.700'),
          },
          '.fc-daygrid-day-number': {
            color: theme('colors.gray.300'),
            textDecoration: 'none',
          },
          '.fc-list-day-cushion': {
            backgroundColor: theme('colors.gray.700'),
          },
          '.fc-list-event-title a': {
            color: theme('colors.gray.200'),
          },
          '.fc-list-table': {
            color: theme('colors.gray.300'),
          },
          '.fc-multimonth-month': {
             backgroundColor: theme('colors.gray.800'),
          },
          '.fc-daygrid-day': {
             backgroundColor: theme('colors.gray.700'),
             overflow: 'visible',
          },
          '.fc-multimonth-title': {
            color: theme('colors.gray.100'),
          },
        },
        
        // --- NOVES REGLES PER AL DIA D'AVUI (TEMA FOSC) ---
        // Eliminem el fons de la cel·la: .dark .fc-day-today { ... }

        '.dark .fc-day-today .fc-daygrid-day-number': {
           backgroundColor: theme('colors.gray.300'), // Cercle gris clar
           color: theme('colors.gray.900'), // Text negre/fosc
        },
      });
    })
  ],
}