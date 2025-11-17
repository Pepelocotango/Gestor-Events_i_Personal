import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, Button } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { AssignmentStatus, SummaryRow } from '../types';
import { formatDateRangeDMY } from '../utils/dateFormat';

const SummaryScreen = () => {
  const { eventFrames, peopleGroups } = useDataStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    peopleGroups.forEach(p => map.set(p.id, p.name));
    return map;
  }, [peopleGroups]);

  const allAssignmentsSummary = useMemo((): SummaryRow[] => {
    const summary: SummaryRow[] = [];
    eventFrames.forEach(ef => {
      ef.assignments.forEach(a => {
        const personName = peopleMap.get(a.personGroupId);
        summary.push({
          id: `${ef.id}-${a.id}`,
          primaryGrouping: ef.name,
          secondaryGrouping: personName || 'N/A',
          eventFrameName: ef.name,
          eventFramePlace: ef.place || '',
          eventFrameStartDate: ef.startDate,
          eventFrameEndDate: ef.endDate,
          assignmentPersonName: personName || 'N/A',
          assignmentStartDate: a.startDate,
          assignmentEndDate: a.endDate,
          assignmentStatus: a.status,
          assignmentNotes: a.notes || '',
          eventFrameGeneralNotes: ef.generalNotes || '',
          isMixedStatusAssignment: a.status === AssignmentStatus.Mixed,
          assignmentObject: a,
        });
      });
    });
    return summary;
  }, [eventFrames, peopleMap]);

  const summaryByEventName = useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
        if (!map.has(row.eventFrameName)) map.set(row.eventFrameName, []);
        map.get(row.eventFrameName)!.push(row);
    });
    return [...map.entries()].sort((a, b) => {
        const dateA = new Date(a[1][0].eventFrameStartDate).getTime();
        const dateB = new Date(b[1][0].eventFrameStartDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [allAssignmentsSummary, sortOrder]);

  const summaryByPerson = useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
        if (!map.has(row.assignmentPersonName)) map.set(row.assignmentPersonName, []);
        map.get(row.assignmentPersonName)!.push(row);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [allAssignmentsSummary]);

  const sections = [
      { title: "Per Nom d'Esdeveniment", data: summaryByEventName },
      { title: "Per Persona/Grup", data: summaryByPerson },
  ];

  const renderItem = ({ item }: { item: [string, SummaryRow[]] }) => (
    <View style={styles.groupContainer}>
      <Text style={styles.groupTitle}>{item[0]}</Text>
      {item[1].map(a => (
        <Text key={a.id} style={styles.assignmentText}>
          - {a.assignmentPersonName} ({formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)}) - {a.assignmentStatus}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Button
        title={`Ordena per Data (${sortOrder === 'asc' ? 'Ascendent' : 'Descendent'})`}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item[0] + index}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
  },
  groupContainer: {
    padding: 10,
    backgroundColor: 'white',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  assignmentText: {
    marginLeft: 10,
  },
});

export default SummaryScreen;
