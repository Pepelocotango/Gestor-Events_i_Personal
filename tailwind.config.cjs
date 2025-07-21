const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@fullcalendar/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
plugins: [
    plugin(function({ addBase, addComponents, theme }) {
      addBase({
        // Estils per als esdeveniments que s'apliquen sempre
        '.event-complete': {
          backgroundColor: theme('colors.gray.900'),  // Fons gris fosc
          borderColor: theme('colors.green.500'),    // Contorn verd
          borderWidth: '3px',
          color: theme('colors.white'),              // Text blanc
        },
        '.event-incomplete': {
          backgroundColor: theme('colors.gray.900'),  // Fons gris fosc
          borderColor: theme('colors.yellow.500'),   // Contorn groc
          borderWidth: '3px',
          color: theme('colors.white'),              // Text blanc
        },

        // --------------------------------------------------------------------
        // --- TEMA CLAR ---
        // --------------------------------------------------------------------
        '.fc': {
          '.fc-daygrid-day': {
            overflow: 'visible',
          },
        },
        '.fc-day-today .fc-daygrid-day-number': {
          backgroundColor: theme('colors.gray.700'),
          color: theme('colors.white'),
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          margin: '2px',
        },

        // --------------------------------------------------------------------
        // --- TEMA FOSC ---
        // --------------------------------------------------------------------
        '.dark .fc': {
          '--fc-border-color': theme('colors.gray.600'),
          
          // Botons de la capçalera
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
          
          // Capçaleres dels dies
          '.fc-col-header-cell-cushion': {
            color: theme('colors.gray.300'),
            textDecoration: 'none',
          },
          '.fc-col-header': {
            backgroundColor: theme('colors.gray.700'),
          },
          
          // Números dels dies (general)
          '.fc-daygrid-day-number': {
            color: theme('colors.gray.300'),
            textDecoration: 'none',
          },
          
          // Vista de llista (Agenda)
          '.fc-list-day-cushion': {
            backgroundColor: theme('colors.gray.800'),
          },
          '.fc-list-event-title a': {
            color: theme('colors.gray.200'),
          },
          '.fc-list-table, .fc-list-event td': {
            color: theme('colors.gray.300'),
          },
          '.fc-list-event:hover td': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          
          // Vistes Multi-Mes
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
          
          // Popover d'esdeveniments (+X més)
          '.fc-popover': {
            backgroundColor: theme('colors.gray.800'),
            borderColor: theme('colors.gray.600'),
          },
          '.fc-popover-header': {
            backgroundColor: theme('colors.gray.700'),
            color: theme('colors.gray.200'),
          },
          '.fc-popover-body': {
             color: theme('colors.gray.300'),
          },
        },
        
        // Regla específica per al número del dia d'avui en tema fosc
        '.dark .fc-day-today .fc-daygrid-day-number': {
           backgroundColor: theme('colors.gray.300'),
           color: theme('colors.gray.900'),
        },
      });
    })
  ],
}