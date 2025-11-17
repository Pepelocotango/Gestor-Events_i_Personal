import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { EventsStackParamList } from '../navigation';
import { EventFrame } from '../types';
import EventFrameCard from '../components/EventFrameCard';
import FilterControls from '../components/FilterControls';
import ActionToolbar from '../components/ActionToolbar';

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
  } = useDataStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    peopleGroups.forEach(p => map.set(p.id, p.name));
    return map;
  }, [peopleGroups]);

  const filteredEventFrames = useMemo(() => {
    const { text, person, status, date, place, eventFrame } = filters;

    let filtered = eventFrames.filter(ef => ef.isArchived === showArchived);

    if (text) {
        const lowerCaseText = text.toLowerCase();
        filtered = filtered.filter(frame =>
            frame.name.toLowerCase().includes(lowerCaseText) ||
            frame.place?.toLowerCase().includes(lowerCaseText) ||
            frame.generalNotes?.toLowerCase().includes(lowerCaseText) ||
            frame.assignments.some(a => peopleMap.get(a.personGroupId)?.toLowerCase().includes(lowerCaseText))
        );
    }
    if (person) filtered = filtered.filter(frame => frame.assignments.some(a => a.personGroupId === person));
    if (status) filtered = filtered.filter(frame => frame.assignments.some(a => a.status === status));
    if (place) filtered = filtered.filter(frame => frame.place === place);
    if (eventFrame) filtered = filtered.filter(frame => frame.id === eventFrame);
    // Date filter logic would go here if we had a proper date picker

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

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const clearFilters = () => setFilters({ text: '', person: '', status: '', date: '', place: '', eventFrame: '' });

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar Esdeveniment", "¿Esteu segur?",
      [{ text: "Cancel·lar", style: "cancel" }, { text: "Eliminar", onPress: () => deleteEventFrame(id), style: 'destructive' }]
    );
  };

  if (!fileName) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>No hi ha cap fitxer obert</Text>
        <Text>Feu servir el botó "Obrir" de la capçalera per carregar un projecte.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            onEditEvent={(id) => navigation.navigate('EventForm', { eventId: id })}
            onDeleteEvent={handleDelete}
            peopleMap={peopleMap}
            navigation={navigation}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>No s'han trobat esdeveniments amb aquests filtres.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default EventsScreen;
