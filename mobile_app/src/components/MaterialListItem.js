"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var MaterialListItem = function (_a) {
    var item = _a.item, onEdit = _a.onEdit, onDelete = _a.onDelete;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        item: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
        },
        itemContent: {
            flex: 1,
            marginRight: 10,
        },
        itemText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
        },
        itemSubText: {
            fontSize: 12,
            color: colors.text,
            opacity: 0.7,
            marginTop: 4,
        },
        itemActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
        },
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.item}>
      <react_native_1.View style={dynamicStyles.itemContent}>
        <react_native_1.Text style={dynamicStyles.itemText}>{item.name}</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.itemSubText}>Estoc: {item.stock} | Ubicació: {item.location}</react_native_1.Text>
      </react_native_1.View>
      <react_native_1.View style={dynamicStyles.itemActions}>
        <react_native_1.TouchableOpacity onPress={function () { return onEdit(item.id); }}>
          <MaterialCommunityIcons_1.default name="pencil" size={24} color={colors.primary}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity onPress={function () { return onDelete(item.id); }}>
          <MaterialCommunityIcons_1.default name="delete" size={24} color={colors.destructive}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.default = react_1.default.memo(MaterialListItem);
