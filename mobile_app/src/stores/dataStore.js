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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.selectMaterialControlData = exports.selectAvailableOrigins = exports.useDataStore = void 0;
var zustand_1 = require("zustand");
var immer_1 = require("zustand/middleware/immer");
require("react-native-get-random-values");
var uuid_1 = require("uuid");
var SecureStore = require("expo-secure-store");
var types_1 = require("../types");
var SAFFileService_1 = require("../services/SAFFileService");
var fileService = new SAFFileService_1.SAFFileService();
var THEME_KEY = 'app_theme';
exports.useDataStore = (0, zustand_1.create)()((0, immer_1.immer)(function (set, get) { return ({
    fileUri: null,
    fileName: null,
    eventFrames: [],
    peopleGroups: [],
    materialItems: [],
    hasUnsavedChanges: false,
    isLoading: false,
    error: null,
    theme: 'light',
    isThemeLoading: true,
    init: function () { return __awaiter(void 0, void 0, void 0, function () {
        var savedTheme, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, SecureStore.getItemAsync(THEME_KEY)];
                case 1:
                    savedTheme = _a.sent();
                    if (savedTheme === 'light' || savedTheme === 'dark') {
                        set({ theme: savedTheme, isThemeLoading: false });
                    }
                    else {
                        set({ isThemeLoading: false });
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("Failed to load theme from secure store", error_1);
                    set({ isThemeLoading: false });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    toggleTheme: function () { return __awaiter(void 0, void 0, void 0, function () {
        var newTheme, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newTheme = get().theme === 'light' ? 'dark' : 'light';
                    set({ theme: newTheme });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, SecureStore.setItemAsync(THEME_KEY, newTheme)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Failed to save theme to secure store", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    setData: function (data, name, uri) {
        set({ isLoading: true, error: null });
        try {
            var hydratedEventFrames = data.eventFrames.map(function (frame) { return (__assign(__assign({}, frame), { assignments: data.assignments.filter(function (a) { return a.eventFrameId === frame.id; }) || [] })); });
            set({
                eventFrames: hydratedEventFrames,
                peopleGroups: data.peopleGroups,
                materialItems: data.materialItems || [],
                fileName: name,
                fileUri: uri,
                hasUnsavedChanges: false,
                isLoading: false,
            });
        }
        catch (err) {
            set({ error: "Error en processar les dades.", isLoading: false });
        }
    },
    clearData: function () {
        set({
            eventFrames: [],
            peopleGroups: [],
            materialItems: [],
            fileName: null,
            fileUri: null,
            hasUnsavedChanges: false,
        });
    },
    saveFileAs: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, fileName, eventFrames, peopleGroups, materialItems, allAssignments, eventFramesForExport, dataToSave, jsonString, result, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = get(), fileName = _a.fileName, eventFrames = _a.eventFrames, peopleGroups = _a.peopleGroups, materialItems = _a.materialItems;
                    set({ isLoading: true, error: null });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    allAssignments = eventFrames.flatMap(function (frame) { return frame.assignments || []; });
                    eventFramesForExport = eventFrames.map(function (_a) {
                        var assignments = _a.assignments, rest = __rest(_a, ["assignments"]);
                        return rest;
                    });
                    dataToSave = {
                        eventFrames: eventFramesForExport,
                        peopleGroups: peopleGroups,
                        assignments: allAssignments,
                        materialItems: materialItems,
                    };
                    jsonString = JSON.stringify(dataToSave, null, 2);
                    return [4 /*yield*/, fileService.saveFileAs(jsonString, fileName || 'dades.gep')];
                case 2:
                    result = _b.sent();
                    if (result) {
                        set({
                            fileUri: result.uri,
                            fileName: result.name,
                            hasUnsavedChanges: false,
                            isLoading: false,
                        });
                    }
                    else {
                        set({ isLoading: false });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    set({ error: "No s'ha pogut desar el fitxer.", isLoading: false });
                    throw err_1;
                case 4: return [2 /*return*/];
            }
        });
    }); },
    shareFile: function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, fileName, eventFrames, peopleGroups, materialItems, allAssignments, eventFramesForExport, dataToSave, jsonString, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = get(), fileName = _a.fileName, eventFrames = _a.eventFrames, peopleGroups = _a.peopleGroups, materialItems = _a.materialItems;
                    set({ isLoading: true, error: null });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    allAssignments = eventFrames.flatMap(function (frame) { return frame.assignments || []; });
                    eventFramesForExport = eventFrames.map(function (_a) {
                        var assignments = _a.assignments, rest = __rest(_a, ["assignments"]);
                        return rest;
                    });
                    dataToSave = {
                        eventFrames: eventFramesForExport,
                        peopleGroups: peopleGroups,
                        assignments: allAssignments,
                        materialItems: materialItems,
                    };
                    jsonString = JSON.stringify(dataToSave, null, 2);
                    return [4 /*yield*/, fileService.shareFile(jsonString, fileName || 'dades.gep')];
                case 2:
                    _b.sent();
                    set({
                        hasUnsavedChanges: false,
                        isLoading: false,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _b.sent();
                    set({ error: "No s'ha pogut compartir el fitxer.", isLoading: false });
                    throw err_2;
                case 4: return [2 /*return*/];
            }
        });
    }); },
    addEventFrame: function (data) {
        var newEvent = __assign(__assign({}, data), { id: (0, uuid_1.v4)(), assignments: [], personnelComplete: false });
        set(function (state) { return ({
            eventFrames: __spreadArray(__spreadArray([], state.eventFrames, true), [newEvent], false),
            hasUnsavedChanges: true,
        }); });
        return newEvent;
    },
    updateEventFrame: function (eventId, data) {
        set(function (state) {
            var eventIndex = state.eventFrames.findIndex(function (event) { return event.id === eventId; });
            if (eventIndex !== -1) {
                state.eventFrames[eventIndex] = __assign(__assign({}, state.eventFrames[eventIndex]), data);
                state.hasUnsavedChanges = true;
            }
        });
    },
    deleteEventFrame: function (eventId) {
        set(function (state) { return ({
            eventFrames: state.eventFrames.filter(function (event) { return event.id !== eventId; }),
            hasUnsavedChanges: true,
        }); });
    },
    // PersonGroup CRUD
    addPersonGroup: function (data) {
        var newPerson = __assign(__assign({}, data), { id: (0, uuid_1.v4)() });
        set(function (state) { return ({
            peopleGroups: __spreadArray(__spreadArray([], state.peopleGroups, true), [newPerson], false),
            hasUnsavedChanges: true,
        }); });
    },
    updatePersonGroup: function (personId, data) {
        set(function (state) { return ({
            peopleGroups: state.peopleGroups.map(function (person) {
                return person.id === personId ? __assign(__assign({}, person), data) : person;
            }),
            hasUnsavedChanges: true,
        }); });
    },
    deletePersonGroup: function (personId) {
        set(function (state) { return ({
            peopleGroups: state.peopleGroups.filter(function (person) { return person.id !== personId; }),
            hasUnsavedChanges: true,
        }); });
    },
    // MaterialItem CRUD
    addMaterialItem: function (data) {
        var newItem = __assign(__assign({}, data), { id: (0, uuid_1.v4)() });
        set(function (state) { return ({
            materialItems: __spreadArray(__spreadArray([], state.materialItems, true), [newItem], false),
            hasUnsavedChanges: true,
        }); });
    },
    updateMaterialItem: function (itemId, data) {
        set(function (state) { return ({
            materialItems: state.materialItems.map(function (item) {
                return item.id === itemId ? __assign(__assign({}, item), data) : item;
            }),
            hasUnsavedChanges: true,
        }); });
    },
    deleteMaterialItem: function (itemId) {
        set(function (state) { return ({
            materialItems: state.materialItems.filter(function (item) { return item.id !== itemId; }),
            hasUnsavedChanges: true,
        }); });
    },
    // Assignment CRUD
    addAssignment: function (eventFrameId_1, data_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([eventFrameId_1, data_1], args_1, true), void 0, function (eventFrameId, data, force) {
            var eventFrames, newStart, newEnd, _a, eventFrames_1, event_1, _b, _c, existing, existingStart, existingEnd, newAssignment;
            if (force === void 0) { force = false; }
            return __generator(this, function (_d) {
                if (!force) {
                    eventFrames = get().eventFrames;
                    newStart = new Date(data.startDate);
                    newEnd = new Date(data.endDate);
                    for (_a = 0, eventFrames_1 = eventFrames; _a < eventFrames_1.length; _a++) {
                        event_1 = eventFrames_1[_a];
                        for (_b = 0, _c = event_1.assignments; _b < _c.length; _b++) {
                            existing = _c[_b];
                            if (existing.personGroupId === data.personGroupId) {
                                existingStart = new Date(existing.startDate);
                                existingEnd = new Date(existing.endDate);
                                if (newStart <= existingEnd && newEnd >= existingStart) {
                                    return [2 /*return*/, "Conflicte detectat: La persona ja est\u00E0 assignada a '".concat(event_1.name, "' en aquestes dates.")];
                                }
                            }
                        }
                    }
                }
                newAssignment = __assign(__assign({}, data), { id: (0, uuid_1.v4)() });
                set(function (state) { return ({
                    eventFrames: state.eventFrames.map(function (ef) {
                        return ef.id === eventFrameId
                            ? __assign(__assign({}, ef), { assignments: __spreadArray(__spreadArray([], ef.assignments, true), [newAssignment], false) }) : ef;
                    }),
                    hasUnsavedChanges: true,
                }); });
                return [2 /*return*/, null];
            });
        });
    },
    updateAssignment: function (eventFrameId_1, assignmentId_1, data_1) {
        var args_1 = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args_1[_i - 3] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([eventFrameId_1, assignmentId_1, data_1], args_1, true), void 0, function (eventFrameId, assignmentId, data, force) {
            var eventFrames, originalAssignment, newStart, newEnd, personGroupId, _a, eventFrames_2, event_2, _b, _c, existing, existingStart, existingEnd;
            if (force === void 0) { force = false; }
            return __generator(this, function (_d) {
                if (!force) {
                    eventFrames = get().eventFrames;
                    originalAssignment = eventFrames.flatMap(function (ef) { return ef.assignments; }).find(function (a) { return a.id === assignmentId; });
                    if (originalAssignment) {
                        newStart = new Date(data.startDate || originalAssignment.startDate);
                        newEnd = new Date(data.endDate || originalAssignment.endDate);
                        personGroupId = data.personGroupId || originalAssignment.personGroupId;
                        for (_a = 0, eventFrames_2 = eventFrames; _a < eventFrames_2.length; _a++) {
                            event_2 = eventFrames_2[_a];
                            for (_b = 0, _c = event_2.assignments; _b < _c.length; _b++) {
                                existing = _c[_b];
                                if (existing.id !== assignmentId && existing.personGroupId === personGroupId) {
                                    existingStart = new Date(existing.startDate);
                                    existingEnd = new Date(existing.endDate);
                                    if (newStart <= existingEnd && newEnd >= existingStart) {
                                        return [2 /*return*/, "Conflicte detectat: La persona ja est\u00E0 assignada a '".concat(event_2.name, "' en aquestes dates.")];
                                    }
                                }
                            }
                        }
                    }
                }
                set(function (state) {
                    var eventIndex = state.eventFrames.findIndex(function (ef) { return ef.id === eventFrameId; });
                    if (eventIndex !== -1) {
                        var assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(function (a) { return a.id === assignmentId; });
                        if (assignmentIndex !== -1) {
                            var originalAssignment = state.eventFrames[eventIndex].assignments[assignmentIndex];
                            // Create the updated assignment object
                            var updatedAssignment = __assign(__assign({}, originalAssignment), data);
                            // If the original status was Mixed and the new status is different, clear dailyStatuses
                            if (originalAssignment.status === types_1.AssignmentStatus.Mixed && data.status && data.status !== types_1.AssignmentStatus.Mixed) {
                                updatedAssignment.dailyStatuses = {};
                            }
                            // If daily statuses are being provided, calculate the overall status
                            if (data.dailyStatuses) {
                                var statuses = Object.values(data.dailyStatuses);
                                var uniqueStatuses = new Set(statuses);
                                if (uniqueStatuses.size === 1) {
                                    updatedAssignment.status = statuses[0];
                                }
                                else {
                                    updatedAssignment.status = types_1.AssignmentStatus.Mixed;
                                }
                            }
                            state.eventFrames[eventIndex].assignments[assignmentIndex] = updatedAssignment;
                            state.hasUnsavedChanges = true;
                        }
                    }
                });
                return [2 /*return*/, null];
            });
        });
    },
    deleteAssignment: function (eventFrameId, assignmentId) {
        set(function (state) { return ({
            eventFrames: state.eventFrames.map(function (ef) {
                if (ef.id === eventFrameId) {
                    return __assign(__assign({}, ef), { assignments: ef.assignments.filter(function (a) { return a.id !== assignmentId; }) });
                }
                return ef;
            }),
            hasUnsavedChanges: true,
        }); });
    },
    updateDailyAssignmentStatus: function (eventFrameId, assignmentId, date, status) {
        set(function (state) {
            var eventIndex = state.eventFrames.findIndex(function (ef) { return ef.id === eventFrameId; });
            if (eventIndex === -1)
                return;
            var assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(function (a) { return a.id === assignmentId; });
            if (assignmentIndex === -1)
                return;
            var assignment = state.eventFrames[eventIndex].assignments[assignmentIndex];
            if (!assignment.dailyStatuses) {
                assignment.dailyStatuses = {};
            }
            assignment.dailyStatuses[date] = status;
            // Determine the new overall status
            var dayStatuses = Object.values(assignment.dailyStatuses).filter(Boolean);
            if (dayStatuses.length > 0) {
                var uniqueStatuses = new Set(dayStatuses);
                if (uniqueStatuses.size === 1) {
                    // If there's only one unique status, all statuses in the array are the same.
                    // We can safely take the first one.
                    assignment.status = dayStatuses[0];
                }
                else {
                    assignment.status = types_1.AssignmentStatus.Mixed;
                }
            }
            else {
                // If all daily statuses are cleared, revert to Pending
                assignment.status = types_1.AssignmentStatus.Pending;
            }
            state.hasUnsavedChanges = true;
        });
    },
    setAllDaysAssignmentStatus: function (eventFrameId, assignmentId, status) {
        set(function (state) {
            var eventIndex = state.eventFrames.findIndex(function (ef) { return ef.id === eventFrameId; });
            if (eventIndex === -1)
                return;
            var assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(function (a) { return a.id === assignmentId; });
            if (assignmentIndex === -1)
                return;
            var assignment = state.eventFrames[eventIndex].assignments[assignmentIndex];
            // No fem res si l'estat és Mixt, ja que no té sentit aplicar-lo a tots els dies
            if (status === types_1.AssignmentStatus.Mixed)
                return;
            assignment.status = status;
            // Esborrem els estats diaris per assegurar consistència.
            // La UI s'encarregarà de mostrar l'estat general per a cada dia.
            assignment.dailyStatuses = {};
            state.hasUnsavedChanges = true;
        });
    },
}); }));
// --- Selectors ---
var selectAvailableOrigins = function (state) {
    var origins = new Set(state.materialItems.map(function (item) { return item.location; }));
    return Array.from(origins).sort(function (a, b) { return a.localeCompare(b); });
};
exports.selectAvailableOrigins = selectAvailableOrigins;
var selectMaterialControlData = function (state, filters) {
    var dateRange = filters.dateRange, searchText = filters.searchText;
    var materialItems = state.materialItems, eventFrames = state.eventFrames;
    var selectedEventIds = filters.selectedEventIds ? [filters.selectedEventIds] : [];
    var selectedOrigins = filters.selectedOrigins ? [filters.selectedOrigins] : [];
    var selectedCategories = filters.selectedCategories ? [filters.selectedCategories] : [];
    var isPeakDemandActive = (selectedEventIds.length > 0) || (dateRange && (dateRange.start || dateRange.end));
    if (!isPeakDemandActive) {
        var allRows = materialItems.map(function (item) { return ({
            item: item,
            totalDemand: 0,
            balance: item.stock,
            breakdown: [],
        }); });
        return allRows.filter(function (row) {
            if (selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location))
                return false;
            if (selectedCategories.length > 0 && !selectedCategories.includes(row.item.category))
                return false;
            if (searchText && searchText.trim()) {
                var lowerCaseSearch = searchText.toLowerCase();
                return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
                    row.item.category.toLowerCase().includes(lowerCaseSearch) ||
                    row.item.location.toLowerCase().includes(lowerCaseSearch);
            }
            return true;
        });
    }
    var relevantEvents = eventFrames;
    if (selectedEventIds.length > 0) {
        var eventIdSet_1 = new Set(selectedEventIds);
        relevantEvents = eventFrames.filter(function (ef) { return eventIdSet_1.has(ef.id); });
    }
    else if (dateRange && (dateRange.start || dateRange.end)) {
        relevantEvents = eventFrames.filter(function (event) {
            var eventStart = new Date(event.startDate);
            var eventEnd = new Date(event.endDate);
            var filterStart = dateRange.start ? new Date(dateRange.start) : null;
            var filterEnd = dateRange.end ? new Date(dateRange.end) : null;
            if (filterStart && eventEnd < filterStart)
                return false;
            if (filterEnd) {
                var inclusiveFilterEnd = new Date(filterEnd);
                inclusiveFilterEnd.setDate(inclusiveFilterEnd.getDate() + 1);
                if (eventStart >= inclusiveFilterEnd)
                    return false;
            }
            return true;
        });
    }
    var allNeeds = [];
    relevantEvents.forEach(function (event) {
        if (!event.techSheet)
            return;
        var needsKeys = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
        needsKeys.forEach(function (key) {
            var section = event.techSheet[key];
            if (section && section.status === 'yes' && 'data' in section && section.data && Array.isArray(section.data.needs)) {
                section.data.needs.forEach(function (need) {
                    if (need.materialItemId && need.quantity) {
                        var numericQuantity = Number(need.quantity);
                        if (!isNaN(numericQuantity) && numericQuantity > 0) {
                            allNeeds.push({ itemId: need.materialItemId, quantity: numericQuantity, event: event });
                        }
                    }
                });
            }
        });
    });
    var resultRows = materialItems.map(function (item) {
        var itemNeeds = allNeeds.filter(function (need) { return need.itemId === item.id; });
        if (itemNeeds.length === 0) {
            return { item: item, totalDemand: 0, balance: item.stock, breakdown: [] };
        }
        var allDates = itemNeeds.flatMap(function (need) { return [new Date(need.event.startDate), new Date(need.event.endDate)]; });
        var minDate = new Date(Math.min.apply(null, allDates.map(function (d) { return d.getTime(); })));
        var maxDate = new Date(Math.max.apply(null, allDates.map(function (d) { return d.getTime(); })));
        var peakDemand = 0;
        var _loop_1 = function (d) {
            var dailyDemand = 0;
            itemNeeds.forEach(function (need) {
                var eventStart = new Date(need.event.startDate);
                var eventEnd = new Date(need.event.endDate);
                if (d >= eventStart && d <= eventEnd) {
                    dailyDemand += need.quantity;
                }
            });
            if (dailyDemand > peakDemand) {
                peakDemand = dailyDemand;
            }
        };
        for (var d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            _loop_1(d);
        }
        var breakdown = itemNeeds.map(function (need) { return ({
            eventFrameId: need.event.id,
            eventName: need.event.name,
            quantity: need.quantity,
            startDate: need.event.startDate,
            endDate: need.event.endDate,
        }); });
        return {
            item: item,
            totalDemand: peakDemand,
            balance: item.stock - peakDemand,
            breakdown: breakdown,
        };
    });
    return resultRows.filter(function (row) {
        if (row.totalDemand === 0 && selectedEventIds.length > 0) {
            return false;
        }
        if (selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location))
            return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(row.item.category))
            return false;
        if (searchText && searchText.trim()) {
            var lowerCaseSearch = searchText.toLowerCase();
            return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
                row.item.category.toLowerCase().includes(lowerCaseSearch) ||
                row.item.location.toLowerCase().includes(lowerCaseSearch);
        }
        return true;
    });
};
exports.selectMaterialControlData = selectMaterialControlData;
