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
import { Assignment } from '../types';
import { lightTheme, darkTheme } from '../utils/themes';

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
        <Text style={dynamicStyles.text}>No s'ha trobat l'esdeveniment.</Text>
      </View>
    );
  }

  const getPersonName = (personGroupId: string) => {
    const person = peopleGroups.find((p) => p.id === personGroupId);
    return person ? person.name : 'Desconegut';
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.title}>{event.name}</Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>Lloc:</Text>{' '}
          {event.place || 'No especificat'}
        </Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>Inici:</Text> {formatDate(event.startDate)}
        </Text>
        <Text style={dynamicStyles.detail}>
          <Text style={dynamicStyles.bold}>Fi:</Text> {formatDate(event.endDate)}
        </Text>
        <Text style={dynamicStyles.notesTitle}>Notes:</Text>
        <Text style={dynamicStyles.notes}>
          {event.generalNotes || 'No hi ha notes.'}
        </Text>
        {event.techSheet && (
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={() =>
              navigation.navigate('TechSheetDetail', { eventId: event.id })
            }
          >
            <Text style={dynamicStyles.buttonText}>Veure Fitxa de Bolo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.subtitle}>Assignacions</Text>
        {event.assignments.map((assignment: Assignment) => (
          <View key={assignment.id} style={dynamicStyles.assignmentContainer}>
            <Text style={dynamicStyles.text}>
              <Text style={dynamicStyles.bold}>
                {peopleGroups.find((p) => p.id === assignment.personGroupId)
                  ?.role || 'Rol'}
                :
              </Text>{' '}
              {getPersonName(assignment.personGroupId) || 'No assignat'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
