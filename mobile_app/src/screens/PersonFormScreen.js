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
var PersonFormScreen = function (_a) {
    var navigation = _a.navigation, route = _a.route;
    var personId = route.params.personId;
    var _b = (0, dataStore_1.useDataStore)(), peopleGroups = _b.peopleGroups, addPersonGroup = _b.addPersonGroup, updatePersonGroup = _b.updatePersonGroup, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var _c = (0, react_1.useState)({
        name: '',
        role: '',
        tel1: '',
        tel2: '',
        email: '',
        web: '',
        notes: '',
    }), person = _c[0], setPerson = _c[1];
    (0, react_1.useEffect)(function () {
        if (personId) {
            var existingPerson = peopleGroups.find(function (p) { return p.id === personId; });
            if (existingPerson) {
                setPerson(existingPerson);
            }
        }
    }, [personId, peopleGroups]);
    var handleSave = function () {
        if (!person.name.trim()) {
            react_native_1.Alert.alert("Error", "El camp 'Nom' és obligatori.");
            return;
        }
        var isDuplicate = peopleGroups.some(function (pg) {
            return pg.name.trim().toLowerCase() === person.name.trim().toLowerCase() &&
                pg.id !== personId;
        });
        if (isDuplicate) {
            react_native_1.Alert.alert("Error", "Ja existeix un contacte amb aquest nom.");
            return;
        }
        if (personId) {
            updatePersonGroup(personId, person);
        }
        else {
            addPersonGroup(person);
        }
        navigation.goBack();
    };
    var handleChange = function (field, value) {
        setPerson(function (prev) {
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
        <react_native_1.TextInput style={dynamicStyles.input} value={person.name} onChangeText={function (val) { return handleChange('name', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Rol</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={person.role} onChangeText={function (val) { return handleChange('role', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Telèfon 1</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={person.tel1} onChangeText={function (val) { return handleChange('tel1', val); }} keyboardType="phone-pad" placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Telèfon 2</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={person.tel2} onChangeText={function (val) { return handleChange('tel2', val); }} keyboardType="phone-pad" placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Email</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={person.email} onChangeText={function (val) { return handleChange('email', val); }} keyboardType="email-address" placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Web</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={person.web} onChangeText={function (val) { return handleChange('web', val); }} placeholderTextColor={colors.placeholder}/>

        <react_native_1.Text style={dynamicStyles.label}>Notes</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.inputMulti} value={person.notes} onChangeText={function (val) { return handleChange('notes', val); }} multiline placeholderTextColor={colors.placeholder}/>

        <react_native_1.Button title="Desar" onPress={handleSave} color={colors.primary}/>
      </react_native_1.ScrollView>
    </react_native_1.View>);
};
exports.default = PersonFormScreen;
