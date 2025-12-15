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
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var FilterControls = function (_a) {
    var filters = _a.filters, setFilters = _a.setFilters, peopleGroups = _a.peopleGroups, eventFrames = _a.eventFrames, clearFilters = _a.clearFilters;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var handleFilterChange = function (key, value) {
        var _a;
        setFilters(__assign(__assign({}, filters), (_a = {}, _a[key] = value, _a)));
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            padding: 10,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        searchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        searchInput: {
            flex: 1,
            height: 40,
            backgroundColor: colors.background,
            borderRadius: 20,
            paddingHorizontal: 15,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
        },
        clearButton: {
            marginLeft: 10,
            padding: 5,
        },
        pickerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 10,
        },
        pickerContainer: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            minHeight: 44,
            paddingHorizontal: 6,
            paddingVertical: 4,
            overflow: 'hidden',
        },
        picker: {
            flex: 1,
            height: 44,
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.container}>
      <react_native_1.View style={dynamicStyles.searchRow}>
        <react_native_1.TextInput style={dynamicStyles.searchInput} placeholder="Cerca global..." placeholderTextColor={colors.placeholder} value={filters.text} onChangeText={function (value) { return handleFilterChange('text', value); }}/>
        <react_native_1.TouchableOpacity onPress={clearFilters} style={dynamicStyles.clearButton}>
          <MaterialCommunityIcons_1.default name="filter-remove" size={24} color={colors.text}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <react_native_1.View style={dynamicStyles.pickerRow}>
        <react_native_1.View style={dynamicStyles.pickerContainer}>
          <CustomSelect_1.default value={filters.person} onValueChange={function (val) { return handleFilterChange('person', val); }} options={__spreadArray([{ label: 'Totes les persones', value: '' }], peopleGroups.map(function (p) { return ({ label: p.name, value: p.id }); }), true)} placeholder="Totes les persones"/>
        </react_native_1.View>
        <react_native_1.View style={dynamicStyles.pickerContainer}>
          <CustomSelect_1.default value={filters.eventFrame} onValueChange={function (val) { return handleFilterChange('eventFrame', val); }} options={__spreadArray([{ label: 'Tots els esdeveniments', value: '' }], eventFrames.map(function (ef) { return ({ label: ef.name, value: ef.id }); }), true)} placeholder="Tots els esdeveniments"/>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.default = FilterControls;
