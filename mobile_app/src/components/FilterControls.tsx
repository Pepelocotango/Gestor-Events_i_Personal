import React from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AssignmentStatus, PersonGroup, EventFrame } from '../types';

interface FilterControlsProps {
  filters: {
    text: string;
    person: string;
    status: string;
    date: string;
    place: string;
    eventFrame: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  peopleGroups: PersonGroup[];
  eventFrames: EventFrame[];
  clearFilters: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, peopleGroups, eventFrames, clearFilters }) => {
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const allPlaces = Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean))).sort();

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca general..."
        value={filters.text}
        onChangeText={(val) => handleFilterChange('text', val)}
      />
      <View style={styles.row}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={filters.eventFrame} onValueChange={(itemValue) => handleFilterChange('eventFrame', itemValue)}>
            <Picker.Item label="-- Esdeveniment --" value="" />
            {eventFrames.map(ef => <Picker.Item key={ef.id} label={ef.name} value={ef.id} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={filters.person} onValueChange={(itemValue) => handleFilterChange('person', itemValue)}>
            <Picker.Item label="-- Persona --" value="" />
            {peopleGroups.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={filters.status} onValueChange={(itemValue) => handleFilterChange('status', itemValue)}>
            <Picker.Item label="-- Estat --" value="" />
            {Object.values(AssignmentStatus).map(s => <Picker.Item key={s} label={s} value={s} />)}
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
            <Picker selectedValue={filters.place} onValueChange={(itemValue) => handleFilterChange('place', itemValue)}>
                <Picker.Item label="-- Lloc --" value="" />
                {allPlaces.map(p => <Picker.Item key={p} label={p} value={p} />)}
            </Picker>
        </View>
      </View>
      {/* El filtre de data el gestionarem directament a EventsScreen, ja que requereix un DatePicker més complex */}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 2,
  },
});

export default FilterControls;
