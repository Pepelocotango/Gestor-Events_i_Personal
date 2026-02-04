import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { AssignmentStatus, SummaryRow } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import SummarySection from '../components/SummarySection';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

const SECTION_KEYS = ['event', 'date', 'person'];

const SummaryScreen = () => {
  const { t } = useTranslation();
  const { eventFrames, peopleGroups, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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

  const summaryByStartDate = useMemo(() => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
      const dateStr = formatDateDMY(row.assignmentStartDate);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(row);
    });
    return [...map.entries()].sort((a, b) => {
      const dateA = new Date(a[0].split('/').reverse().join('-')).getTime();
      const dateB = new Date(b[0].split('/').reverse().join('-')).getTime();
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

  const handleToggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const areAllExpanded = useMemo(() => {
    return SECTION_KEYS.every(key => expandedSections[key]);
  }, [expandedSections]);

  const toggleAllSections = () => {
    if (areAllExpanded) {
      setExpandedSections({});
    } else {
      const allExpanded: Record<string, boolean> = {};
      SECTION_KEYS.forEach(key => { allExpanded[key] = true; });
      setExpandedSections(allExpanded);
    }
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 8,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 10,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    buttonText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
  }), [colors]);

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.toolbar}>
        <TouchableOpacity style={dynamicStyles.button} onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          <Icon name={sortOrder === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={24} color={colors.text} />
          <Text style={dynamicStyles.buttonText}>{t('mobile.summary.sort_by_date')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.button} onPress={toggleAllSections}>
          <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text} />
          <Text style={dynamicStyles.buttonText}>{areAllExpanded ? t('mobile.summary.collapse_all') : t('mobile.summary.expand_all')}</Text>
        </TouchableOpacity>
      </View>

      <SummarySection
        title={t('main.event')}
        data={summaryByEventName}
        groupingType="event"
        isExpanded={!!expandedSections.event}
        onToggle={() => handleToggleSection('event')}
      />
      <SummarySection
        title={t('main.start_date')}
        data={summaryByStartDate}
        groupingType="date"
        isExpanded={!!expandedSections.date}
        onToggle={() => handleToggleSection('date')}
      />
      <SummarySection
        title={t('main.person')}
        data={summaryByPerson}
        groupingType="person"
        isExpanded={!!expandedSections.person}
        onToggle={() => handleToggleSection('person')}
      />
    </ScrollView>
  );
};

export default SummaryScreen;
