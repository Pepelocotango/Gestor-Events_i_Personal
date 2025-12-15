"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
if (react_native_1.Platform.OS === 'android' && react_native_1.UIManager.setLayoutAnimationEnabledExperimental) {
    react_native_1.UIManager.setLayoutAnimationEnabledExperimental(true);
}
var CollapsibleSection = function (_a) {
    var title = _a.title, children = _a.children, controlledIsExpanded = _a.isExpanded, onToggle = _a.onToggle;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _b = (0, react_1.useState)(true), internalIsExpanded = _b[0], setInternalIsExpanded = _b[1];
    var isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
    var toggleExpansion = function () {
        react_native_1.LayoutAnimation.configureNext(react_native_1.LayoutAnimation.Presets.easeInEaseOut);
        if (onToggle) {
            onToggle();
        }
        else {
            setInternalIsExpanded(!internalIsExpanded);
        }
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 10,
            overflow: 'hidden',
            borderColor: colors.border,
            borderWidth: 1,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 15,
            backgroundColor: colors.card,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
        },
        icon: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text,
        },
        content: {
            padding: 15,
            borderTopColor: colors.border,
            borderTopWidth: 1,
        },
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.container}>
      <react_native_1.TouchableOpacity onPress={toggleExpansion} style={dynamicStyles.header}>
        <react_native_1.Text style={dynamicStyles.title}>{title}</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.icon}>{isExpanded ? '-' : '+'}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      {isExpanded && (<react_native_1.View style={dynamicStyles.content}>
          {children}
        </react_native_1.View>)}
    </react_native_1.View>);
};
exports.default = CollapsibleSection;
