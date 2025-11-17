import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EventFrame } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EventFrameCardProps = {
  eventFrame: EventFrame;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  peopleMap: Map<string, string>;
  navigation: StackNavigationProp<any>; // Quick fix for typing issue
};

const EventFrameCard: React.FC<EventFrameCardProps> = ({
  eventFrame,
  isExpanded,
  onToggleExpand,
  onEditEvent,
  onDeleteEvent,
  peopleMap,
  navigation,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onToggleExpand(eventFrame.id)} style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.eventName}>{eventFrame.name}</Text>
          <Text style={styles.eventDate}>
            {new Date(eventFrame.startDate).toLocaleDateString('ca-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
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
          {eventFrame.assignments.map(assignment => (
            <View key={assignment.id} style={styles.assignmentRow}>
              <Text style={styles.assignmentPerson}>
                {peopleMap.get(assignment.personGroupId) || 'Persona desconeguda'}
              </Text>
              <Text style={styles.assignmentStatus}>{assignment.status}</Text>
            </View>
          ))}
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
      assignmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
      },
      assignmentPerson: {
        fontSize: 14,
      },
      assignmentStatus: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#555',
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

export default EventFrameCard;
