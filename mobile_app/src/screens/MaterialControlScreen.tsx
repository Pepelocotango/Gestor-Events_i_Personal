import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { useDataStore, selectMaterialControlData } from '../stores/dataStore';
import { MaterialControlFilters } from '../types';

const MaterialControlScreen = () => {
  const { eventFrames, materialItems } = useDataStore();
  const [filters, setFilters] = useState<MaterialControlFilters>({
    searchText: '',
  });

  const data = useMemo(() => {
    return selectMaterialControlData({ eventFrames, materialItems }, filters);
  }, [eventFrames, materialItems, filters]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Centre de Control de Material</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca per nom, categoria..."
        value={filters.searchText}
        onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
      />
      <FlatList
        data={data}
        keyExtractor={item => item.item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemName}>{item.item.name}</Text>
            <Text>Estoc: {item.item.stock}</Text>
            <Text>Demanda: {item.totalDemand}</Text>
            <Text style={item.balance < 0 ? styles.negativeBalance : styles.positiveBalance}>
              Balanç: {item.balance}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hi ha dades per mostrar amb aquests filtres.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  searchInput: {
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  row: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontWeight: 'bold',
  },
  negativeBalance: {
    color: 'red',
  },
  positiveBalance: {
    color: 'green',
  },
});

export default MaterialControlScreen;
