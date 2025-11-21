import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDataStore, selectMaterialControlData } from '../stores/dataStore';
import MaterialControlFilters from '../components/MaterialControlFilters';
import MaterialControlList from '../components/MaterialControlList';
import { lightTheme, darkTheme } from '../utils/themes';

const MaterialControlScreen = () => {
  const { eventFrames, materialItems, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

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

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
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

export default MaterialControlScreen;
