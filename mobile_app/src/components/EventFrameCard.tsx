import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Assignment, AssignmentStatus, EventFrame } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { getStatusColor } from '../utils/statusUtils';
import { isMultiDay } from '../utils/dates';
import DailyStatusEditor from './DailyStatusEditor';

type EventFrameCardProps = {
  eventFrame: EventFrame;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  expandedAssignmentIds: Set<string>;
  onToggleAssignmentExpand: (assignmentId: string) => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  peopleMap: Map<string, string>;
  navigation: StackNavigationProp<any>;
};

const StatusIndicator = ({ eventFrame }: { eventFrame: EventFrame }) => {
  const { updateEventFrame } = useDataStore();
  const isComplete = eventFrame.personnelComplete || false;
  const color = isComplete ? '#4CAF50' : '#FFC107';

  const handlePress = () => {
    updateEventFrame(eventFrame.id, { personnelComplete: !isComplete });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={[styles.statusIndicator, { backgroundColor: color }]} />
    </TouchableOpacity>
  );
};

const EventFrameCard: React.FC<EventFrameCardProps> = ({
  eventFrame,
  isExpanded,
  onToggleExpand,
  expandedAssignmentIds,
  onToggleAssignmentExpand,
  onEditEvent,
  onDeleteEvent,
  peopleMap,
  navigation,
}) => {
  
  const setAllDaysAssignmentStatus = useDataStore((state) => state.setAllDaysAssignmentStatus);

  const handleEditAssignment = (assignmentId: string) => {
    navigation.navigate('AssignmentForm', { 
      eventFrameId: eventFrame.id, 
      assignmentId: assignmentId 
    });
  };

  const renderAssignment = (assignment: Assignment) => {
    const isAssignmentMultiDay = isMultiDay(assignment.startDate, assignment.endDate);
    const isAssignmentExpanded = expandedAssignmentIds.has(assignment.id);
    
    const handleSetAllDays = (status: AssignmentStatus) => {
        setAllDaysAssignmentStatus(eventFrame.id, assignment.id, status);
    };

    return (
      <View key={assignment.id} style={styles.assignmentContainer}>
        <View style={styles.assignmentRow}>
          <Text style={styles.assignmentPerson}>
            {peopleMap.get(assignment.personGroupId) || 'Persona desconeguda'}
          </Text>
          <View style={styles.assignmentActions}>
            <Text style={[styles.assignmentStatus, { color: getStatusColor(assignment.status) }]}>
              {assignment.status}
            </Text>
            <TouchableOpacity onPress={() => handleEditAssignment(assignment.id)} style={styles.actionIcon}>
              <Icon name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusButtonsContainer}>
            <TouchableOpacity style={styles.statusButton} onPress={() => handleSetAllDays(AssignmentStatus.Yes)}>
              <Text style={styles.statusButtonText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusButton} onPress={() => handleSetAllDays(AssignmentStatus.Pending)}>
              <Text style={styles.statusButtonText}>Pendent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusButton} onPress={() => handleSetAllDays(AssignmentStatus.No)}>
              <Text style={styles.statusButtonText}>No</Text>
            </TouchableOpacity>
            {isAssignmentMultiDay && (
              <TouchableOpacity style={styles.statusButton} onPress={() => onToggleAssignmentExpand(assignment.id)}>
                 <Text style={styles.statusButtonText}>{isAssignmentExpanded ? 'Amagar' : 'Dies'}</Text>
              </TouchableOpacity>
            )}
        </View>

        {isAssignmentExpanded && isAssignmentMultiDay && (
          <DailyStatusEditor assignment={assignment} eventFrameId={eventFrame.id} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onToggleExpand(eventFrame.id)} style={styles.header}>
        <StatusIndicator eventFrame={eventFrame} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.eventName}>{eventFrame.name}</Text>
          <Text style={styles.eventDate}>
            {new Date(eventFrame.startDate).toLocaleDateString('ca-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#333" />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="map-marker-outline" size={16} color="#555" />
            <Text style={styles.detailText}>{eventFrame.place}</Text>
          </View>

          {eventFrame.generalNotes ? (
            <View style={styles.detailRow}>
              <Icon name="note-text-outline" size={16} color="#555" />
              <Text style={styles.detailText}>{eventFrame.generalNotes}</Text>
            </View>
          ) : null}

          <Text style={styles.assignmentsTitle}>Personal assignat:</Text>
          {eventFrame.assignments.map(renderAssignment)}
          <TouchableOpacity
            style={styles.addPersonButton}
            onPress={() => navigation.navigate('AssignmentForm', { eventFrameId: eventFrame.id })}
          >
            <Icon name="plus-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addPersonButtonText}>Afegir persona</Text>
          </TouchableOpacity>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => onEditEvent(eventFrame.id)} style={styles.actionButton}>
              <Icon name="pencil" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteEvent(eventFrame.id)} style={styles.actionButton}>
              <Icon name="delete" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
      },
      headerTextContainer: {
        flex: 1,
      },
      eventName: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      eventDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
      },
      details: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
      },
      detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      detailText: {
        fontSize: 14,
        marginLeft: 8,
      },
      assignmentsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
      },
      assignmentContainer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingVertical: 8,
      },
      assignmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
      },
      assignmentPerson: {
        fontSize: 16,
        fontWeight: '500',
      },
      assignmentActions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      assignmentStatus: {
        fontSize: 14,
        fontWeight: 'bold',
      },
      actionIcon: {
        padding: 5,
        marginLeft: 10,
      },
      statusButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
      },
      statusButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        marginLeft: 8,
      },
      statusButtonText: {
        fontWeight: '500',
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
        color: '#007AFF',
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
});

export default React.memo(EventFrameCard);
