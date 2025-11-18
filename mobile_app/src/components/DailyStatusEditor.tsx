import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Assignment, AssignmentStatus } from '../types';
import { getDaysBetween } from '../utils/dates';
import { useDataStore } from '../stores/dataStore';
import { getStatusColor } from '../utils/statusUtils';
import { format } from 'date-fns';

interface DailyStatusEditorProps {
  assignment: Assignment;
  eventFrameId: string;
}

const DailyStatusEditor: React.FC<DailyStatusEditorProps> = ({ assignment, eventFrameId }) => {
  const { updateDailyAssignmentStatus } = useDataStore();
  const days = getDaysBetween(assignment.startDate, assignment.endDate);

  const getStatusForDay = (date: Date): AssignmentStatus => {
    const dateString = format(date, 'yyyy-MM-dd');
    // Default to 'Pendent' if no specific status is set for the day
    return assignment.dailyStatuses?.[dateString] || AssignmentStatus.Pending;
  };

  const handleStatusChange = (date: Date, currentStatus: AssignmentStatus) => {
    const statuses: AssignmentStatus[] = [
        AssignmentStatus.Pending,
        AssignmentStatus.Yes,
        AssignmentStatus.No
    ];
    const currentIndex = statuses.indexOf(currentStatus);
    // Cycle through: Pendent -> Sí -> No -> Pendent
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    updateDailyAssignmentStatus(eventFrameId, assignment.id, format(date, 'yyyy-MM-dd'), nextStatus);
  };

  return (
    <View style={styles.container}>
      {days.map(day => {
        const dayStatus = getStatusForDay(day);
        return (
          <View key={day.toISOString()} style={styles.dayRow}>
            <Text style={styles.dayText}>
              {day.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => handleStatusChange(day, dayStatus)}>
              <Text style={[styles.statusText, { color: getStatusColor(dayStatus) }]}>
                {dayStatus}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginLeft: 15,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DailyStatusEditor;
