"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkTheme = exports.lightTheme = void 0;
var themeConfig_1 = require("./themeConfig");
exports.lightTheme = {
    background: themeConfig_1.themeConfig.light.background,
    text: themeConfig_1.themeConfig.light.foreground,
    primary: themeConfig_1.themeConfig.light.primary,
    card: themeConfig_1.themeConfig.light.card,
    border: themeConfig_1.themeConfig.light.border,
    placeholder: themeConfig_1.themeConfig.light['muted-foreground'],
    // Colors semàntiques (constants en ambdós temes)
    'status-yes': themeConfig_1.themeConfig.semantic['status-yes'],
    'status-pending': themeConfig_1.themeConfig.semantic['status-pending'],
    'status-no': themeConfig_1.themeConfig.semantic['status-no'],
    'status-mixed': themeConfig_1.themeConfig.semantic['status-mixed'],
    destructive: themeConfig_1.themeConfig.semantic.destructive,
    shadow: themeConfig_1.themeConfig.semantic.shadow,
    'selected-day-text': themeConfig_1.themeConfig.semantic['selected-day-text'],
};
exports.darkTheme = {
    background: themeConfig_1.themeConfig.dark.background,
    text: themeConfig_1.themeConfig.dark.foreground,
    primary: themeConfig_1.themeConfig.dark.primary,
    card: themeConfig_1.themeConfig.dark.card,
    border: themeConfig_1.themeConfig.dark.border,
    placeholder: themeConfig_1.themeConfig.dark['muted-foreground'],
    // Colors semàntiques (constants en ambdós temes)
    'status-yes': themeConfig_1.themeConfig.semantic['status-yes'],
    'status-pending': themeConfig_1.themeConfig.semantic['status-pending'],
    'status-no': themeConfig_1.themeConfig.semantic['status-no'],
    'status-mixed': themeConfig_1.themeConfig.semantic['status-mixed'],
    destructive: themeConfig_1.themeConfig.semantic.destructive,
    shadow: themeConfig_1.themeConfig.semantic.shadow,
    'selected-day-text': themeConfig_1.themeConfig.semantic['selected-day-text'],
};
