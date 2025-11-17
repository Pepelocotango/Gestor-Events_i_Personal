import React, { useLayoutEffect, useState, useMemo } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { SAFFileService } from '../services/SAFFileService';
import { StackNavigationProp } from '@react-navigation/stack';
import { EventsStackParamList } from '../navigation';
import { EventFrame, AssignmentStatus } from '../types';
import EventFrameCard from '../components/EventFrameCard';
import FilterControls from '../components/FilterControls';

const fileService = new SAFFileService();

type EventsScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'EventList'>;

type Props = {
  navigation: EventsScreenNavigationProp;
};

const EventsScreen = ({ navigation }: Props) => {
  const {
    fileName,
    eventFrames,
    peopleGroups,
    hasUnsavedChanges,
    setData,
    clearData,
    saveData,
    deleteEventFrame,
  } = useDataStore();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ text: '', person: '', status: '' });

  const peopleMap = useMemo(() => {
    const map = new Map<string, string>();
    peopleGroups.forEach(p => map.set(p.id, p.name));
    return map;
  }, [peopleGroups]);

  const filteredEventFrames = useMemo(() => {
    const { text, person, status } = filters;
    if (!text && !person && !status) {
      return eventFrames;
    }

    const lowerCaseText = text.toLowerCase();

    return eventFrames.filter(frame => {
      const matchesText = text ?
        frame.name.toLowerCase().includes(lowerCaseText) ||
        frame.place?.toLowerCase().includes(lowerCaseText) ||
        frame.generalNotes?.toLowerCase().includes(lowerCaseText) ||
        frame.assignments.some(a => peopleMap.get(a.personGroupId)?.toLowerCase().includes(lowerCaseText))
        : true;

      const matchesPerson = person ?
        frame.assignments.some(a => a.personGroupId === person)
        : true;

      const matchesStatus = status ?
        frame.assignments.some(a => a.status === status)
        : true;

      return matchesText && matchesPerson && matchesStatus;
    });
  }, [eventFrames, filters, peopleMap]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const clearFilters = () => setFilters({ text: '', person: '', status: '' });

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar Esdeveniment", "¿Esteu segur?",
      [{ text: "Cancel·lar", style: "cancel" }, { text: "Eliminar", onPress: () => deleteEventFrame(id), style: 'destructive' }]
    );
  };

    const handleOpenFile = async () => {
    const openAndSetData = async () => {
      try {
        const result = await fileService.openFile();
        if (result) {
          setData(result.content, result.name);
        }
      } catch (error) {
        Alert.alert("Error", "El fitxer seleccionat no és vàlid o està malmès.");
      }
    };

    if (hasUnsavedChanges) {
      Alert.alert(
        "Descartar canvis?",
        "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer actual i descartar els canvis?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: openAndSetData },
        ]
      );
    } else {
      await openAndSetData();
    }
  };

  const handleSaveFile = async () => {
    try {
      await saveData();
      Alert.alert("Èxit", "S'ha iniciat el procés de desat. Trieu on desar el fitxer.");
    } catch (e) {
      Alert.alert("Error", "No s'ha pogut desar el fitxer.");
    }
  };

  const handleCloseFile = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Descartar canvis?",
        "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer i descartar els canvis?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: clearData },
        ]
      );
    } else {
      clearData();
    }
  };


  const { undo, redo } = useDataStore();
  // @ts-ignore
  const canUndo = useDataStore(state => state.temporal.pastStates.length > 0);
  // @ts-ignore
  const canRedo = useDataStore(state => state.temporal.futureStates.length > 0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: fileName || 'Gestor d\'Esdeveniments',
      headerLeft: () => (
        <View style={styles.headerButtons}>
            <Button title="Desfer" onPress={undo} disabled={!canUndo} />
            <Button title="Refer" onPress={redo} disabled={!canRedo} />
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerButtons}>
          {fileName ? (
            <>
              <Button title="Afegir" onPress={() => navigation.navigate('EventForm', {})} />
              <Button title="Desar" onPress={handleSaveFile} disabled={!hasUnsavedChanges} />
              <Button title="Tancar" onPress={handleCloseFile} />
            </>
          ) : (
            <Button title="Obrir" onPress={handleOpenFile} />
          )}
        </View>
      ),
    });
  }, [navigation, fileName, hasUnsavedChanges, canUndo, canRedo, undo, redo]);

  if (!fileName) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Benvingut</Text>
        <Text>Obriu un fitxer per començar a gestionar esdeveniments.</Text>
        <Button title="Obrir Fitxer" onPress={handleOpenFile} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterControls
        filters={filters}
        setFilters={setFilters}
        peopleGroups={peopleGroups}
        clearFilters={clearFilters}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginRight: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusComplete: {
    color: 'green',
  },
  statusIncomplete: {
    color: 'red',
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default EventsScreen;
