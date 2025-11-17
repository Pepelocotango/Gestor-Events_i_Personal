import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Alert } from 'react-native';
import { EventFrame, Assignment, AssignmentStatus } from '../types';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { EventsStackParamList } from '../navigation';

type NavigationProp = StackNavigationProp<EventsStackParamList>;

interface Props {
  eventFrame: EventFrame;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  peopleMap: Map<string, string>;
  navigation: NavigationProp;
}

import { Picker } from '@react-native-picker/picker';

const EventFrameCard = ({ eventFrame, isExpanded, onToggleExpand, onEditEvent, onDeleteEvent, peopleMap, navigation }: Props) => {
  const { updateAssignment, deleteAssignment } = useDataStore();
  const [dailyViewId, setDailyViewId] = useState<string | null>(null);

  const handleDeleteAssignment = (assignmentId: string) => {
    Alert.alert(
      "Eliminar Assignació",
      "Esteu segur que voleu eliminar aquesta assignació?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deleteAssignment(eventFrame.id, assignmentId), style: 'destructive' }
      ]
    );
  };

  const handleStatusChange = (assignment: Assignment, newStatus: AssignmentStatus) => {
    if (assignment.status === AssignmentStatus.Mixed) {
      Alert.alert(
        "Sobreescriure estats diaris?",
        "Això esborrarà tots els estats diaris personalitzats. Voleu continuar?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Continuar", onPress: () => updateAssignment(eventFrame.id, assignment.id, { ...assignment, status: newStatus, dailyStatuses: {} }) }
        ]
      );
    } else {
      updateAssignment(eventFrame.id, assignment.id, { ...assignment, status: newStatus });
    }
  };

  const handleDailyStatusChange = (assignment: Assignment, date: string, newStatus: AssignmentStatus) => {
    const newDailyStatuses = { ...(assignment.dailyStatuses || {}) };

    if (!assignment.dailyStatuses) { // If changing from a general status, populate daily statuses
        const oneDay = 24 * 60 * 60 * 1000;
        const startDate = new Date(assignment.startDate);
        const endDate = new Date(assignment.endDate);
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            newDailyStatuses[d.toISOString().split('T')[0]] = assignment.status;
        }
    }

    newDailyStatuses[date] = newStatus;
    updateAssignment(eventFrame.id, assignment.id, { ...assignment, status: AssignmentStatus.Mixed, dailyStatuses: newDailyStatuses });
  };

  const renderAssignment = (assignment: Assignment) => {
    const personName = peopleMap.get(assignment.personGroupId) || 'Desconegut';
    const isDailyView = dailyViewId === assignment.id;

    const dates = [];
    if (isDailyView) {
        const oneDay = 24 * 60 * 60 * 1000;
        const startDate = new Date(assignment.startDate);
        const endDate = new Date(assignment.endDate);
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
    }

    return (
      <View key={assignment.id} style={styles.assignmentItem}>
        <View style={styles.assignmentContent}>
            <Text style={styles.assignmentText}>{personName}</Text>
            <View style={styles.statusPicker}>
                <Picker
                    selectedValue={assignment.status}
                    onValueChange={(itemValue) => handleStatusChange(assignment, itemValue)}
                    style={{ height: 50, width: 150 }}
                >
                    {Object.values(AssignmentStatus).map(s => <Picker.Item key={s} label={s} value={s} />)}
                </Picker>
            </View>
        </View>
        <Button title={isDailyView ? "Ocultar dies" : "Veure dies"} onPress={() => setDailyViewId(isDailyView ? null : assignment.id)} />
        {isDailyView && dates.map(date => (
            <View key={date} style={styles.dailyStatusRow}>
                <Text>{new Date(date).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' })}</Text>
                <Picker
                    selectedValue={assignment.dailyStatuses?.[date] || assignment.status}
                    onValueChange={(itemValue) => handleDailyStatusChange(assignment, date, itemValue)}
                    style={{ height: 50, width: 150 }}
                >
                    {Object.values(AssignmentStatus).filter(s => s !== AssignmentStatus.Mixed).map(s => <Picker.Item key={s} label={s} value={s} />)}
                </Picker>
            </View>
        ))}
        <View style={styles.assignmentActions}>
            <Button title="Editar" onPress={() => navigation.navigate('AssignmentForm', { eventFrameId: eventFrame.id, assignmentId: assignment.id })} />
            <Button title="Eliminar" onPress={() => handleDeleteAssignment(assignment.id)} color="red" />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onToggleExpand(eventFrame.id)}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{eventFrame.name}</Text>
            <Text style={styles.date}>{new Date(eventFrame.startDate).toLocaleDateString()}</Text>
          </View>
          <Text style={isExpanded ? styles.toggleExpanded : styles.toggleCollapsed}>
            {isExpanded ? '▼' : '►'}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.notes}>{eventFrame.generalNotes}</Text>
          <Text style={styles.assignmentsHeader}>Assignacions:</Text>
          {eventFrame.assignments.length > 0 ? (
            eventFrame.assignments.map(renderAssignment)
          ) : (
            <Text style={styles.noAssignmentsText}>No hi ha assignacions.</Text>
          )}
           <Button title="Nova Assignació" onPress={() => navigation.navigate('AssignmentForm', { eventFrameId: eventFrame.id })} />
          <View style={styles.cardActions}>
            <Button title="Editar Esdeveniment" onPress={() => onEditEvent(eventFrame.id)} />
            <Button title="Eliminar Esdeveniment" onPress={() => onDeleteEvent(eventFrame.id)} color="red" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  toggleCollapsed: {
    fontSize: 18,
    color: '#007AFF',
  },
  toggleExpanded: {
    fontSize: 18,
    color: '#007AFF',
  },
  content: {
    padding: 16,
  },
  notes: {
    fontStyle: 'italic',
    marginBottom: 16,
  },
  assignmentsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  assignmentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  assignmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentText: {
    fontSize: 16,
  },
  assignmentStatus: {
    fontSize: 14,
    color: '#333',
  },
  statusPicker: {
    // Styles for the picker container if needed
  },
  dailyStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 20,
    paddingVertical: 4,
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  noAssignmentsText: {
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default EventFrameCard;
