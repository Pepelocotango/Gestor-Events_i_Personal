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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      }
    },
  },
  plugins: [
    plugin(function({ addBase }) {
      addBase({
        // --- Estils per als esdeveniments (ARA AMB ESTIL FOSC FIX) ---
        '.event-complete': {
          backgroundColor: 'hsl(var(--calendar-event-bg))',
          borderColor: 'hsl(var(--success))',
          borderWidth: '3px',
          color: 'hsl(var(--calendar-event-fg))',
        },
        '.event-incomplete': {
          backgroundColor: 'hsl(var(--calendar-event-bg))',
          borderColor: 'hsl(var(--warning))',
          borderWidth: '3px',
          color: 'hsl(var(--calendar-event-fg))',
        },

        // --- Estils Generals de FullCalendar (ARA DINÀMICS) ---
        '.fc': {
          '--fc-border-color': 'hsl(var(--border))',
          '--fc-today-bg-color': 'hsla(var(--accent) / 0.5)',
          '--fc-list-event-hover-bg-color': 'hsl(var(--accent))',

          '.fc-button': {
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--secondary-foreground))',
            borderColor: 'hsl(var(--border))',
          },
          '.fc-button:hover': {
            backgroundColor: 'hsl(var(--accent))',
          },
          '.fc-button-primary:not(:disabled).fc-button-active': {
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            borderColor: 'hsl(var(--primary))',
          },
          '.fc-list-event-title a, .fc-list-table, .fc-list-event td, .fc-popover-body': {
            color: 'hsl(var(--muted-foreground))',
            textDecoration: 'none',
          },
          '.fc-popover-header': {
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--card-foreground))',
          },
          '.fc-popover': {
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
          },
          '.fc-popover-header': {
              color: 'hsl(var(--popover-foreground))',
          }
        },
        '.fc-day-today .fc-daygrid-day-number': {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '9999px',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          margin: '2px',
        },
      });
    })
  ],
}