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
        // --- Estils per als esdeveniments (SEMPRE ESTIL FOSC) ---
        '.event-complete': {
          backgroundColor: 'hsl(240 5.9% 19%)', // Color fons d'esdeveniment fosc
          borderColor: 'hsl(142 71% 45%)',     // Color verd (--success)
          borderWidth: '3px',
          color: 'hsl(0 0% 100%)',             // Color text blanc
        },
        '.event-incomplete': {
          backgroundColor: 'hsl(240 5.9% 19%)', // Color fons d'esdeveniment fosc
          borderColor: 'hsl(38 92% 50%)',      // Color groc (--warning)
          borderWidth: '3px',
          color: 'hsl(0 0% 100%)',             // Color text blanc
        },

        // --- Estils Generals de FullCalendar (SEMPRE ESTIL FOSC) ---
        '.fc': {
          '--fc-border-color': 'hsl(240 5.1% 26.1%)',  // border (dark)
          '--fc-today-bg-color': 'hsla(240 5.1% 26.1% / 0.5)', // accent (dark)
          '--fc-list-event-hover-bg-color': 'hsl(240 5.1% 26.1%)', // accent (dark)

          '.fc-button': {
            backgroundColor: 'hsl(240 5.1% 26.1%)', // secondary (dark)
            color: 'hsl(240 5% 96.1%)',         // secondary-foreground (dark)
            borderColor: 'hsl(240 5.1% 26.1%)',     // border (dark)
          },
          '.fc-button:hover': {
            backgroundColor: 'hsl(240 5.1% 30.1%)', // Un pèl més clar que accent
          },
          '.fc-button-primary:not(:disabled).fc-button-active': {
            backgroundColor: 'hsl(221 83% 53%)', // primary
            color: 'hsl(0 0% 100%)',         // primary-foreground
            borderColor: 'hsl(221 83% 53%)', // primary
          },
          '.fc-col-header-cell-cushion, .fc-daygrid-day-number, .fc-list-event-title a, .fc-list-table, .fc-list-event td, .fc-multimonth-title, .fc-popover-body': {
            color: 'hsl(240 4.8% 85.9%)', // muted-foreground (dark)
            textDecoration: 'none',
          },
          '.fc-col-header, .fc-popover-header': {
            backgroundColor: 'hsl(240 5.1% 26.1%)', // secondary (dark)
            color: 'hsl(240 5% 96.1%)',         // card-foreground (dark)
          },
          '.fc-list-day-cushion, .fc-multimonth-month': {
            backgroundColor: 'hsl(240 5.1% 26.1%)', // muted (dark)
          },
          '.fc-daygrid-day': {
            backgroundColor: 'hsl(240 5.9% 19%)', // card (dark)
            overflow: 'visible',
          },
          '.fc-popover': {
            backgroundColor: 'hsl(240 5.9% 10%)', // popover (dark)
            borderColor: 'hsl(240 5.1% 26.1%)',     // border (dark)
          },
          '.fc-popover-header': {
              color: 'hsl(240 5% 96.1%)', // popover-foreground (dark)
          }
        },
        '.fc-day-today .fc-daygrid-day-number': {
          backgroundColor: 'hsl(221 83% 53%)', // primary
          color: 'hsl(0 0% 100%)',         // primary-foreground
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