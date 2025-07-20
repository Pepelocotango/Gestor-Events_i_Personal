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
        // --- ESTILS GENERALS ---
        '.event-complete': { backgroundColor: theme('colors.green.500'), borderColor: theme('colors.green.600'), color: theme('colors.white') },
        '.event-incomplete': { backgroundColor: theme('colors.blue.500'), borderColor: theme('colors.blue.600'), color: theme('colors.white') },

        // --- TEMA CLAR ---
        '.fc': {
          '.fc-daygrid-day': { overflow: 'visible' },
          // Efecte hover subtil per a la vista de llista
          '.fc-list-event:hover td': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
        },
        '.fc-day-today .fc-daygrid-day-number': {
          backgroundColor: theme('colors.gray.700'), color: theme('colors.white'),
          borderRadius: '50%', width: '24px', height: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0', margin: '2px',
        },

        // --- TEMA FOSC ---
        '.dark .fc': {
          '--fc-border-color': theme('colors.gray.600'),
          // Botons de la capçalera
          '.fc-button': { backgroundColor: theme('colors.gray.700'), color: theme('colors.gray.200'), borderColor: theme('colors.gray.600') },
          '.fc-button:hover': { backgroundColor: theme('colors.gray.600') },
          '.fc-button-primary:not(:disabled).fc-button-active': { backgroundColor: theme('colors.blue.600'), borderColor: theme('colors.blue.600') },
          // Capçaleres de dies
          '.fc-col-header-cell-cushion': { color: theme('colors.gray.300'), textDecoration: 'none' },
          '.fc-col-header': { backgroundColor: theme('colors.gray.700') },
          // Números dels dies
          '.fc-daygrid-day-number': { color: theme('colors.gray.300'), textDecoration: 'none' },
          
          // <<< NOVES REGLES PER A LA VISTA D'AGENDA EN MODE FOSC >>>
          '.fc-list-day-cushion': { backgroundColor: theme('colors.gray.800') },
          '.fc-list-event-title a': { color: theme('colors.gray.200') },
          '.fc-list-table, .fc-list-event td': { color: theme('colors.gray.300') },
          '.fc-list-event:hover td': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
          
          // Vistes Multi-Mes
          '.fc-multimonth-month': { backgroundColor: theme('colors.gray.800') },
          '.fc-daygrid-day': { backgroundColor: theme('colors.gray.700'), overflow: 'visible' },
          '.fc-multimonth-title': { color: theme('colors.gray.100') },
        },
        '.dark .fc-day-today .fc-daygrid-day-number': {
           backgroundColor: theme('colors.gray.300'),
           color: theme('colors.gray.900'),
        },
      });
    })
  ],
}
