import React from 'react';
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

  // Selecciona cada part de l'estat de forma individual per evitar re-renderitzacions innecessàries.
  const eventFrames = useDataStore((state) => state.eventFrames);
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const peopleGroups = useDataStore((state) => state.peopleGroups);

  const event = eventFrames.find((e) => e.id === eventId);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text>No s'ha trobat l'esdeveniment.</Text>
      </View>
    );
  }

  const getPersonName = (personGroupId: string) => {
    const person = peopleGroups.find((p) => p.id === personGroupId);
    return person ? person.name : 'Desconegut';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.detail}>
          <Text style={styles.bold}>Lloc:</Text>{' '}
          {event.place || 'No especificat'}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.bold}>Inici:</Text> {formatDate(event.startDate)}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.bold}>Fi:</Text> {formatDate(event.endDate)}
        </Text>
        <Text style={styles.notesTitle}>Notes:</Text>
        <Text style={styles.notes}>
          {event.generalNotes || 'No hi ha notes.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Assignacions</Text>
        {event.assignments.map((assignment: Assignment) => (
          <View key={assignment.id} style={styles.assignmentContainer}>
            <Text>
              <Text style={styles.bold}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  detail: {
    fontSize: 16,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  notes: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  assignmentContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
