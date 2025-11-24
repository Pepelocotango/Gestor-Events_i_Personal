// mobile_app/src/utils/themeConfig.ts
// Aquesta és l'única font de veritat per a la paleta de colors de l'aplicació mòbil.
// Deriva directament de 'theme.config.cjs' de l'aplicació d'escriptori per mantenir la coherència.

export const themeConfig = {
  light: {
    'background':           'hsl(35, 25%, 92%)',
    'foreground':           'hsl(240, 10%, 10%)',
    'card':                 'hsl(35, 15%, 85%)',
    'border':               'hsl(35, 10%, 50%)',
    'primary':              'hsl(220, 35%, 25%)',
    'muted':                'hsl(35, 10%, 83%)',
    'muted-foreground':     'hsl(240, 5%, 40%)',
  },
  dark: {
    'background':           'hsl(40, 6%, 10%)',
    'foreground':           'hsl(40, 5%, 96%)',
    'card':                 'hsl(40, 6%, 15%)',
    'border':               'hsl(40, 6%, 50%)',
    'primary':              'hsl(221.2, 76%, 53.3%)',
    'muted':                'hsl(40, 4%, 17%)',
    'muted-foreground':     'hsl(40, 4%, 65%)',
  },
};
