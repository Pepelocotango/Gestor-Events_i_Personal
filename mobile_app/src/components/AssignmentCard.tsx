import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Assignment, AssignmentStatus, PersonGroup } from '../types';
import { useDataStore } from '../stores/dataStore';
import { eachDayOfInterval, format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { EventsStackParamList } from '../navigation';

type AssignmentCardNavigationProp = StackNavigationProp<EventsStackParamList, 'EventDetail'>;

interface AssignmentCardProps {
  assignment: Assignment;
  person: PersonGroup | undefined;
  navigation: AssignmentCardNavigationProp;
}

const getStatusStyle = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.Yes:
      return { container: styles.statusYes, text: styles.statusText };
    case AssignmentStatus.No:
      return { container: styles.statusNo, text: styles.statusText };
    case AssignmentStatus.Pending:
      return { container: styles.statusPending, text: styles.statusText };
    case AssignmentStatus.Mixed:
      return { container: styles.statusMixed, text: styles.statusText };
    default:
      return { container: styles.statusDefault, text: styles.statusText };
  }
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, person, navigation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateDailyAssignmentStatus, deleteAssignment } = useDataStore();
  const statusStyle = getStatusStyle(assignment.status);

  const handleStatusChange = (date: string, newStatus: AssignmentStatus) => {
    updateDailyAssignmentStatus(assignment.eventFrameId, assignment.id, date, newStatus);
  };

  const handleEdit = () => {
    navigation.navigate('AssignmentForm', {
      eventFrameId: assignment.eventFrameId,
      assignmentId: assignment.id,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Eliminació",
      `Estàs segur que vols eliminar l'assignació de ${person?.name}?`,
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteAssignment(assignment.eventFrameId, assignment.id) }
      ]
    );
  };

  const renderDailyStatuses = () => {
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const currentStatus = assignment.dailyStatuses?.[dateKey] || assignment.status;
      const displayStatus = currentStatus === AssignmentStatus.Mixed ? AssignmentStatus.Pending : currentStatus;

      return (
        <View key={dateKey} style={styles.dayRow}>
          <Text style={styles.dayText}>{format(day, 'eeee, dd/MM', { locale: ca })}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={displayStatus}
              onValueChange={(itemValue) => handleStatusChange(dateKey, itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Sí" value={AssignmentStatus.Yes} />
              <Picker.Item label="No" value={AssignmentStatus.No} />
              <Picker.Item label="Pendent" value={AssignmentStatus.Pending} />
            </Picker>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.personInfo}>
          <Text style={styles.role}>{person?.role || 'Rol no definit'}</Text>
          <Text style={styles.name}>{person?.name || 'Persona desconeguda'}</Text>
        </View>
        <View style={statusStyle.container}>
          <Text style={statusStyle.text}>{assignment.status}</Text>
        </View>
      </View>

      {assignment.notes ? <Text style={styles.notes}>{assignment.notes}</Text> : null}

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={[styles.button, styles.viewButton]}>
          <Text style={styles.buttonText}>{isExpanded ? 'Amagar' : 'Dies'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEdit} style={[styles.button, styles.editButton]}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={[styles.button, styles.deleteButton]}>
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.detailsContainer}>
          {renderDailyStatuses()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      },
      personInfo: {
        flex: 1,
      },
      role: {
        fontSize: 14,
        color: '#666',
      },
      name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
      notes: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
        fontStyle: 'italic',
      },
      statusYes: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 4, alignSelf: 'flex-start' },
      statusNo: { backgroundColor: '#F44336', padding: 8, borderRadius: 4, alignSelf: 'flex-start' },
      statusPending: { backgroundColor: '#FFC107', padding: 8, borderRadius: 4, alignSelf: 'flex-start' },
      statusMixed: { backgroundColor: '#2196F3', padding: 8, borderRadius: 4, alignSelf: 'flex-start' },
      statusDefault: { backgroundColor: '#9E9E9E', padding: 8, borderRadius: 4, alignSelf: 'flex-start' },
      statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
      },
      detailsContainer: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
      },
      dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      dayText: {
        fontSize: 16,
        flex: 1,
      },
      pickerContainer: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: '#fafafa',
      },
      picker: {
        height: 40,
        transform: [
          { scaleX: 0.9 },
          { scaleY: 0.9 },
        ],
      },
      actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
      },
      button: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginLeft: 8,
      },
      viewButton: {
        backgroundColor: '#607D8B',
      },
      editButton: {
        backgroundColor: '#2196F3',
      },
      deleteButton: {
        backgroundColor: '#F44336',
      },
      buttonText: {
        color: '#fff',
        fontWeight: '500',
      },
});

export default AssignmentCard;
