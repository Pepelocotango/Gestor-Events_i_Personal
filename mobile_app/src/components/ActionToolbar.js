"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var ActionToolbar = function (_a) {
    var sortOrder = _a.sortOrder, setSortOrder = _a.setSortOrder, showArchived = _a.showArchived, setShowArchived = _a.setShowArchived, toggleAllCards = _a.toggleAllCards, areAllExpanded = _a.areAllExpanded;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var styles = react_1.default.useMemo(function () { return react_native_1.StyleSheet.create({
        toolbar: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: 8,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        buttonText: {
            marginLeft: 8,
            fontSize: 14,
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.View style={styles.toolbar}>
      <react_native_1.TouchableOpacity style={styles.button} onPress={function () { return setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
        <MaterialCommunityIcons_1.default name={sortOrder === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={24} color={colors.text}/>
        <react_native_1.Text style={styles.buttonText}>Data</react_native_1.Text>
      </react_native_1.TouchableOpacity>

      <react_native_1.TouchableOpacity style={styles.button} onPress={function () { return setShowArchived(!showArchived); }}>
        <MaterialCommunityIcons_1.default name={showArchived ? "archive-eye" : "archive-eye-outline"} size={24} color={colors.text}/>
        <react_native_1.Text style={styles.buttonText}>{showArchived ? 'Mostrant arxivats' : 'Veure arxivats'}</react_native_1.Text>
      </react_native_1.TouchableOpacity>

      <react_native_1.TouchableOpacity style={styles.button} onPress={toggleAllCards}>
        <MaterialCommunityIcons_1.default name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text}/>
        <react_native_1.Text style={styles.buttonText}>{areAllExpanded ? 'Replegar' : 'Expandir'}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
};
exports.default = ActionToolbar;
