"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var MaterialToolbar = function (_a) {
    var searchQuery = _a.searchQuery, onSearchChange = _a.onSearchChange, onSort = _a.onSort, onFilter = _a.onFilter, toggleAllCategories = _a.toggleAllCategories, areAllExpanded = _a.areAllExpanded;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingBottom: 5,
        },
        toolbar: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
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
            borderColor: colors.border,
            borderWidth: 1,
        },
        iconButton: {
            padding: 5,
        },
        bottomBar: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingHorizontal: 15,
        },
        toggleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 5,
        },
        buttonText: {
            marginLeft: 8,
            fontSize: 14,
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.toolbar}>
        <react_native_1.TextInput style={styles.searchInput} placeholder="Cerca material..." placeholderTextColor={colors.placeholder} value={searchQuery} onChangeText={onSearchChange}/>
        <react_native_1.TouchableOpacity onPress={onSort} style={styles.iconButton}>
          <MaterialCommunityIcons_1.default name="sort" size={24} color={colors.text}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <react_native_1.View style={styles.bottomBar}>
        <react_native_1.TouchableOpacity style={styles.toggleButton} onPress={toggleAllCategories}>
            <MaterialCommunityIcons_1.default name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text}/>
            <react_native_1.Text style={styles.buttonText}>{areAllExpanded ? 'Replegar' : 'Expandir'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.default = MaterialToolbar;
