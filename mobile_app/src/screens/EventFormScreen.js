"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EventFormScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var datetimepicker_1 = require("@react-native-community/datetimepicker");
var dateFormat_1 = require("../utils/dateFormat");
var themes_1 = require("../utils/themes");
function EventFormScreen(_a) {
    var navigation = _a.navigation, route = _a.route;
    var eventId = (route.params || {}).eventId;
    var _b = (0, dataStore_1.useDataStore)(), eventFrames = _b.eventFrames, addEventFrame = _b.addEventFrame, updateEventFrame = _b.updateEventFrame, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _c = (0, react_1.useState)(''), name = _c[0], setName = _c[1];
    var _d = (0, react_1.useState)(''), place = _d[0], setPlace = _d[1];
    var _e = (0, react_1.useState)(null), startDate = _e[0], setStartDate = _e[1];
    var _f = (0, react_1.useState)(null), endDate = _f[0], setEndDate = _f[1];
    var _g = (0, react_1.useState)(''), generalNotes = _g[0], setGeneralNotes = _g[1];
    var _h = (0, react_1.useState)({}), errors = _h[0], setErrors = _h[1];
    var _j = (0, react_1.useState)(false), showStartDatePicker = _j[0], setShowStartDatePicker = _j[1];
    var _k = (0, react_1.useState)(false), showEndDatePicker = _k[0], setShowEndDatePicker = _k[1];
    var _l = (0, react_1.useState)([]), nameSuggestions = _l[0], setNameSuggestions = _l[1];
    var _m = (0, react_1.useState)([]), placeSuggestions = _m[0], setPlaceSuggestions = _m[1];
    var isEditMode = eventId !== undefined;
    var uniqueEventNames = (0, react_1.useMemo)(function () { return Array.from(new Set(eventFrames.map(function (ef) { return ef.name; }).filter(Boolean))); }, [eventFrames]);
    var uniqueLocations = (0, react_1.useMemo)(function () { return Array.from(new Set(eventFrames.map(function (ef) { return ef.place; }).filter(Boolean))); }, [eventFrames]);
    (0, react_1.useEffect)(function () {
        if (isEditMode) {
            var eventToEdit = eventFrames.find(function (e) { return e.id === eventId; });
            if (eventToEdit) {
                setName(eventToEdit.name);
                setPlace(eventToEdit.place || '');
                setStartDate(new Date(eventToEdit.startDate));
                setEndDate(new Date(eventToEdit.endDate));
                setGeneralNotes(eventToEdit.generalNotes || '');
            }
        }
    }, [eventId, eventFrames, isEditMode]);
    var handleNameChange = function (text) {
        setName(text);
        if (text) {
            setNameSuggestions(uniqueEventNames.filter(function (n) { return n.toLowerCase().includes(text.toLowerCase()) && n !== text; }));
        }
        else {
            setNameSuggestions([]);
        }
    };
    var handlePlaceChange = function (text) {
        setPlace(text);
        if (text) {
            setPlaceSuggestions(uniqueLocations.filter(function (l) { return l.toLowerCase().includes(text.toLowerCase()) && l !== text; }));
        }
        else {
            setPlaceSuggestions([]);
        }
    };
    var validate = function () {
        var newErrors = {};
        if (!name.trim())
            newErrors.name = "El nom és obligatori.";
        if (!startDate)
            newErrors.startDate = "La data d'inici és obligatòria.";
        if (!endDate)
            newErrors.endDate = "La data de fi és obligatòria.";
        if (startDate && endDate && startDate > endDate) {
            newErrors.endDate = "La data de fi ha de ser posterior o igual a la d'inici.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    var handleSave = function (andAssign) {
        if (andAssign === void 0) { andAssign = false; }
        if (!validate()) {
            react_native_1.Alert.alert("Errors de Validació", "Si us plau, corregeix els errors abans de desar.");
            return;
        }
        var eventData = { name: name, place: place, startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], generalNotes: generalNotes };
        var savedEventId = eventId;
        if (isEditMode) {
            updateEventFrame(eventId, eventData);
        }
        else {
            var newEvent = addEventFrame(eventData);
            savedEventId = newEvent.id;
        }
        if (andAssign) {
            navigation.replace('AssignmentForm', { eventFrameId: savedEventId });
        }
        else {
            navigation.goBack();
        }
    };
    var onStartDateChange = function (event, selectedDate) {
        setShowStartDatePicker(react_native_1.Platform.OS === 'ios');
        if (selectedDate)
            setStartDate(selectedDate);
    };
    var onEndDateChange = function (event, selectedDate) {
        setShowEndDatePicker(react_native_1.Platform.OS === 'ios');
        if (selectedDate)
            setEndDate(selectedDate);
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        formContainer: {
            padding: 20,
        },
        label: {
            fontSize: 16,
            marginBottom: 8,
            color: colors.text,
            fontWeight: '500',
        },
        input: {
            backgroundColor: colors.card,
            color: colors.text,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            marginBottom: 5,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
        },
        inputError: {
            borderColor: '#F44336',
        },
        errorText: {
            color: '#F44336',
            marginBottom: 20,
            marginLeft: 5,
        },
        inputMulti: {
            backgroundColor: colors.card,
            color: colors.text,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
            height: 100,
            textAlignVertical: 'top',
        },
        buttonContainer: {
            marginTop: 10,
        },
        suggestionsContainer: {
            backgroundColor: colors.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
        },
        suggestionItem: {
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        suggestionText: {
            color: colors.text,
        },
        dateText: {
            color: colors.text,
        }
    }); }, [colors]);
    return (<react_native_1.SafeAreaView style={dynamicStyles.container}>
      <react_native_1.ScrollView contentContainerStyle={dynamicStyles.formContainer} keyboardShouldPersistTaps="handled">
        <react_native_1.Text style={dynamicStyles.label}>Nom de l'Esdeveniment</react_native_1.Text>
        <react_native_1.TextInput style={[dynamicStyles.input, errors.name ? dynamicStyles.inputError : null]} value={name} onChangeText={handleNameChange} placeholder="Ex: Concert de Primavera" placeholderTextColor={colors.placeholder} onFocus={function () { return setPlaceSuggestions([]); }}/>
        {nameSuggestions.length > 0 && (<react_native_1.View style={dynamicStyles.suggestionsContainer}>
            {nameSuggestions.map(function (item) { return (<react_native_1.TouchableOpacity key={item} style={dynamicStyles.suggestionItem} onPress={function () { setName(item); setNameSuggestions([]); }}>
                <react_native_1.Text style={dynamicStyles.suggestionText}>{item}</react_native_1.Text>
              </react_native_1.TouchableOpacity>); })}
          </react_native_1.View>)}
        {errors.name && <react_native_1.Text style={dynamicStyles.errorText}>{errors.name}</react_native_1.Text>}

        <react_native_1.Text style={dynamicStyles.label}>Lloc</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.input} value={place} onChangeText={handlePlaceChange} placeholder="Ex: Teatre Principal" placeholderTextColor={colors.placeholder} onFocus={function () { return setNameSuggestions([]); }}/>
        {placeSuggestions.length > 0 && (<react_native_1.View style={dynamicStyles.suggestionsContainer}>
            {placeSuggestions.map(function (item) { return (<react_native_1.TouchableOpacity key={item} style={dynamicStyles.suggestionItem} onPress={function () { setPlace(item); setPlaceSuggestions([]); }}>
                <react_native_1.Text style={dynamicStyles.suggestionText}>{item}</react_native_1.Text>
              </react_native_1.TouchableOpacity>); })}
          </react_native_1.View>)}

        <react_native_1.View>
          <react_native_1.Text style={dynamicStyles.label}>Data d'Inici</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={function () { return setShowStartDatePicker(true); }} style={[dynamicStyles.input, errors.startDate ? dynamicStyles.inputError : null]}>
            <react_native_1.Text style={dynamicStyles.dateText}>{startDate ? (0, dateFormat_1.formatDateDMY)(startDate.toISOString()) : 'Selecciona una data'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {showStartDatePicker && (<datetimepicker_1.default themeVariant={theme} value={startDate || new Date()} mode="date" display="default" onChange={onStartDateChange}/>)}
          {errors.startDate && <react_native_1.Text style={dynamicStyles.errorText}>{errors.startDate}</react_native_1.Text>}
        </react_native_1.View>

        <react_native_1.View>
          <react_native_1.Text style={dynamicStyles.label}>Data de Fi</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={function () { return setShowEndDatePicker(true); }} style={[dynamicStyles.input, errors.endDate ? dynamicStyles.inputError : null]}>
            <react_native_1.Text style={dynamicStyles.dateText}>{endDate ? (0, dateFormat_1.formatDateDMY)(endDate.toISOString()) : 'Selecciona una data'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {showEndDatePicker && (<datetimepicker_1.default themeVariant={theme} value={endDate || startDate || new Date()} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined}/>)}
          {errors.endDate && <react_native_1.Text style={dynamicStyles.errorText}>{errors.endDate}</react_native_1.Text>}
        </react_native_1.View>

        <react_native_1.Text style={dynamicStyles.label}>Notes Generals</react_native_1.Text>
        <react_native_1.TextInput style={dynamicStyles.inputMulti} value={generalNotes} onChangeText={setGeneralNotes} placeholder="Anotacions diverses..." placeholderTextColor={colors.placeholder} multiline numberOfLines={4} onFocus={function () { setNameSuggestions([]); setPlaceSuggestions([]); }}/>
        <react_native_1.View style={dynamicStyles.buttonContainer}>
            <react_native_1.Button title={isEditMode ? 'Actualitzar' : 'Crear'} onPress={function () { return handleSave(false); }} color={colors.primary}/>
            <react_native_1.View style={{ marginTop: 10 }}/>
            <react_native_1.Button title={isEditMode ? 'Actualitzar i Assignar' : 'Crear i Assignar'} onPress={function () { return handleSave(true); }} color={colors.primary}/>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
