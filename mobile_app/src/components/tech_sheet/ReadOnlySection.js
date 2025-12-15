"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReadOnlySection;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../../stores/dataStore");
var themes_1 = require("../../utils/themes");
function ReadOnlySection(_a) {
    var title = _a.title, children = _a.children;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        sectionContainer: {
            marginBottom: 16,
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
            elevation: 2,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingBottom: 4,
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.View style={styles.sectionContainer}>
      <react_native_1.Text style={styles.sectionTitle}>{title}</react_native_1.Text>
      {children}
    </react_native_1.View>);
}
