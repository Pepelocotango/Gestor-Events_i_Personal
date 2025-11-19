import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { EventFrame, MaterialItem } from '../types';

interface MaterialControlFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  eventFrames: EventFrame[];
  materialItems: MaterialItem[];
  clearFilters: () => void;
}

const MaterialControlFilters: React.FC<MaterialControlFiltersProps> = ({
  filters,
  setFilters,
  eventFrames,
  materialItems,
  clearFilters,
}) => {
  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const allOrigins = Array.from(new Set(materialItems.map(item => item.location))).sort();
  const allCategories = Array.from(new Set(materialItems.map(item => item.category))).sort();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca per text..."
        value={filters.searchText}
        onChangeText={(val) => handleFilterChange('searchText', val)}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedEventIds}
          onValueChange={(itemValue) => handleFilterChange('selectedEventIds', itemValue || '')}
        >
          <Picker.Item label="-- Tots els Esdeveniments --" value="" />
          {eventFrames.map(ef => (
            <Picker.Item key={ef.id} label={ef.name} value={ef.id} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedOrigins}
          onValueChange={(itemValue) => handleFilterChange('selectedOrigins', itemValue || '')}
        >
          <Picker.Item label="-- Tots els Orígens --" value="" />
          {allOrigins.map(o => (
            <Picker.Item key={o} label={o} value={o} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedCategories}
          onValueChange={(itemValue) => handleFilterChange('selectedCategories', itemValue || '')}
        >
          <Picker.Item label="-- Totes les Categories --" value="" />
          {allCategories.map(c => (
            <Picker.Item key={c} label={c} value={c} />
          ))}
        </Picker>
      </View>
      <Button title="Netejar Filtres" onPress={clearFilters} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
  },
});

export default MaterialControlFilters;
