"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var dataStore_1 = require("../stores/dataStore");
var types_1 = require("../types");
var CustomSelect_1 = require("../components/CustomSelect");
var dateFormat_1 = require("../utils/dateFormat");
var datetimepicker_1 = require("@react-native-community/datetimepicker");
var themes_1 = require("../utils/themes");
var AssignmentFormScreen = function (_a) {
    var navigation = _a.navigation, route = _a.route;
    var _b = route.params, eventFrameId = _b.eventFrameId, assignmentId = _b.assignmentId;
    var _c = (0, dataStore_1.useDataStore)(), eventFrames = _c.eventFrames, peopleGroups = _c.peopleGroups, addAssignment = _c.addAssignment, updateAssignment = _c.updateAssignment, theme = _c.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var event = eventFrames.find(function (ef) { return ef.id === eventFrameId; });
    var originalAssignment = event === null || event === void 0 ? void 0 : event.assignments.find(function (a) { return a.id === assignmentId; });
    var _d = (0, react_1.useState)(''), personGroupId = _d[0], setPersonGroupId = _d[1];
    var _e = (0, react_1.useState)(''), role = _e[0], setRole = _e[1];
    var _f = (0, react_1.useState)(event ? new Date(event.startDate) : null), startDate = _f[0], setStartDate = _f[1];
    var _g = (0, react_1.useState)(event ? new Date(event.endDate) : null), endDate = _g[0], setEndDate = _g[1];
    var _h = (0, react_1.useState)(types_1.AssignmentStatus.Pending), status = _h[0], setStatus = _h[1];
    var _j = (0, react_1.useState)(''), notes = _j[0], setNotes = _j[1];
    var _k = (0, react_1.useState)({}), errors = _k[0], setErrors = _k[1];
    var _l = (0, react_1.useState)(false), showStartDatePicker = _l[0], setShowStartDatePicker = _l[1];
    var _m = (0, react_1.useState)(false), showEndDatePicker = _m[0], setShowEndDatePicker = _m[1];
    (0, react_1.useEffect)(function () {
        if (originalAssignment) {
            setPersonGroupId(originalAssignment.personGroupId);
            setRole(originalAssignment.role || '');
            setStartDate(new Date(originalAssignment.startDate));
            setEndDate(new Date(originalAssignment.endDate));
            setStatus(originalAssignment.status);
            setNotes(originalAssignment.notes || '');
        }
    }, [eventFrameId, assignmentId, originalAssignment]);
    var handlePersonChange = function (newPersonGroupId) {
        setPersonGroupId(newPersonGroupId);
        var selectedPerson = peopleGroups.find(function (p) { return p.id === newPersonGroupId; });
        if ((selectedPerson === null || selectedPerson === void 0 ? void 0 : selectedPerson.role) && role === '') {
            setRole(selectedPerson.role);
        }
    };
    var validate = function () {
        var newErrors = {};
        if (!personGroupId)
            newErrors.personGroupId = "Cal seleccionar una persona o grup.";
        if (!startDate)
            newErrors.startDate = "La data d'inici és obligatòria.";
        if (!endDate)
            newErrors.endDate = "La data de fi és obligatòria.";
        if (startDate && endDate) {
            if (startDate > endDate) {
                newErrors.endDate = "La data de fi no pot ser anterior a la d'inici.";
            }
            if (event) {
                var eventStart = new Date(event.startDate);
                var eventEnd = new Date(event.endDate);
                if (startDate < eventStart || endDate > eventEnd) {
                    newErrors.datesRange = "Les dates han d'estar dins del rang de l'esdeveniment (".concat((0, dateFormat_1.formatDateDMY)(event.startDate), " - ").concat((0, dateFormat_1.formatDateDMY)(event.endDate), ").");
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    var performSave = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (force) {
            var assignmentData, conflictMessage;
            if (force === void 0) { force = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validate()) {
                            react_native_1.Alert.alert("Errors de Validació", "Si us plau, corregeix els errors abans de desar.");
                            return [2 /*return*/];
                        }
                        assignmentData = {
                            personGroupId: personGroupId,
                            eventFrameId: eventFrameId,
                            startDate: startDate.toISOString().split('T')[0],
                            endDate: endDate.toISOString().split('T')[0],
                            status: status,
                            notes: notes,
                            role: role,
                        };
                        conflictMessage = null;
                        if (!assignmentId) return [3 /*break*/, 2];
                        return [4 /*yield*/, updateAssignment(eventFrameId, assignmentId, assignmentData, force)];
                    case 1:
                        conflictMessage = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, addAssignment(eventFrameId, assignmentData, force)];
                    case 3:
                        conflictMessage = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (conflictMessage) {
                            react_native_1.Alert.alert("Conflicte d'Assignació", conflictMessage, [
                                { text: "Cancel·lar", style: "cancel" },
                                { text: "Desar Igualment", onPress: function () { return performSave(true); } }
                            ]);
                        }
                        else {
                            navigation.goBack();
                        }
                        return [2 /*return*/];
                }
            });
        });
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
        contentContainer: {
            padding: 20,
            paddingBottom: 60,
        },
        label: {
            fontSize: 16,
            marginBottom: 8,
            color: colors.text,
            fontWeight: '500',
        },
        input: {
            backgroundColor: colors.card,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            color: colors.text,
        },
        dateText: {
            color: colors.text,
        },
        inputError: {
            borderColor: '#F44336',
        },
        errorText: {
            color: '#F44336',
            marginBottom: 15,
            marginLeft: 5,
        },
        pickerContainer: {
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
        },
        picker: {
            color: colors.text,
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
        text: {
            color: colors.text,
        }
    }); }, [colors]);
    var peopleOptions = __spreadArray([{ label: '-- Seleccioneu --', value: '' }], peopleGroups.map(function (pg) { return ({ label: pg.name, value: pg.id }); }), true);
    var statusOptions = Object.values(types_1.AssignmentStatus).map(function (s) { return ({ label: s, value: s }); });
    if (!event) {
        return <react_native_1.View style={dynamicStyles.container}><react_native_1.Text style={dynamicStyles.text}>No s'ha trobat l'esdeveniment pare.</react_native_1.Text></react_native_1.View>;
    }
    return (<react_native_1.ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>

      <react_native_1.Text style={dynamicStyles.label}>Persona/Grup</react_native_1.Text>
      <react_native_1.View style={[dynamicStyles.pickerContainer, errors.personGroupId ? dynamicStyles.inputError : null]}>
        <CustomSelect_1.default value={personGroupId} onValueChange={handlePersonChange} options={peopleOptions} placeholder="-- Seleccioneu --" containerStyle={{}}/>
      </react_native_1.View>
      {errors.personGroupId && <react_native_1.Text style={dynamicStyles.errorText}>{errors.personGroupId}</react_native_1.Text>}

      <react_native_1.Text style={dynamicStyles.label}>Rol (Opcional)</react_native_1.Text>
      <react_native_1.TextInput style={dynamicStyles.input} value={role} onChangeText={setRole} placeholder="Especifica el rol..." placeholderTextColor={colors.placeholder}/>

      <react_native_1.View>
          <react_native_1.Text style={dynamicStyles.label}>Data d'Inici</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={function () { return setShowStartDatePicker(true); }} style={[dynamicStyles.input, errors.startDate || errors.datesRange ? dynamicStyles.inputError : null]}>
            <react_native_1.Text style={dynamicStyles.dateText}>{startDate ? (0, dateFormat_1.formatDateDMY)(startDate.toISOString()) : 'Selecciona una data'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {showStartDatePicker && (<datetimepicker_1.default themeVariant={theme} value={startDate || new Date(event.startDate)} mode="date" display="default" onChange={onStartDateChange}/>)}
          {errors.startDate && <react_native_1.Text style={dynamicStyles.errorText}>{errors.startDate}</react_native_1.Text>}
        </react_native_1.View>

        <react_native_1.View>
          <react_native_1.Text style={dynamicStyles.label}>Data de Fi</react_native_1.Text>
          <react_native_1.TouchableOpacity onPress={function () { return setShowEndDatePicker(true); }} style={[dynamicStyles.input, errors.endDate || errors.datesRange ? dynamicStyles.inputError : null]}>
            <react_native_1.Text style={dynamicStyles.dateText}>{endDate ? (0, dateFormat_1.formatDateDMY)(endDate.toISOString()) : 'Selecciona una data'}</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          {showEndDatePicker && (<datetimepicker_1.default themeVariant={theme} value={endDate || startDate || new Date(event.endDate)} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined}/>)}
          {errors.endDate && <react_native_1.Text style={dynamicStyles.errorText}>{errors.endDate}</react_native_1.Text>}
        </react_native_1.View>
        {errors.datesRange && <react_native_1.Text style={dynamicStyles.errorText}>{errors.datesRange}</react_native_1.Text>}

      <react_native_1.Text style={dynamicStyles.label}>Estat General</react_native_1.Text>
      <react_native_1.View style={dynamicStyles.pickerContainer}>
          <CustomSelect_1.default value={status} onValueChange={function (val) { return setStatus(val); }} options={statusOptions} placeholder="-- Seleccioneu --"/>
      </react_native_1.View>

      <react_native_1.Text style={dynamicStyles.label}>Notes</react_native_1.Text>
      <react_native_1.TextInput style={dynamicStyles.inputMulti} value={notes} onChangeText={setNotes} multiline placeholderTextColor={colors.placeholder}/>

      <react_native_1.Button title={assignmentId ? "Desar Canvis" : "Crear Assignació"} onPress={function () { return performSave(false); }} color={colors.primary}/>
    </react_native_1.ScrollView>);
};
exports.default = AssignmentFormScreen;
