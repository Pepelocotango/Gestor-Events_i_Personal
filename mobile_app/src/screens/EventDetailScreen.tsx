import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataStore } from '../stores/dataStore';
import { EventsStackParamList } from '../navigation';
import { Assignment, AssignmentStatus } from '../types';
import { getStatusColor, getTranslatedStatus } from '../utils/statusUtils';
import { formatDateRangeDMY } from '../utils/dateFormat';
import { formatDateRanges } from '../utils/dateRangeFormatter';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type EventDetailScreenRouteProp = RouteProp<EventsStackParamList, 'EventDetail'>;
type EventDetailScreenNavigationProp = StackNavigationProp<
  EventsStackParamList,
  'EventDetail'
>;

type Props = {
  route: EventDetailScreenRouteProp;
  navigation: EventDetailScreenNavigationProp;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString();

export default function EventDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { eventId } = route.params;

  const { eventFrames, isLoading, error, peopleGroups, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const event = eventFrames.find((e) => e.id === eventId);

  const dynamicStyles = useMemo(() => StyleSheet.create({
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
      color: theme === 'dark' ? darkTheme.background : lightTheme.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
  }), [colors]);

  if (isLoading) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <Text style={dynamicStyles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <Text style={dynamicStyles.text}>{t('mobile.tech_sheet.event_not_found')}</Text>
      </View>
    );
  }

  const getPersonName = (personGroupId: string) => {
    const person = peopleGroups.find((p) => p.id === personGroupId);
    return person ? person.name : t('mobile.tech_sheet.unknown');
  };

  const renderMixedDetails = (assignment: Assignment) => {
    if (!assignment.dailyStatuses) return null;

    const grouped: Record<string, string[]> = {};
    Object.entries(assignment.dailyStatuses).forEach(([date, status]) => {
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(date);
    });

    return (
      <View style={{ marginTop: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: colors.border }}>
        {Object.entries(grouped).map(([status, dates]) => (
          <Text key={status} style={{ fontSize: 12, color: colors.text }}>
            <Text style={{ color: getStatusColor(status as AssignmentStatus), fontWeight: 'bold' }}>
              {getTranslatedStatus(status as AssignmentStatus, t)}:{' '}
            </Text>
            {formatDateRanges(dates)}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.title}>{event.name}</Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>{t('mobile.event_details.place')}</Text>{' '}
          {event.place || t('mobile.event_details.not_specified')}
        </Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>{t('mobile.event_details.start')}</Text> {formatDate(event.startDate)}
        </Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>{t('mobile.event_details.end')}</Text> {formatDate(event.endDate)}
        </Text>
        <Text style={dynamicStyles.notesTitle}>{t('mobile.event_details.notes')}</Text>
        <Text style={dynamicStyles.notes}>
          {event.generalNotes || t('mobile.event_details.no_notes')}
        </Text>
        {event.techSheet && (
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={() =>
              navigation.navigate('TechSheetDetail', { eventId: event.id })
            }
          >
            <Text style={dynamicStyles.buttonText}>{t('mobile.tech_sheet.view_tech_sheet')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.subtitle}>{t('event.assignments_title')}</Text>
        {event.assignments.map((assignment: Assignment) => (
          <View key={assignment.id} style={[dynamicStyles.assignmentContainer, { marginBottom: 12 }]}>
            {/* FILA 1: NOM I ROL */}
            <View style={{ marginBottom: 4 }}>
              <Text>
                <Text style={[dynamicStyles.text, dynamicStyles.bold, { fontSize: 16 }]}>
                  {getPersonName(assignment.personGroupId) || t('assignment.person_unknown')}
                </Text>
                {assignment.role && (
                  <Text style={dynamicStyles.roleText}> - {assignment.role}</Text>
                )}
              </Text>
            </View>

            {/* FILA 2: DATES I ESTAT GENERAL */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: colors.text, opacity: 0.8 }}>
                {formatDateRangeDMY(assignment.startDate, assignment.endDate)}
              </Text>
              <Text style={{
                fontWeight: 'bold',
                color: getStatusColor(assignment.status),
                fontSize: 14
              }}>
                {getTranslatedStatus(assignment.status, t)}
              </Text>
            </View>

            {/* FILA 3: DETALL MIXT (Condicional) */}
            {assignment.status === AssignmentStatus.Mixed && renderMixedDetails(assignment)}

            {/* FILA 4: NOTES (Condicional) */}
            {assignment.notes ? (
              <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.placeholder, marginTop: 4 }}>
                📝 {assignment.notes}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
