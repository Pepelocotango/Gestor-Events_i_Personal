"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var PeopleToolbar_1 = require("../components/PeopleToolbar");
var PersonListItem_1 = require("../components/PersonListItem");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var themes_1 = require("../utils/themes");
var PeopleScreen = function (_a) {
    var navigation = _a.navigation;
    var _b = (0, dataStore_1.useDataStore)(), peopleGroups = _b.peopleGroups, deletePersonGroup = _b.deletePersonGroup, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _c = (0, react_1.useState)(''), search = _c[0], setSearch = _c[1];
    var _d = (0, react_1.useState)({ key: 'name', direction: 'ascending' }), sortConfig = _d[0], setSortConfig = _d[1];
    var _e = (0, react_1.useState)(false), isSortModalVisible = _e[0], setSortModalVisible = _e[1];
    var _f = (0, react_1.useState)(false), isFilterModalVisible = _f[0], setFilterModalVisible = _f[1];
    var normalize = function (str) { return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
    var sortedAndFilteredGroups = (0, react_1.useMemo)(function () {
        var filtered = peopleGroups.filter(function (pg) {
            if (!search.trim())
                return true;
            var s = normalize(search);
            return [pg.name, pg.role, pg.email, pg.tel1, pg.tel2]
                .filter(Boolean)
                .map(function (val) { return normalize(val); })
                .some(function (val) { return val.includes(s); });
        });
        return filtered.sort(function (a, b) {
            var valA = a[sortConfig.key] || '';
            var valB = b[sortConfig.key] || '';
            var comparison = String(valA).localeCompare(String(valB), 'ca', { sensitivity: 'base' });
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [peopleGroups, search, sortConfig]);
    var requestSort = function (key) {
        var direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key: key, direction: direction });
        setSortModalVisible(false);
    };
    var handleDelete = (0, react_1.useCallback)(function (id) {
        react_native_1.Alert.alert("Eliminar Persona", "Esteu segur que voleu eliminar aquesta persona?", [
            { text: "Cancel·lar", style: "cancel" },
            { text: "Eliminar", onPress: function () { return deletePersonGroup(id); }, style: 'destructive' }
        ]);
    }, [deletePersonGroup]);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        emptyList: {
            textAlign: 'center',
            marginTop: 30,
            fontSize: 16,
            color: colors.text,
            opacity: 0.7,
        },
        fab: {
            position: 'absolute',
            right: 20,
            bottom: 20,
            backgroundColor: colors.primary,
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
        modalOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        },
        modalContent: {
            backgroundColor: colors.card,
            padding: 20,
            borderRadius: 10,
            width: '80%',
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 15,
            textAlign: 'center',
            color: colors.text,
        },
    }); }, [colors, theme]);
    var renderSortModal = function () { return (<react_native_1.Modal transparent={true} visible={isSortModalVisible} onRequestClose={function () { return setSortModalVisible(false); }}>
      <react_native_1.TouchableOpacity style={dynamicStyles.modalOverlay} onPress={function () { return setSortModalVisible(false); }}>
        <react_native_1.View style={dynamicStyles.modalContent}>
          <react_native_1.Text style={dynamicStyles.modalTitle}>Ordenar per</react_native_1.Text>
          <react_native_1.Button title={"Nom ".concat(sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '')} onPress={function () { return requestSort('name'); }} color={colors.primary}/>
          <react_native_1.Button title={"Rol ".concat(sortConfig.key === 'role' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : '')} onPress={function () { return requestSort('role'); }} color={colors.primary}/>
        </react_native_1.View>
      </react_native_1.TouchableOpacity>
    </react_native_1.Modal>); };
    return (<react_native_1.View style={dynamicStyles.container}>
      <PeopleToolbar_1.default searchQuery={search} onSearchChange={setSearch} onSort={function () { return setSortModalVisible(true); }} onFilter={function () { return react_native_1.Alert.alert("WIP", "Filtres pròximament"); }}/>
      {renderSortModal()}
      <react_native_1.FlatList data={sortedAndFilteredGroups} keyExtractor={function (item) { return item.id; }} renderItem={function (_a) {
            var item = _a.item;
            return (<PersonListItem_1.default item={item} onEdit={function (id) { return navigation.navigate('PersonForm', { personId: id }); }} onDelete={handleDelete}/>);
        }} ListEmptyComponent={<react_native_1.Text style={dynamicStyles.emptyList}>No s'han trobat contactes.</react_native_1.Text>} contentContainerStyle={{ paddingBottom: 80 }}/>
      <react_native_1.TouchableOpacity style={dynamicStyles.fab} onPress={function () { return navigation.navigate('PersonForm', {}); }}>
        <MaterialCommunityIcons_1.default name="plus" size={30} color={theme === 'dark' ? themes_1.darkTheme.background : themes_1.lightTheme.background}/>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
};
var styles = react_native_1.StyleSheet.create({});
exports.default = PeopleScreen;
