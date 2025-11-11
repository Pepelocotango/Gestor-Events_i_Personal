import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useEventDataStore } from '@gep/core/mobile';
import type { EventFrame, PersonGroup, MaterialItem } from '@gep/core/mobile';


const DataSummary: React.FC = () => {
  // Utilitzem selectors individuals per optimitzar els re-renders
  const eventFrames = useEventDataStore((state) => state.eventFrames);
  const peopleGroups = useEventDataStore((state) => state.peopleGroups);
  const materialItems = useEventDataStore((state) => state.materialItems);

  const renderSection = (title: string, items: (EventFrame | PersonGroup | MaterialItem)[]) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length > 0 ? (
        items.map((item) => (
          <View key={item.id} style={styles.itemContainer}>
            <Text style={styles.itemText}>{'name' in item ? item.name : 'No-name'}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noItemsText}>No hi ha elements per mostrar.</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.header}>Resum de Dades</Text>
        {renderSection('Esdeveniments', eventFrames)}
        {renderSection('Persones / Grups', peopleGroups)}
        {renderSection('Materials', materialItems)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 4,
  },
  itemContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
  },
  noItemsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666666',
  },
});

export default DataSummary;
