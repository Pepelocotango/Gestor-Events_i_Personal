import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AssignmentStatus, SummaryRow } from '../types';
import { formatDateRangeDMY, formatDateDMY } from '../utils/dateFormat';
import CollapsibleSection from './CollapsibleSection';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';
import { getTranslatedStatus } from '../utils/statusUtils';

type GroupingType = 'event' | 'date' | 'person';

type Props = {
  title: string;
  data: [string, SummaryRow[]][];
  groupingType: GroupingType;
  isExpanded: boolean;
  onToggle: () => void;
};

const SummarySection = ({ title, data, groupingType, isExpanded, onToggle }: Props) => {
  const { t } = useTranslation();
  const theme = useDataStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.Yes: return colors['status-yes'];
      case AssignmentStatus.Pending: return colors['status-pending'];
      case AssignmentStatus.No: return colors['status-no'];
      case AssignmentStatus.Mixed: return colors['status-mixed'];
      default: return colors.text;
    }
  };

  const getLabel = (a: SummaryRow) => {
    if (groupingType === 'person') {
      return `${a.eventFrameName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
    }
    if (groupingType === 'date') {
      return `${a.assignmentPersonName} - ${a.eventFrameName}`;
    }
    return `${a.assignmentPersonName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
  };

  const styles = useMemo(() => StyleSheet.create({
    noDataText: {
      fontStyle: 'italic',
      color: colors.placeholder,
    },
    groupContainer: {
      marginBottom: 15,
    },
    groupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
      color: colors.primary,
    },
    assignmentContainer: {
      marginLeft: 10,
      marginBottom: 5,
    },
    assignmentText: {
      fontSize: 14,
      color: colors.text,
    },
    mixedDetailsContainer: {
      marginLeft: 15,
      marginTop: 5,
    },
    mixedDetailText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
  }), [colors]);

  return (
    <CollapsibleSection title={title} isExpanded={isExpanded} onToggle={onToggle}>
      {data.length === 0 ? (
        <Text style={styles.noDataText}>{t('mobile.summary.no_data')}</Text>
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
                          ({getTranslatedStatus(status, t)})
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
                              {formatDateDMY(date)} - {getTranslatedStatus(validDailyStatus, t)}
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

export default React.memo(SummarySection);
