import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDataStore, selectMaterialControlData } from '../stores/dataStore';
import MaterialControlFilters from '../components/MaterialControlFilters';
import MaterialControlList from '../components/MaterialControlList';

const MaterialControlScreen = () => {
  const { eventFrames, materialItems } = useDataStore();

  const [filters, setFilters] = useState({
    searchText: '',
    dateRange: { start: '', end: '' },
    selectedEventIds: '',
    selectedOrigins: '',
    selectedCategories: '',
  });

  const clearFilters = () => {
    setFilters({
      searchText: '',
      dateRange: { start: '', end: '' },
      selectedEventIds: '',
      selectedOrigins: '',
      selectedCategories: '',
    });
  };

  const data = useMemo(() => {
    return selectMaterialControlData({ eventFrames, materialItems }, filters);
  }, [eventFrames, materialItems, filters]);

  return (
    <View style={styles.container}>
      <MaterialControlFilters
        filters={filters}
        setFilters={setFilters}
        eventFrames={eventFrames}
        materialItems={materialItems}
        clearFilters={clearFilters}
      />
      <MaterialControlList data={data} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MaterialControlScreen;
