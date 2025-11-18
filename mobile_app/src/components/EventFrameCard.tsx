import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Assignment, AssignmentStatus, EventFrame } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { getStatusColor } from '../utils/statusUtils';
import { isMultiDay } from '../utils/dates';
import DailyStatusEditor from './DailyStatusEditor';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

type EventFrameCardProps = {
  eventFrame: EventFrame;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  expandedAssignmentIds: Set<string>;
  onToggleAssignmentExpand: (assignmentId: string) => void;
  unlockedAssignmentIds: Set<string>;
  onToggleAssignmentLock: (assignmentId: string) => void;
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

const getNextStatus = (currentStatus: AssignmentStatus): AssignmentStatus => {
    const statuses = [AssignmentStatus.Yes, AssignmentStatus.Pending, AssignmentStatus.No];
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) {
        return statuses[0];
    }
    return statuses[(currentIndex + 1) % statuses.length];
};

const EventFrameCard: React.FC<EventFrameCardProps> = ({
  eventFrame,
  isExpanded,
  onToggleExpand,
  expandedAssignmentIds,
  onToggleAssignmentExpand,
  unlockedAssignmentIds,
  onToggleAssignmentLock,
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

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formattedStart = format(startDate, 'dd/MM/yyyy', { locale: ca });
    if (!isMultiDay(start, end)) {
      return formattedStart;
    }
    const formattedEnd = format(endDate, 'dd/MM/yyyy', { locale: ca });
    return `${formattedStart} - ${formattedEnd}`;
  };

  const renderAssignment = (assignment: Assignment) => {
    const isAssignmentMultiDay = isMultiDay(assignment.startDate, assignment.endDate);
    const isAssignmentExpanded = expandedAssignmentIds.has(assignment.id);
    const isUnlocked = unlockedAssignmentIds.has(assignment.id);

    const handleStatusPress = () => {
        if (!isUnlocked) return;
        const nextStatus = getNextStatus(assignment.status);
        setAllDaysAssignmentStatus(eventFrame.id, assignment.id, nextStatus);
    };

    return (
      <View key={assignment.id} style={styles.assignmentContainer}>
        <View style={styles.assignmentRow}>
          <View style={styles.assignmentPersonContainer}>
            <TouchableOpacity onPress={() => onToggleAssignmentLock(assignment.id)} style={styles.lockIcon}>
              <Icon name={isUnlocked ? 'lock-open-variant' : 'lock'} size={22} color={isUnlocked ? "#4CAF50" : "#666"} />
            </TouchableOpacity>
            <View>
              <Text style={styles.assignmentPerson}>
                {peopleMap.get(assignment.personGroupId) || 'Persona desconeguda'}
              </Text>
              <Text style={styles.assignmentDate}>
                {formatDateRange(assignment.startDate, assignment.endDate)}
              </Text>
            </View>
          </View>
          <View style={styles.assignmentActions}>
             <TouchableOpacity onPress={handleStatusPress} disabled={!isUnlocked}>
                <Text style={[styles.assignmentStatus, { color: getStatusColor(assignment.status), opacity: isUnlocked ? 1 : 0.5 }]}>
                {assignment.status}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEditAssignment(assignment.id)} style={styles.actionIcon}>
              <Icon name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {isAssignmentMultiDay && (
            <TouchableOpacity style={styles.toggleDaysButton} onPress={() => onToggleAssignmentExpand(assignment.id)}>
                <Text style={styles.toggleDaysButtonText}>{isAssignmentExpanded ? 'Amagar dies' : 'Mostrar dies'}</Text>
            </TouchableOpacity>
        )}

        {isAssignmentExpanded && isAssignmentMultiDay && (
          <DailyStatusEditor
            assignment={assignment}
            eventFrameId={eventFrame.id}
            isUnlocked={isUnlocked}
          />
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
      },
      assignmentDate: {
        fontSize: 12,
        color: '#666',
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
        backgroundColor: '#e0e0e0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
      },
      toggleDaysButtonText: {
        fontWeight: '500',
        color: '#333'
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
