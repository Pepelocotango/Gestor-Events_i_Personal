"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dateFormat_1 = require("../utils/dateFormat");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var TechSheetListItem = function (_a) {
    var item = _a.item, onPress = _a.onPress;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            elevation: 2,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
            borderColor: colors.border,
            borderWidth: 1,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            color: colors.text,
        },
        detail: {
            fontSize: 14,
            marginBottom: 4,
            color: colors.text,
        },
        bold: {
            fontWeight: 'bold',
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.TouchableOpacity style={styles.card} onPress={onPress}>
      <react_native_1.Text style={styles.title}>{item.name}</react_native_1.Text>
      <react_native_1.Text style={styles.detail}>
        <react_native_1.Text style={styles.bold}>Lloc:</react_native_1.Text> {item.place || 'No especificat'}
      </react_native_1.Text>
      <react_native_1.Text style={styles.detail}>
        <react_native_1.Text style={styles.bold}>Data:</react_native_1.Text> {(0, dateFormat_1.formatDate)(item.startDate)}
      </react_native_1.Text>
    </react_native_1.TouchableOpacity>);
};
exports.default = react_1.default.memo(TechSheetListItem);
