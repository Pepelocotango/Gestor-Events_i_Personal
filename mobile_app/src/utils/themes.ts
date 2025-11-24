import { themeConfig } from './themeConfig';

export const lightTheme = {
  background: themeConfig.light.background,
  text: themeConfig.light.foreground,
  primary: themeConfig.light.primary,
  card: themeConfig.light.card,
  border: themeConfig.light.border,
  placeholder: themeConfig.light['muted-foreground'],
  // Colors semàntiques (constants en ambdós temes)
  'status-yes': themeConfig.semantic['status-yes'],
  'status-pending': themeConfig.semantic['status-pending'],
  'status-no': themeConfig.semantic['status-no'],
  'status-mixed': themeConfig.semantic['status-mixed'],
  destructive: themeConfig.semantic.destructive,
  shadow: themeConfig.semantic.shadow,
  'selected-day-text': themeConfig.semantic['selected-day-text'],
};

export const darkTheme = {
  background: themeConfig.dark.background,
  text: themeConfig.dark.foreground,
  primary: themeConfig.dark.primary,
  card: themeConfig.dark.card,
  border: themeConfig.dark.border,
  placeholder: themeConfig.dark['muted-foreground'],
  // Colors semàntiques (constants en ambdós temes)
  'status-yes': themeConfig.semantic['status-yes'],
  'status-pending': themeConfig.semantic['status-pending'],
  'status-no': themeConfig.semantic['status-no'],
  'status-mixed': themeConfig.semantic['status-mixed'],
  destructive: themeConfig.semantic.destructive,
  shadow: themeConfig.semantic.shadow,
  'selected-day-text': themeConfig.semantic['selected-day-text'],
};
