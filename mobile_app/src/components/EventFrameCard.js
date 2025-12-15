"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var types_1 = require("../types");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var statusUtils_1 = require("../utils/statusUtils");
var dates_1 = require("../utils/dates");
var DailyStatusEditor_1 = require("./DailyStatusEditor");
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var themes_1 = require("../utils/themes");
var StatusIndicator = function (_a) {
    var eventFrame = _a.eventFrame;
    var updateEventFrame = (0, dataStore_1.useDataStore)(function (state) { return state.updateEventFrame; });
    var themeName = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var theme = themeName === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var isComplete = eventFrame.personnelComplete || false;
    var color = isComplete ? theme['status-yes'] : theme['status-pending'];
    var handlePress = function () {
        var newStatus = !isComplete;
        var action = newStatus ? 'com a complet' : 'com a incomplet';
        var eventName = eventFrame.name;
        react_native_1.Alert.alert("Confirmar canvi d'estat", "L'esdeveniment '".concat(eventName, "' es marcar\u00E0 ").concat(action, ". Esteu segur?"), [
            {
                text: 'Cancel·lar',
                style: 'cancel',
            },
            {
                text: 'Acceptar',
                onPress: function () { return updateEventFrame(eventFrame.id, { personnelComplete: newStatus }); },
            },
        ], { cancelable: false });
    };
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        statusIndicator: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: 10,
        },
    }); }, []);
    return (<react_native_1.TouchableOpacity onPress={handlePress}>
      <react_native_1.View style={[styles.statusIndicator, { backgroundColor: color }]}/>
    </react_native_1.TouchableOpacity>);
};
var getNextStatus = function (currentStatus) {
    var statuses = [types_1.AssignmentStatus.Yes, types_1.AssignmentStatus.Pending, types_1.AssignmentStatus.No];
    var currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) {
        return statuses[0];
    }
    return statuses[(currentIndex + 1) % statuses.length];
};
var EventFrameCard = function (_a) {
    var eventFrame = _a.eventFrame, isExpanded = _a.isExpanded, onToggleExpand = _a.onToggleExpand, expandedAssignmentIds = _a.expandedAssignmentIds, onToggleAssignmentExpand = _a.onToggleAssignmentExpand, unlockedAssignmentIds = _a.unlockedAssignmentIds, onToggleAssignmentLock = _a.onToggleAssignmentLock, onEditEvent = _a.onEditEvent, onDeleteEvent = _a.onDeleteEvent, peopleMap = _a.peopleMap, navigation = _a.navigation;
    var themeName = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var theme = themeName === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var setAllDaysAssignmentStatus = (0, dataStore_1.useDataStore)(function (state) { return state.setAllDaysAssignmentStatus; });
    var handleEditAssignment = function (assignmentId) {
        navigation.navigate('AssignmentForm', {
            eventFrameId: eventFrame.id,
            assignmentId: assignmentId
        });
    };
    var formatDateRange = function (start, end) {
        var startDate = new Date(start);
        var endDate = new Date(end);
        var formattedStart = (0, date_fns_1.format)(startDate, 'dd/MM/yyyy', { locale: locale_1.ca });
        if (!(0, dates_1.isMultiDay)(start, end)) {
            return formattedStart;
        }
        var formattedEnd = (0, date_fns_1.format)(endDate, 'dd/MM/yyyy', { locale: locale_1.ca });
        return "".concat(formattedStart, " - ").concat(formattedEnd);
    };
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        card: {
            backgroundColor: theme.card,
            borderRadius: 8,
            padding: 15,
            marginVertical: 8,
            marginHorizontal: 16,
            elevation: 2,
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerTextContainer: {
            flex: 1,
        },
        eventName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
        },
        eventDate: {
            fontSize: 14,
            color: theme.placeholder,
            marginTop: 4,
        },
        details: {
            marginTop: 15,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        detailText: {
            fontSize: 14,
            marginLeft: 8,
            color: theme.text,
        },
        assignmentsTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 10,
            marginBottom: 5,
            color: theme.text,
        },
        assignmentContainer: {
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingVertical: 8,
        },
        assignmentRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 4,
        },
        assignmentPersonContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        lockIcon: {
            marginRight: 8,
        },
        assignmentPerson: {
            fontSize: 16,
            fontWeight: '500',
            color: theme.text,
        },
        assignmentRole: {
            fontSize: 14,
            fontWeight: 'normal',
            color: theme.placeholder,
            fontStyle: 'italic',
        },
        assignmentDate: {
            fontSize: 12,
            color: theme.placeholder,
        },
        assignmentActions: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        assignmentStatus: {
            fontSize: 16,
            fontWeight: 'bold',
            paddingVertical: 4,
            paddingHorizontal: 8,
        },
        actionIcon: {
            padding: 5,
            marginLeft: 10,
        },
        toggleDaysButton: {
            backgroundColor: theme.border,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginTop: 8,
            alignItems: 'center',
        },
        toggleDaysButtonText: {
            fontWeight: '500',
            color: theme.text,
        },
        addPersonButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            padding: 5,
            alignSelf: 'flex-start',
        },
        addPersonButtonText: {
            marginLeft: 8,
            color: theme.primary,
            fontSize: 14,
            fontWeight: 'bold',
        },
        cardActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 15,
            gap: 20,
        },
        actionButton: {
            padding: 5,
        },
    }); }, [theme]);
    var renderAssignment = function (assignment) {
        var isAssignmentMultiDay = (0, dates_1.isMultiDay)(assignment.startDate, assignment.endDate);
        var isAssignmentExpanded = expandedAssignmentIds.has(assignment.id);
        var isUnlocked = unlockedAssignmentIds.has(assignment.id);
        var handleStatusPress = function () {
            if (!isUnlocked)
                return;
            var nextStatus = getNextStatus(assignment.status);
            setAllDaysAssignmentStatus(eventFrame.id, assignment.id, nextStatus);
        };
        return (<react_native_1.View key={assignment.id} style={styles.assignmentContainer}>
        <react_native_1.View style={styles.assignmentRow}>
          <react_native_1.View style={styles.assignmentPersonContainer}>
            <react_native_1.TouchableOpacity onPress={function () { return onToggleAssignmentLock(assignment.id); }} style={styles.lockIcon}>
              <MaterialCommunityIcons_1.default name={isUnlocked ? 'lock-open-variant' : 'lock'} size={22} color={isUnlocked ? theme['status-yes'] : theme.placeholder}/>
            </react_native_1.TouchableOpacity>
            <react_native_1.View>
              <react_native_1.Text style={styles.assignmentPerson}>
                {peopleMap.get(assignment.personGroupId) || 'Persona desconeguda'}
                {assignment.role ? (<react_native_1.Text style={styles.assignmentRole}> - {assignment.role}</react_native_1.Text>) : null}
              </react_native_1.Text>
              <react_native_1.Text style={styles.assignmentDate}>
                {formatDateRange(assignment.startDate, assignment.endDate)}
              </react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>
          <react_native_1.View style={styles.assignmentActions}>
             <react_native_1.TouchableOpacity onPress={handleStatusPress} disabled={!isUnlocked}>
                <react_native_1.Text style={[styles.assignmentStatus, { color: (0, statusUtils_1.getStatusColor)(assignment.status), opacity: isUnlocked ? 1 : 0.5 }]}>
                {assignment.status}
                </react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity onPress={function () { return handleEditAssignment(assignment.id); }} style={styles.actionIcon}>
              <MaterialCommunityIcons_1.default name="pencil" size={20} color={theme.primary}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>

        {isAssignmentMultiDay && (<react_native_1.TouchableOpacity style={styles.toggleDaysButton} onPress={function () { return onToggleAssignmentExpand(assignment.id); }}>
                <react_native_1.Text style={styles.toggleDaysButtonText}>{isAssignmentExpanded ? 'Amagar dies' : 'Mostrar dies'}</react_native_1.Text>
            </react_native_1.TouchableOpacity>)}

        {isAssignmentExpanded && isAssignmentMultiDay && (<DailyStatusEditor_1.default assignment={assignment} eventFrameId={eventFrame.id} isUnlocked={isUnlocked}/>)}

      </react_native_1.View>);
    };
    return (<react_native_1.View style={styles.card}>
      <react_native_1.TouchableOpacity onPress={function () { return onToggleExpand(eventFrame.id); }} style={styles.header}>
        <StatusIndicator eventFrame={eventFrame}/>
        <react_native_1.View style={styles.headerTextContainer}>
          <react_native_1.Text style={styles.eventName}>{eventFrame.name}</react_native_1.Text>
          <react_native_1.Text style={styles.eventDate}>
            {new Date(eventFrame.startDate).toLocaleDateString('ca-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}
          </react_native_1.Text>
        </react_native_1.View>
        <MaterialCommunityIcons_1.default name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={theme.text}/>
      </react_native_1.TouchableOpacity>

      {isExpanded && (<react_native_1.View style={styles.details}>
          <react_native_1.View style={styles.detailRow}>
            <MaterialCommunityIcons_1.default name="map-marker-outline" size={16} color={theme.text}/>
            <react_native_1.Text style={styles.detailText}>{eventFrame.place}</react_native_1.Text>
          </react_native_1.View>

          {eventFrame.generalNotes ? (<react_native_1.View style={styles.detailRow}>
              <MaterialCommunityIcons_1.default name="note-text-outline" size={16} color={theme.text}/>
              <react_native_1.Text style={styles.detailText}>{eventFrame.generalNotes}</react_native_1.Text>
            </react_native_1.View>) : null}

          <react_native_1.Text style={styles.assignmentsTitle}>Personal assignat:</react_native_1.Text>
          {eventFrame.assignments.map(renderAssignment)}
          <react_native_1.TouchableOpacity style={styles.addPersonButton} onPress={function () { return navigation.navigate('AssignmentForm', { eventFrameId: eventFrame.id }); }}>
            <MaterialCommunityIcons_1.default name="plus-circle-outline" size={20} color={theme.primary}/>
            <react_native_1.Text style={styles.addPersonButtonText}>Afegir persona</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.cardActions}>
            <react_native_1.TouchableOpacity onPress={function () { return onEditEvent(eventFrame.id); }} style={styles.actionButton}>
              <MaterialCommunityIcons_1.default name="pencil" size={24} color={theme.primary}/>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity onPress={function () { return onDeleteEvent(eventFrame.id); }} style={styles.actionButton}>
              <MaterialCommunityIcons_1.default name="delete" size={24} color={theme.destructive}/>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.View>)}
    </react_native_1.View>);
};
exports.default = react_1.default.memo(EventFrameCard);
