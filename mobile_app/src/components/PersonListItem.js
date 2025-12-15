"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var PersonListItem = function (_a) {
    var item = _a.item, onEdit = _a.onEdit, onDelete = _a.onDelete;
    var themeName = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var theme = themeName === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        item: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        itemContent: {
            flex: 1,
            marginRight: 10,
        },
        itemText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
        },
        itemSubText: {
            fontSize: 14,
            color: theme.placeholder,
            marginTop: 2,
        },
        itemInfo: {
            fontSize: 12,
            color: theme.text,
            marginTop: 2,
        },
        itemActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
        },
    }); }, [theme]);
    return (<react_native_1.View style={styles.item}>
      <react_native_1.View style={styles.itemContent}>
        <react_native_1.Text style={styles.itemText}>{item.name}</react_native_1.Text>
        {item.role ? <react_native_1.Text style={styles.itemSubText}>{item.role}</react_native_1.Text> : null}
        {item.tel1 ? <react_native_1.Text style={styles.itemInfo}>{item.tel1}</react_native_1.Text> : null}
        {item.email ? <react_native_1.Text style={styles.itemInfo}>{item.email}</react_native_1.Text> : null}
      </react_native_1.View>
      <react_native_1.View style={styles.itemActions}>
        <react_native_1.TouchableOpacity onPress={function () { return onEdit(item.id); }}>
          <MaterialCommunityIcons_1.default name="pencil" size={24} color={theme.primary}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity onPress={function () { return onDelete(item.id); }}>
          <MaterialCommunityIcons_1.default name="delete" size={24} color={theme.destructive}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.default = react_1.default.memo(PersonListItem);
