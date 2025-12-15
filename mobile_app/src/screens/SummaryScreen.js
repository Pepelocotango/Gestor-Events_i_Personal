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
var dataStore_1 = require("../stores/dataStore");
var types_1 = require("../types");
var dateFormat_1 = require("../utils/dateFormat");
var SummarySection_1 = require("../components/SummarySection");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var themes_1 = require("../utils/themes");
var SECTION_KEYS = ['event', 'date', 'person'];
var SummaryScreen = function () {
    var _a = (0, dataStore_1.useDataStore)(), eventFrames = _a.eventFrames, peopleGroups = _a.peopleGroups, theme = _a.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _b = (0, react_1.useState)('desc'), sortOrder = _b[0], setSortOrder = _b[1];
    var _c = (0, react_1.useState)({}), expandedSections = _c[0], setExpandedSections = _c[1];
    var peopleMap = (0, react_1.useMemo)(function () {
        var map = new Map();
        peopleGroups.forEach(function (p) { return map.set(p.id, p.name); });
        return map;
    }, [peopleGroups]);
    var allAssignmentsSummary = (0, react_1.useMemo)(function () {
        var summary = [];
        eventFrames.forEach(function (ef) {
            ef.assignments.forEach(function (a) {
                var personName = peopleMap.get(a.personGroupId);
                summary.push({
                    id: "".concat(ef.id, "-").concat(a.id),
                    primaryGrouping: ef.name,
                    secondaryGrouping: personName || 'N/A',
                    eventFrameName: ef.name,
                    eventFramePlace: ef.place || '',
                    eventFrameStartDate: ef.startDate,
                    eventFrameEndDate: ef.endDate,
                    assignmentPersonName: personName || 'N/A',
                    assignmentStartDate: a.startDate,
                    assignmentEndDate: a.endDate,
                    assignmentStatus: a.status,
                    assignmentNotes: a.notes || '',
                    eventFrameGeneralNotes: ef.generalNotes || '',
                    isMixedStatusAssignment: a.status === types_1.AssignmentStatus.Mixed,
                    assignmentObject: a,
                });
            });
        });
        return summary;
    }, [eventFrames, peopleMap]);
    var summaryByEventName = (0, react_1.useMemo)(function () {
        var map = new Map();
        allAssignmentsSummary.forEach(function (row) {
            if (!map.has(row.eventFrameName))
                map.set(row.eventFrameName, []);
            map.get(row.eventFrameName).push(row);
        });
        return __spreadArray([], map.entries(), true).sort(function (a, b) {
            var dateA = new Date(a[1][0].eventFrameStartDate).getTime();
            var dateB = new Date(b[1][0].eventFrameStartDate).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [allAssignmentsSummary, sortOrder]);
    var summaryByStartDate = (0, react_1.useMemo)(function () {
        var map = new Map();
        allAssignmentsSummary.forEach(function (row) {
            var dateStr = (0, dateFormat_1.formatDateDMY)(row.assignmentStartDate);
            if (!map.has(dateStr))
                map.set(dateStr, []);
            map.get(dateStr).push(row);
        });
        return __spreadArray([], map.entries(), true).sort(function (a, b) {
            var dateA = new Date(a[0].split('/').reverse().join('-')).getTime();
            var dateB = new Date(b[0].split('/').reverse().join('-')).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [allAssignmentsSummary, sortOrder]);
    var summaryByPerson = (0, react_1.useMemo)(function () {
        var map = new Map();
        allAssignmentsSummary.forEach(function (row) {
            if (!map.has(row.assignmentPersonName))
                map.set(row.assignmentPersonName, []);
            map.get(row.assignmentPersonName).push(row);
        });
        return __spreadArray([], map.entries(), true).sort(function (a, b) { return a[0].localeCompare(b[0]); });
    }, [allAssignmentsSummary]);
    var handleToggleSection = function (sectionKey) {
        setExpandedSections(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[sectionKey] = !prev[sectionKey], _a)));
        });
    };
    var areAllExpanded = (0, react_1.useMemo)(function () {
        return SECTION_KEYS.every(function (key) { return expandedSections[key]; });
    }, [expandedSections]);
    var toggleAllSections = function () {
        if (areAllExpanded) {
            setExpandedSections({});
        }
        else {
            var allExpanded_1 = {};
            SECTION_KEYS.forEach(function (key) { allExpanded_1[key] = true; });
            setExpandedSections(allExpanded_1);
        }
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 8,
        },
        toolbar: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: 8,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 10,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        buttonText: {
            marginLeft: 8,
            fontSize: 14,
            color: colors.text,
        },
    }); }, [colors]);
    return (<react_native_1.ScrollView style={dynamicStyles.container}>
      <react_native_1.View style={dynamicStyles.toolbar}>
        <react_native_1.TouchableOpacity style={dynamicStyles.button} onPress={function () { return setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
            <MaterialCommunityIcons_1.default name={sortOrder === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={24} color={colors.text}/>
            <react_native_1.Text style={dynamicStyles.buttonText}>Data</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={dynamicStyles.button} onPress={toggleAllSections}>
            <MaterialCommunityIcons_1.default name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text}/>
            <react_native_1.Text style={dynamicStyles.buttonText}>{areAllExpanded ? 'Replegar' : 'Expandir'}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <SummarySection_1.default title="Per Nom d'Esdeveniment" data={summaryByEventName} groupingType="event" isExpanded={!!expandedSections.event} onToggle={function () { return handleToggleSection('event'); }}/>
      <SummarySection_1.default title="Per Data d'Inici d'Assignació" data={summaryByStartDate} groupingType="date" isExpanded={!!expandedSections.date} onToggle={function () { return handleToggleSection('date'); }}/>
      <SummarySection_1.default title="Per Persona/Grup" data={summaryByPerson} groupingType="person" isExpanded={!!expandedSections.person} onToggle={function () { return handleToggleSection('person'); }}/>
    </react_native_1.ScrollView>);
};
exports.default = SummaryScreen;
