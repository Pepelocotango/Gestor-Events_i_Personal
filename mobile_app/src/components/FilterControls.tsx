import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PersonGroup, EventFrame } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type FilterControlsProps = {
  filters: { text: string; person: string; status: string; date: string; place: string; eventFrame: string };
  setFilters: (filters: FilterControlsProps['filters']) => void;
  peopleGroups: PersonGroup[];
  eventFrames: EventFrame[];
  clearFilters: () => void;
};

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  peopleGroups,
  eventFrames,
  clearFilters,
}) => {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca global..."
          value={filters.text}
          onChangeText={(value) => handleFilterChange('text', value)}
        />
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Icon name="filter-remove" size={24} color="#555" />
        </TouchableOpacity>
      </View>
      <View style={styles.pickerRow}>
        <Picker
          selectedValue={filters.person}
          onValueChange={(itemValue) => handleFilterChange('person', itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Totes les persones" value="" />
          {peopleGroups.map((p) => (
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          ))}
        </Picker>
        <Picker
          selectedValue={filters.eventFrame}
          onValueChange={(itemValue) => handleFilterChange('eventFrame', itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Tots els esdeveniments" value="" />
          {eventFrames.map((ef) => (
            <Picker.Item key={ef.id} label={ef.name} value={ef.id} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  picker: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
});

export default FilterControls;
