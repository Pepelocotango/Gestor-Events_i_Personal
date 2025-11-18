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
import AssignmentCard from '../components/AssignmentCard';

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
        {event.techSheet && (
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('TechSheetDetail', { eventId: event.id })
            }
          >
            <Text style={styles.buttonText}>Veure Fitxa de Bolo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.assignmentsHeader}>
            <Text style={styles.subtitle}>Assignacions</Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AssignmentForm', { eventFrameId: event.id })}
            >
                <Text style={styles.addButtonText}>+ Afegir</Text>
            </TouchableOpacity>
        </View>

        {event.assignments.length > 0 ? (
          event.assignments.map((assignment: Assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              person={peopleGroups.find(
                (p) => p.id === assignment.personGroupId
              )}
              navigation={navigation}
            />
          ))
        ) : (
          <Text style={styles.noAssignmentsText}>
            No hi ha personal assignat a aquest esdeveniment.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Espai extra per evitar la superposició
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
  assignmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  bold: {
    fontWeight: 'bold',
  },
  noAssignmentsText: {
    marginTop: 10,
    color: '#666',
    fontStyle: 'italic',
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
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
