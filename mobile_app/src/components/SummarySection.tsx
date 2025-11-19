import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AssignmentStatus, SummaryRow } from '../types';
import { formatDateRangeDMY, formatDateDMY } from '../utils/dateFormat';
import CollapsibleSection from './CollapsibleSection';

type GroupingType = 'event' | 'date' | 'person';

type Props = {
  title: string;
  data: [string, SummaryRow[]][];
  groupingType: GroupingType;
  isExpanded: boolean;
  onToggle: () => void;
};

const getStatusColor = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.Yes: return '#4CAF50'; // Green
    case AssignmentStatus.Pending: return '#FFC107'; // Amber
    case AssignmentStatus.No: return '#F44336'; // Red
    case AssignmentStatus.Mixed: return '#2196F3'; // Blue
    default: return '#333';
  }
};

const SummarySection = ({ title, data, groupingType, isExpanded, onToggle }: Props) => {
  const getLabel = (a: SummaryRow) => {
    if (groupingType === 'person') {
      return `${a.eventFrameName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
    }
    if (groupingType === 'date') {
      return `${a.assignmentPersonName} - ${a.eventFrameName}`;
    }
    return `${a.assignmentPersonName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
  };

  return (
    <CollapsibleSection title={title} isExpanded={isExpanded} onToggle={onToggle}>
      {data.length === 0 ? (
        <Text style={styles.noDataText}>No hi ha dades per aquest resum.</Text>
      ) : (
        data.map(([groupKey, assignments]) => (
          <View key={groupKey} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{groupKey}</Text>
            {assignments.map(a => {
              const status = Object.values(AssignmentStatus).includes(a.assignmentStatus as AssignmentStatus)
                ? a.assignmentStatus as AssignmentStatus
                : undefined;

              return (
                <View key={a.id} style={styles.assignmentContainer}>
                  <Text style={styles.assignmentText}>
                    {getLabel(a)}
                    {status && (
                      <>
                        {' - '}
                        <Text style={{ color: getStatusColor(status), fontWeight: 'bold' }}>
                          ({status})
                        </Text>
                      </>
                    )}
                  </Text>
                  {a.assignmentStatus === AssignmentStatus.Mixed && a.assignmentObject.dailyStatuses && (
                    <View style={styles.mixedDetailsContainer}>
                      {Object.entries(a.assignmentObject.dailyStatuses)
                        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                        .map(([date, dailyStatus]) => {
                          const validDailyStatus = Object.values(AssignmentStatus).includes(dailyStatus as AssignmentStatus)
                            ? dailyStatus as AssignmentStatus
                            : undefined;

                          if (!validDailyStatus) return null;

                          return (
                            <Text key={date} style={[styles.mixedDetailText, { color: getStatusColor(validDailyStatus) }]}>
                              {formatDateDMY(date)} - {validDailyStatus}
                            </Text>
                          );
                        })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))
      )}
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  noDataText: {
    fontStyle: 'italic',
    color: '#666',
  },
  groupContainer: {
    marginBottom: 15,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007AFF',
  },
  assignmentContainer: {
    marginLeft: 10,
    marginBottom: 5,
  },
  assignmentText: {
    fontSize: 14,
  },
  mixedDetailsContainer: {
    marginLeft: 15,
    marginTop: 5,
  },
  mixedDetailText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default React.memo(SummarySection);
