import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Assignment, AssignmentStatus } from '../types';
import { getDaysBetween } from '../utils/dates';
import { useDataStore } from '../stores/dataStore';
import { getStatusColor } from '../utils/statusUtils';
import { format } from 'date-fns';
import { lightTheme, darkTheme } from '../utils/themes';

interface DailyStatusEditorProps {
  assignment: Assignment;
  eventFrameId: string;
  isUnlocked: boolean;
}

const DailyStatusEditor: React.FC<DailyStatusEditorProps> = ({ assignment, eventFrameId, isUnlocked }) => {
  const { updateDailyAssignmentStatus, theme } = useDataStore(state => ({
    updateDailyAssignmentStatus: state.updateDailyAssignmentStatus,
    theme: state.theme,
  }));
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const days = getDaysBetween(assignment.startDate, assignment.endDate);

  const getStatusForDay = (date: Date): AssignmentStatus => {
    const dateString = format(date, 'yyyy-MM-dd');
    return assignment.dailyStatuses?.[dateString] || AssignmentStatus.Pending;
  };

  const handleStatusChange = (date: Date, currentStatus: AssignmentStatus) => {
    const statuses: AssignmentStatus[] = [
        AssignmentStatus.Pending,
        AssignmentStatus.Yes,
        AssignmentStatus.No
    ];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    updateDailyAssignmentStatus(eventFrameId, assignment.id, format(date, 'yyyy-MM-dd'), nextStatus);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: 10,
      marginLeft: 15,
      paddingLeft: 10,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    dayText: {
      fontSize: 14,
      color: colors.text,
    },
    statusText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {days.map(day => {
        const dayStatus = getStatusForDay(day);
        return (
          <View key={day.toISOString()} style={styles.dayRow}>
            <Text style={styles.dayText}>
              {day.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </Text>
            <TouchableOpacity
              onPress={() => handleStatusChange(day, dayStatus)}
              disabled={!isUnlocked}
            >
              <Text style={[
                styles.statusText,
                { color: getStatusColor(dayStatus), opacity: isUnlocked ? 1 : 0.4 }
              ]}>
                {dayStatus}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

export default DailyStatusEditor;
