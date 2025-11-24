import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { EventsStackParamList } from '../navigation';
import { EventFrame } from '../types';
import EventFrameCard from '../components/EventFrameCard';
import FilterControls from '../components/FilterControls';
import ActionToolbar from '../components/ActionToolbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lightTheme, darkTheme } from '../utils/themes';

type EventsScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'EventList'>;

type Props = {
  navigation: EventsScreenNavigationProp;
};

const EventsScreen = ({ navigation }: Props) => {
  const {
    fileName,
    eventFrames,
    peopleGroups,
    deleteEventFrame,
    theme,
  } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState<Set<string>>(new Set());
  const [unlockedAssignmentIds, setUnlockedAssignmentIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' });

  useFocusEffect(
    useCallback(() => {
      // S'executa quan la pantalla guanya el focus
      return () => {
        // S'executa quan la pantalla perd el focus
        setUnlockedAssignmentIds(new Set());
        setExpandedAssignmentIds(new Set());
      };
    }, [])
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    peopleGroups.forEach(p => map.set(p.id, p.name));
    return map;
  }, [peopleGroups]);

  const filteredEventFrames = useMemo(() => {
    let filtered = eventFrames.filter(ef => (ef.isArchived || false) === showArchived);

    if (filters.text) {
        const lowerCaseText = filters.text.toLowerCase();
        filtered = filtered.filter(frame =>
            frame.name.toLowerCase().includes(lowerCaseText) ||
            frame.place?.toLowerCase().includes(lowerCaseText) ||
            frame.generalNotes?.toLowerCase().includes(lowerCaseText) ||
            frame.assignments.some(a => peopleMap.get(a.personGroupId)?.toLowerCase().includes(lowerCaseText))
        );
    }
    if (filters.person) filtered = filtered.filter(frame => frame.assignments.some(a => a.personGroupId === filters.person));
    if (filters.eventFrame) filtered = filtered.filter(frame => frame.id === filters.eventFrame);

    return filtered.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  }, [eventFrames, filters, showArchived, sortOrder, peopleMap]);

  const areAllExpanded = useMemo(() => {
      if (filteredEventFrames.length === 0) return true;
      return filteredEventFrames.every(ef => expandedIds.has(ef.id));
  }, [expandedIds, filteredEventFrames]);

  const toggleAllCards = () => {
    if (areAllExpanded) {
        setExpandedIds(new Set());
    } else {
        const allIds = new Set(filteredEventFrames.map(ef => ef.id));
        setExpandedIds(allIds);
    }
  };

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleAssignmentExpand = useCallback((assignmentId: string) => {
    setExpandedAssignmentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assignmentId)) {
            newSet.delete(assignmentId);
        } else {
            newSet.add(assignmentId);
        }
        return newSet;
    });
  }, []);

  const toggleAssignmentLock = useCallback((assignmentId: string) => {
    setUnlockedAssignmentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assignmentId)) {
            newSet.delete(assignmentId);
        } else {
            newSet.add(assignmentId);
        }
        return newSet;
    });
    // Ensure assignment is not expanded when locked
    setExpandedAssignmentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
    });
  }, []);

  const clearFilters = () => setFilters({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' });

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Eliminar Esdeveniment", "¿Esteu segur?",
      [{ text: "Cancel·lar", style: "cancel" }, { text: "Eliminar", onPress: () => deleteEventFrame(id), style: 'destructive' }]
    );
  }, [deleteEventFrame]);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text,
    },
    message: {
      color: colors.text,
      textAlign: 'center',
    },
    emptyList: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      backgroundColor: colors.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  }), [colors]);

  if (!fileName) {
    return (
      <View style={dynamicStyles.centered}>
        <Text style={dynamicStyles.title}>No hi ha cap fitxer obert</Text>
        <Text style={dynamicStyles.message}>Feu servir el botó "Obrir" de la capçalera per carregar un projecte.</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <FilterControls
        filters={filters}
        setFilters={setFilters}
        peopleGroups={peopleGroups}
        eventFrames={eventFrames}
        clearFilters={clearFilters}
      />
      <ActionToolbar
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        toggleAllCards={toggleAllCards}
        areAllExpanded={areAllExpanded}
      />
      <FlatList
        data={filteredEventFrames}
        keyExtractor={(item: EventFrame) => item.id}
        renderItem={({ item }) => (
          <EventFrameCard
            eventFrame={item}
            isExpanded={expandedIds.has(item.id)}
            onToggleExpand={toggleExpand}
            expandedAssignmentIds={expandedAssignmentIds}
            onToggleAssignmentExpand={toggleAssignmentExpand}
            unlockedAssignmentIds={unlockedAssignmentIds}
            onToggleAssignmentLock={toggleAssignmentLock}
            onEditEvent={(id) => navigation.navigate('EventForm', { eventId: id })}
            onDeleteEvent={handleDelete}
            peopleMap={peopleMap}
            navigation={navigation}
          />
        )}
        ListEmptyComponent={<Text style={dynamicStyles.emptyList}>No s'han trobat esdeveniments amb aquests filtres.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('EventForm', {})}
      >
        <Icon name="plus" size={30} color={theme === 'dark' ? darkTheme.background : lightTheme.background} />
      </TouchableOpacity>
    </View>
  );
};

export default EventsScreen;
