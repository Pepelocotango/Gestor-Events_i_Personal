"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var MaterialControlFilters_1 = require("../components/MaterialControlFilters");
var MaterialControlList_1 = require("../components/MaterialControlList");
var themes_1 = require("../utils/themes");
var MaterialControlScreen = function () {
    var _a = (0, dataStore_1.useDataStore)(), eventFrames = _a.eventFrames, materialItems = _a.materialItems, theme = _a.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _b = (0, react_1.useState)({
        searchText: '',
        dateRange: { start: '', end: '' },
        selectedEventIds: '',
        selectedOrigins: '',
        selectedCategories: '',
    }), filters = _b[0], setFilters = _b[1];
    var clearFilters = function () {
        setFilters({
            searchText: '',
            dateRange: { start: '', end: '' },
            selectedEventIds: '',
            selectedOrigins: '',
            selectedCategories: '',
        });
    };
    var data = (0, react_1.useMemo)(function () {
        return (0, dataStore_1.selectMaterialControlData)({ eventFrames: eventFrames, materialItems: materialItems }, filters);
    }, [eventFrames, materialItems, filters]);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.container}>
      <MaterialControlFilters_1.default filters={filters} setFilters={setFilters} eventFrames={eventFrames} materialItems={materialItems} clearFilters={clearFilters}/>
      <MaterialControlList_1.default data={data}/>
    </react_native_1.View>);
};
exports.default = MaterialControlScreen;
