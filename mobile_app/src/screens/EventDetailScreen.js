"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EventDetailScreen;
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var formatDate = function (dateString) {
    return new Date(dateString).toLocaleDateString();
};
function EventDetailScreen(_a) {
    var route = _a.route, navigation = _a.navigation;
    var eventId = route.params.eventId;
    var _b = (0, dataStore_1.useDataStore)(), eventFrames = _b.eventFrames, isLoading = _b.isLoading, error = _b.error, peopleGroups = _b.peopleGroups, theme = _b.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var event = eventFrames.find(function (e) { return e.id === eventId; });
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 16,
        },
        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            elevation: 2,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            marginBottom: 12,
            color: colors.text,
        },
        subtitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingBottom: 4,
            color: colors.text,
        },
        detail: {
            fontSize: 16,
            marginBottom: 8,
            color: colors.text,
        },
        notesTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 12,
            color: colors.text,
        },
        notes: {
            fontSize: 14,
            color: colors.text,
            opacity: 0.8,
            marginTop: 4,
        },
        assignmentContainer: {
            marginTop: 8,
            padding: 8,
            backgroundColor: colors.background,
            borderRadius: 4,
        },
        bold: {
            fontWeight: 'bold',
        },
        errorText: {
            color: 'red',
        },
        text: {
            color: colors.text,
        },
        roleText: {
            fontStyle: 'italic',
            color: colors.placeholder,
        },
        button: {
            marginTop: 16,
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
        },
        buttonText: {
            color: theme === 'dark' ? themes_1.darkTheme.background : themes_1.lightTheme.background,
            fontSize: 16,
            fontWeight: 'bold',
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
    if (!event) {
        return (<react_native_1.View style={dynamicStyles.centerContainer}>
        <react_native_1.Text style={dynamicStyles.text}>No s'ha trobat l'esdeveniment.</react_native_1.Text>
      </react_native_1.View>);
    }
    var getPersonName = function (personGroupId) {
        var person = peopleGroups.find(function (p) { return p.id === personGroupId; });
        return person ? person.name : 'Desconegut';
    };
    return (<react_native_1.ScrollView style={dynamicStyles.container}>
      <react_native_1.View style={dynamicStyles.card}>
        <react_native_1.Text style={dynamicStyles.title}>{event.name}</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.detail}>
          <react_native_1.Text style={dynamicStyles.bold}>Lloc:</react_native_1.Text>{' '}
          {event.place || 'No especificat'}
        </react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.detail}>
          <react_native_1.Text style={dynamicStyles.bold}>Inici:</react_native_1.Text> {formatDate(event.startDate)}
        </react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.detail}>
          <react_native_1.Text style={dynamicStyles.bold}>Fi:</react_native_1.Text> {formatDate(event.endDate)}
        </react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.notesTitle}>Notes:</react_native_1.Text>
        <react_native_1.Text style={dynamicStyles.notes}>
          {event.generalNotes || 'No hi ha notes.'}
        </react_native_1.Text>
        {event.techSheet && (<react_native_1.TouchableOpacity style={dynamicStyles.button} onPress={function () {
                return navigation.navigate('TechSheetDetail', { eventId: event.id });
            }}>
            <react_native_1.Text style={dynamicStyles.buttonText}>Veure Fitxa de Bolo</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>

      <react_native_1.View style={dynamicStyles.card}>
        <react_native_1.Text style={dynamicStyles.subtitle}>Assignacions</react_native_1.Text>
        {event.assignments.map(function (assignment) { return (<react_native_1.View key={assignment.id} style={dynamicStyles.assignmentContainer}>
            <react_native_1.Text>
              <react_native_1.Text style={[dynamicStyles.text, dynamicStyles.bold]}>
                {getPersonName(assignment.personGroupId) || 'No assignat'}
              </react_native_1.Text>
              {assignment.role && (<react_native_1.Text style={dynamicStyles.roleText}> - {assignment.role}</react_native_1.Text>)}
            </react_native_1.Text>
          </react_native_1.View>); })}
      </react_native_1.View>
    </react_native_1.ScrollView>);
}
