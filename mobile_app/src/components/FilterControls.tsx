import React from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AssignmentStatus, PersonGroup } from '../types';

interface FilterControlsProps {
  filters: {
    text: string;
    person: string;
    status: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  peopleGroups: PersonGroup[];
  clearFilters: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, peopleGroups, clearFilters }) => {
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca general..."
        value={filters.text}
        onChangeText={(val) => handleFilterChange('text', val)}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.person}
          onValueChange={(itemValue) => handleFilterChange('person', itemValue)}
        >
          <Picker.Item label="-- Totes les Persones --" value="" />
          {peopleGroups.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.status}
          onValueChange={(itemValue) => handleFilterChange('status', itemValue)}
        >
          <Picker.Item label="-- Tots els Estats --" value="" />
          {Object.values(AssignmentStatus).map(s => <Picker.Item key={s} label={s} value={s} />)}
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default FilterControls;
