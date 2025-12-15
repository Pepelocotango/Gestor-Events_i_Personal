"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var PeopleToolbar = function (_a) {
    var searchQuery = _a.searchQuery, onSearchChange = _a.onSearchChange, onSort = _a.onSort, onFilter = _a.onFilter;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        toolbar: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        searchInput: {
            flex: 1,
            height: 40,
            backgroundColor: colors.background,
            borderRadius: 20,
            paddingHorizontal: 15,
            marginRight: 10,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
        },
        iconButton: {
            padding: 5,
        },
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.toolbar}>
      <react_native_1.TextInput style={dynamicStyles.searchInput} placeholder="Cerca persones..." placeholderTextColor={colors.placeholder} value={searchQuery} onChangeText={onSearchChange}/>
      <react_native_1.TouchableOpacity onPress={onSort} style={dynamicStyles.iconButton}>
        <MaterialCommunityIcons_1.default name="sort" size={24} color={colors.text}/>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
};
exports.default = PeopleToolbar;
