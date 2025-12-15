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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var CustomSelect_1 = require("./CustomSelect");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var MaterialControlFilters = function (_a) {
    var filters = _a.filters, setFilters = _a.setFilters, eventFrames = _a.eventFrames, materialItems = _a.materialItems, clearFilters = _a.clearFilters;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var handleFilterChange = function (key, value) {
        var _a;
        setFilters(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    };
    var allOrigins = Array.from(new Set(materialItems.map(function (item) { return item.location; }))).sort();
    var allCategories = Array.from(new Set(materialItems.map(function (item) { return item.category; }))).sort();
    var eventOptions = __spreadArray([{ label: '-- Tots els Esdeveniments --', value: '' }], eventFrames.map(function (ef) { return ({ label: ef.name, value: ef.id }); }), true);
    var originOptions = __spreadArray([{ label: '-- Tots els Orígens --', value: '' }], allOrigins.map(function (o) { return ({ label: o, value: o }); }), true);
    var categoryOptions = __spreadArray([{ label: '-- Totes les Categories --', value: '' }], allCategories.map(function (c) { return ({ label: c, value: c }); }), true);
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            padding: 10,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        searchInput: {
            backgroundColor: colors.card,
            color: colors.text,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 8,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },
        pickerContainer: {
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            minHeight: 44,
            paddingHorizontal: 6,
            paddingVertical: 4,
            overflow: 'hidden',
        },
        picker: {
            color: colors.text,
            backgroundColor: colors.card,
        }
    }); }, [colors]);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.TextInput style={styles.searchInput} placeholder="Cerca per text..." placeholderTextColor={colors.placeholder} value={filters.searchText} onChangeText={function (val) { return handleFilterChange('searchText', val); }}/>
      <react_native_1.View style={styles.pickerContainer}>
        <CustomSelect_1.default value={filters.selectedEventIds} onValueChange={function (val) { return handleFilterChange('selectedEventIds', val); }} options={eventOptions} placeholder="-- Tots els Esdeveniments --"/>
      </react_native_1.View>
      <react_native_1.View style={styles.pickerContainer}>
        <CustomSelect_1.default value={filters.selectedOrigins} onValueChange={function (val) { return handleFilterChange('selectedOrigins', val); }} options={originOptions} placeholder="-- Tots els Orígens --"/>
      </react_native_1.View>
      <react_native_1.View style={styles.pickerContainer}>
        <CustomSelect_1.default value={filters.selectedCategories} onValueChange={function (val) { return handleFilterChange('selectedCategories', val); }} options={categoryOptions} placeholder="-- Totes les Categories --"/>
      </react_native_1.View>
      <react_native_1.Button title="Netejar Filtres" onPress={clearFilters} color={colors.primary}/>
    </react_native_1.View>);
};
exports.default = MaterialControlFilters;
