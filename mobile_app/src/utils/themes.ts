import { themeConfig } from './themeConfig';

export const lightTheme = {
  background: themeConfig.light.background,
  text: themeConfig.light.foreground,
  primary: themeConfig.light.primary,
  card: themeConfig.light.card,
  border: themeConfig.light.border,
  placeholder: themeConfig.light['muted-foreground'],
};

export const darkTheme = {
  background: themeConfig.dark.background,
  text: themeConfig.dark.foreground,
  primary: themeConfig.dark.primary,
  card: themeConfig.dark.card,
  border: themeConfig.dark.border,
  placeholder: themeConfig.dark['muted-foreground'],
};
