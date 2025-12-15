"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReadOnlyField;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../../stores/dataStore");
var themes_1 = require("../../utils/themes");
function ReadOnlyField(_a) {
    var label = _a.label, value = _a.value;
    var themeName = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = themeName === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    return (<react_native_1.View style={[styles.fieldContainer, { alignItems: 'flex-start' }]}>
      <react_native_1.Text style={[styles.label, { color: colors.text }]}>{label}:</react_native_1.Text>
      <react_native_1.Text style={[styles.value, { color: colors.text }]}>{value || 'No especificat'}</react_native_1.Text>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    fieldContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        fontWeight: 'bold',
        marginRight: 8,
        minWidth: 120,
    },
    value: {
        flex: 1,
    },
});
