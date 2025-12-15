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
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var themes_1 = require("../utils/themes");
var MaterialFormScreen = function (_a) {
    var navigation = _a.navigation, route = _a.route;
    var materialId = route.params.materialId;
    var _b = (0, dataStore_1.useDataStore)(), materialItems = _b.materialItems, addMaterialItem = _b.addMaterialItem, updateMaterialItem = _b.updateMaterialItem, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var _c = (0, react_1.useState)({
        name: '',
        category: '',
        stock: 0,
        location: '',
        notes: '',
    }), item = _c[0], setItem = _c[1];
    (0, react_1.useEffect)(function () {
        if (materialId) {
            var existingItem = materialItems.find(function (i) { return i.id === materialId; });
            if (existingItem) {
                setItem(existingItem);
            }
        }
    }, [materialId, materialItems]);
    var handleSave = function () {
        if (!item.name.trim()) {
            react_native_1.Alert.alert("Error", "El camp 'Nom' és obligatori.");
            return;
        }
        if (!item.category.trim()) {
            react_native_1.Alert.alert("Error", "El camp 'Categoria' és obligatori.");
            return;
        }
        var isDuplicate = materialItems.some(function (i) {
            return i.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
                i.id !== materialId;
        });
        if (isDuplicate) {
            react_native_1.Alert.alert("Error", "Ja existeix un ítem de material amb aquest nom.");
            return;
        }
        if (materialId) {
            updateMaterialItem(materialId, __assign(__assign({}, item), { name: item.name.trim(), category: item.category.trim() }));
        }
        else {
            addMaterialItem(item);
        }
        navigation.goBack();
    };
    var handleChange = function (field, value) {
        setItem(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        outerContainer: {
            flex: 1,
            backgroundColor: colors.background,
        },
        container: {
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
        },
        label: {
            fontSize: 16,
            marginBottom: 5,
            color: colors.text,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text,
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
        },
        inputMulti: {
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text,
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
            height: 100,
            textAlignVertical: 'top',
        }
    }); }, [colors]);
    return (<react_native_1.View style={dynamicStyles.outerContainer}>
      <react_native_1.ScrollView contentContainerStyle={dynamicStyles.container}>
        <react_native_1.Text style={dynamicStyles.label}>Nom</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={item.name} onChangeText={function (val) { return handleChange('name', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Categoria</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={item.category} onChangeText={function (val) { return handleChange('category', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Stock</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={String(item.stock)} onChangeText={function (val) { return handleChange('stock', parseInt(val) || 0); }} keyboardType="numeric" placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Ubicació</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={item.location} onChangeText={function (val) { return handleChange('location', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Notes</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.inputMulti} value={item.notes} onChangeText={function (val) { return handleChange('notes', val); }} multiline placeholderTextColor={colors.placeholder}/>

        <react_native_1.Button title="Desar" onPress={handleSave} color={colors.primary}/>
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
exports.default = MaterialFormScreen;
