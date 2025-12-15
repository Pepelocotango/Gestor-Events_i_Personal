"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var native_1 = require("@react-navigation/native");
var EventFrameCard_1 = require("../components/EventFrameCard");
var FilterControls_1 = require("../components/FilterControls");
var ActionToolbar_1 = require("../components/ActionToolbar");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var themes_1 = require("../utils/themes");
var EventsScreen = function (_a) {
    var navigation = _a.navigation;
    var _b = (0, dataStore_1.useDataStore)(), fileName = _b.fileName, eventFrames = _b.eventFrames, peopleGroups = _b.peopleGroups, deleteEventFrame = _b.deleteEventFrame, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _c = (0, react_1.useState)(new Set()), expandedIds = _c[0], setExpandedIds = _c[1];
    var _d = (0, react_1.useState)(new Set()), expandedAssignmentIds = _d[0], setExpandedAssignmentIds = _d[1];
    var _e = (0, react_1.useState)(new Set()), unlockedAssignmentIds = _e[0], setUnlockedAssignmentIds = _e[1];
    var _f = (0, react_1.useState)({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' }), filters = _f[0], setFilters = _f[1];
    (0, native_1.useFocusEffect)((0, react_1.useCallback)(function () {
        // S'executa quan la pantalla guanya el focus
        return function () {
            // S'executa quan la pantalla perd el focus
            setUnlockedAssignmentIds(new Set());
            setExpandedAssignmentIds(new Set());
        };
    }, []));
    var _g = (0, react_1.useState)('desc'), sortOrder = _g[0], setSortOrder = _g[1];
    var _h = (0, react_1.useState)(false), showArchived = _h[0], setShowArchived = _h[1];
    var peopleMap = (0, react_1.useMemo)(function () {
        var map = new Map();
        peopleGroups.forEach(function (p) { return map.set(p.id, p.name); });
        return map;
    }, [peopleGroups]);
    var filteredEventFrames = (0, react_1.useMemo)(function () {
        var filtered = eventFrames.filter(function (ef) { return (ef.isArchived || false) === showArchived; });
        if (filters.text) {
            var lowerCaseText_1 = filters.text.toLowerCase();
            filtered = filtered.filter(function (frame) {
                var _a, _b;
                return frame.name.toLowerCase().includes(lowerCaseText_1) ||
                    ((_a = frame.place) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(lowerCaseText_1)) ||
                    ((_b = frame.generalNotes) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(lowerCaseText_1)) ||
                    frame.assignments.some(function (a) { var _a; return (_a = peopleMap.get(a.personGroupId)) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(lowerCaseText_1); });
            });
        }
        if (filters.person)
            filtered = filtered.filter(function (frame) { return frame.assignments.some(function (a) { return a.personGroupId === filters.person; }); });
        if (filters.eventFrame)
            filtered = filtered.filter(function (frame) { return frame.id === filters.eventFrame; });
        return filtered.sort(function (a, b) {
            var dateA = new Date(a.startDate).getTime();
            var dateB = new Date(b.startDate).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [eventFrames, filters, showArchived, sortOrder, peopleMap]);
    var areAllExpanded = (0, react_1.useMemo)(function () {
        if (filteredEventFrames.length === 0)
            return true;
        return filteredEventFrames.every(function (ef) { return expandedIds.has(ef.id); });
    }, [expandedIds, filteredEventFrames]);
    var toggleAllCards = function () {
        if (areAllExpanded) {
            setExpandedIds(new Set());
        }
        else {
            var allIds = new Set(filteredEventFrames.map(function (ef) { return ef.id; }));
            setExpandedIds(allIds);
        }
    };
    var toggleExpand = (0, react_1.useCallback)(function (id) {
        setExpandedIds(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(id))
                newSet.delete(id);
            else
                newSet.add(id);
            return newSet;
        });
    }, []);
    var toggleAssignmentExpand = (0, react_1.useCallback)(function (assignmentId) {
        setExpandedAssignmentIds(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(assignmentId)) {
                newSet.delete(assignmentId);
            }
            else {
                newSet.add(assignmentId);
            }
            return newSet;
        });
    }, []);
    var toggleAssignmentLock = (0, react_1.useCallback)(function (assignmentId) {
        setUnlockedAssignmentIds(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(assignmentId)) {
                newSet.delete(assignmentId);
            }
            else {
                newSet.add(assignmentId);
            }
            return newSet;
        });
        // Ensure assignment is not expanded when locked
        setExpandedAssignmentIds(function (prev) {
            var newSet = new Set(prev);
            newSet.delete(assignmentId);
            return newSet;
        });
    }, []);
    var clearFilters = function () { return setFilters({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' }); };
    var handleDelete = (0, react_1.useCallback)(function (id) {
        react_native_1.Alert.alert("Eliminar Esdeveniment", "¿Esteu segur?", [{ text: "Cancel·lar", style: "cancel" }, { text: "Eliminar", onPress: function () { return deleteEventFrame(id); }, style: 'destructive' }]);
    }, [deleteEventFrame]);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            backgroundColor: colors.background,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
        },
        message: {
            color: colors.text,
            textAlign: 'center',
        },
        emptyList: {
            textAlign: 'center',
            marginTop: 50,
            fontSize: 16,
            color: colors.text,
            opacity: 0.7,
        },
        fab: {
            position: 'absolute',
            right: 20,
            bottom: 20,
            backgroundColor: colors.primary,
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
    }); }, [colors]);
    if (!fileName) {
        return (<react_native_1.View style={dynamicStyles.centered}>
        <react_native_1.Text style={dynamicStyles.title}>No hi ha cap fitxer obert</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.message}>Feu servir el botó "Obrir" de la capçalera per carregar un projecte.</react_native_1.Text>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={dynamicStyles.container}>
      <FilterControls_1.default filters={filters} setFilters={setFilters} peopleGroups={peopleGroups} eventFrames={eventFrames} clearFilters={clearFilters}/>
      <ActionToolbar_1.default sortOrder={sortOrder} setSortOrder={setSortOrder} showArchived={showArchived} setShowArchived={setShowArchived} toggleAllCards={toggleAllCards} areAllExpanded={areAllExpanded}/>
      <react_native_1.FlatList data={filteredEventFrames} keyExtractor={function (item) { return item.id; }} renderItem={function (_a) {
            var item = _a.item;
            return (<EventFrameCard_1.default eventFrame={item} isExpanded={expandedIds.has(item.id)} onToggleExpand={toggleExpand} expandedAssignmentIds={expandedAssignmentIds} onToggleAssignmentExpand={toggleAssignmentExpand} unlockedAssignmentIds={unlockedAssignmentIds} onToggleAssignmentLock={toggleAssignmentLock} onEditEvent={function (id) { return navigation.navigate('EventForm', { eventId: id }); }} onDeleteEvent={handleDelete} peopleMap={peopleMap} navigation={navigation}/>);
        }} ListEmptyComponent={<react_native_1.Text style={dynamicStyles.emptyList}>No s'han trobat esdeveniments amb aquests filtres.</react_native_1.Text>} contentContainerStyle={{ paddingBottom: 80 }}/>
      <react_native_1.TouchableOpacity style={dynamicStyles.fab} onPress={function () { return navigation.navigate('EventForm', {}); }}>
        <MaterialCommunityIcons_1.default name="plus" size={30} color={theme === 'dark' ? themes_1.darkTheme.background : themes_1.lightTheme.background}/>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
};
exports.default = EventsScreen;
