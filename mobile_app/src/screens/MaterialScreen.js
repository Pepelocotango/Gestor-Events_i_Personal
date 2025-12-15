"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var MaterialToolbar_1 = require("../components/MaterialToolbar");
var MaterialListItem_1 = require("../components/MaterialListItem");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var themes_1 = require("../utils/themes");
var SectionHeader = react_1.default.memo(function (_a) {
    var title = _a.title, isExpanded = _a.isExpanded, sortMode = _a.sortMode, onToggle = _a.onToggle, style = _a.style, textStyle = _a.textStyle, iconColor = _a.iconColor;
    return (<react_native_1.TouchableOpacity onPress={function () { return onToggle(title); }} style={style} disabled={sortMode !== 'category'}>
    <react_native_1.Text style={textStyle}>{title}</react_native_1.Text>
    {sortMode === 'category' && (<MaterialCommunityIcons_1.default name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={iconColor}/>)}
  </react_native_1.TouchableOpacity>);
});
var MaterialScreen = function (_a) {
    var navigation = _a.navigation;
    var _b = (0, dataStore_1.useDataStore)(), materialItems = _b.materialItems, deleteMaterialItem = _b.deleteMaterialItem, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _c = (0, react_1.useState)(''), search = _c[0], setSearch = _c[1];
    var _d = (0, react_1.useState)('category'), sortMode = _d[0], setSortMode = _d[1];
    var _e = (0, react_1.useState)(false), isSortModalVisible = _e[0], setSortModalVisible = _e[1];
    var _f = (0, react_1.useState)(new Set()), expandedCategories = _f[0], setExpandedCategories = _f[1];
    var handleDelete = (0, react_1.useCallback)(function (id) {
        react_native_1.Alert.alert("Eliminar Material", "Esteu segur que voleu eliminar aquest ítem?", [
            { text: "Cancel·lar", style: "cancel" },
            { text: "Eliminar", onPress: function () { return deleteMaterialItem(id); }, style: 'destructive' }
        ]);
    }, [deleteMaterialItem]);
    var sectionsData = (0, react_1.useMemo)(function () {
        var filtered = materialItems.filter(function (item) {
            var searchTerm = search.toLowerCase();
            return (item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm));
        });
        if (sortMode === 'name') {
            var sortedByName = filtered.sort(function (a, b) { return a.name.localeCompare(b.name, 'ca', { sensitivity: 'base' }); });
            return [{ title: 'Tots els materials per nom', data: sortedByName }];
        }
        var grouped = filtered.reduce(function (acc, item) {
            var category = item.category || 'Sense Categoria';
            if (!acc[category])
                acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
        return Object.keys(grouped)
            .sort(function (a, b) { return a.localeCompare(b, 'ca', { sensitivity: 'base' }); })
            .map(function (category) { return ({
            title: category,
            data: grouped[category].sort(function (a, b) { return a.name.localeCompare(b.name, 'ca', { sensitivity: 'base' }); }),
        }); });
    }, [materialItems, search, sortMode]);
    var areAllExpanded = (0, react_1.useMemo)(function () {
        if (sectionsData.length === 0 || sortMode !== 'category')
            return false;
        return sectionsData.every(function (s) { return expandedCategories.has(s.title); });
    }, [expandedCategories, sectionsData, sortMode]);
    var toggleAllCategories = function () {
        if (areAllExpanded) {
            setExpandedCategories(new Set());
        }
        else {
            var allCategories = new Set(sectionsData.map(function (s) { return s.title; }));
            setExpandedCategories(allCategories);
        }
    };
    var toggleCategory = (0, react_1.useCallback)(function (category) {
        setExpandedCategories(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            }
            else {
                newSet.add(category);
            }
            return newSet;
        });
    }, []);
    var sectionsWithExpansion = (0, react_1.useMemo)(function () {
        if (sortMode !== 'category') {
            return sectionsData;
        }
        return sectionsData.map(function (section) { return (__assign(__assign({}, section), { data: expandedCategories.has(section.title) ? section.data : [] })); });
    }, [sectionsData, expandedCategories, sortMode]);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 10,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        sectionHeaderText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
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
          <react_native_1.Text style={dynamicStyles.modalTitle}>Agrupar i ordenar per</react_native_1.Text>
          <react_native_1.Button title={"Categoria ".concat(sortMode === 'category' ? '✓' : '')} onPress={function () { setSortMode('category'); setSortModalVisible(false); }} color={colors.primary}/>
          <react_native_1.Button title={"Nom ".concat(sortMode === 'name' ? '✓' : '')} onPress={function () { setSortMode('name'); setSortModalVisible(false); }} color={colors.primary}/>
        </react_native_1.View>
      </react_native_1.TouchableOpacity>
    </react_native_1.Modal>); };
    return (<react_native_1.View style={dynamicStyles.container}>
      <MaterialToolbar_1.default searchQuery={search} onSearchChange={setSearch} onSort={function () { return setSortModalVisible(true); }} onFilter={function () { return react_native_1.Alert.alert("WIP", "Filtres pròximament"); }} toggleAllCategories={toggleAllCategories} areAllExpanded={areAllExpanded}/>
      {renderSortModal()}
      <react_native_1.SectionList sections={sectionsWithExpansion} keyExtractor={function (item) { return item.id; }} renderItem={function (_a) {
            var item = _a.item;
            return (<MaterialListItem_1.default item={item} onEdit={function (id) { return navigation.navigate('MaterialForm', { materialId: id }); }} onDelete={handleDelete}/>);
        }} renderSectionHeader={function (_a) {
            var title = _a.section.title;
            return (<SectionHeader title={title} isExpanded={expandedCategories.has(title)} sortMode={sortMode} onToggle={toggleCategory} style={dynamicStyles.sectionHeader} textStyle={dynamicStyles.sectionHeaderText} iconColor={colors.text}/>);
        }} ListEmptyComponent={<react_native_1.Text style={dynamicStyles.emptyList}>No s'ha trobat material.</react_native_1.Text>} contentContainerStyle={{ paddingBottom: 80 }}/>
      <react_native_1.TouchableOpacity style={dynamicStyles.fab} onPress={function () { return navigation.navigate('MaterialForm', {}); }}>
        <MaterialCommunityIcons_1.default name="plus" size={30} color={theme === 'dark' ? themes_1.darkTheme.background : themes_1.lightTheme.background}/>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
};
var styles = react_native_1.StyleSheet.create({});
exports.default = MaterialScreen;
