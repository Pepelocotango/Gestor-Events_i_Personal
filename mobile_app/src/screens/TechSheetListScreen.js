"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TechSheetListScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var TechSheetListItem_1 = require("../components/TechSheetListItem");
var themes_1 = require("../utils/themes");
function TechSheetListScreen(_a) {
    var navigation = _a.navigation;
    var _b = (0, dataStore_1.useDataStore)(), isLoading = _b.isLoading, error = _b.error, eventFrames = _b.eventFrames, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var techSheets = (0, react_1.useMemo)(function () { return eventFrames.filter(function (ef) { return ef.techSheet; }); }, [eventFrames]);
    var handleItemPress = (0, react_1.useCallback)(function (eventId) {
        navigation.navigate('TechSheetDetail', { eventId: eventId });
    }, [navigation]);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            padding: 16,
            backgroundColor: colors.background,
        },
        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.background,
        },
        text: {
            color: colors.text,
            textAlign: 'center',
        },
        errorText: {
            color: 'red',
        },
    }); }, [colors]);
    if (isLoading) {
        return (<react_native_1.View style={dynamicStyles.centerContainer}>
        <react_native_1.ActivityIndicator size="large" color={colors.primary}/>
      </react_native_1.View>);
    }
    if (error) {
        return (<react_native_1.View style={dynamicStyles.centerContainer}>
        <react_native_1.Text style={dynamicStyles.errorText}>{error}</react_native_1.Text>
      </react_native_1.View>);
    }
    if (techSheets.length === 0) {
        return (<react_native_1.View style={dynamicStyles.centerContainer}>
        <react_native_1.Text style={dynamicStyles.text}>No s'han trobat fitxes de bolo.</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.text}>Assegura't d'haver obert un fitxer de dades.</react_native_1.Text>
      </react_native_1.View>);
    }
    var renderItem = function (_a) {
        var item = _a.item;
        return (<TechSheetListItem_1.default item={item} onPress={function () { return handleItemPress(item.id); }}/>);
    };
    return (<react_native_1.View style={{ flex: 1, backgroundColor: colors.background }}>
      <react_native_1.FlatList data={techSheets} renderItem={renderItem} keyExtractor={function (item) { return item.id; }} contentContainerStyle={dynamicStyles.container} windowSize={10} initialNumToRender={10} maxToRenderPerBatch={10}/>
    </react_native_1.View>);
}
