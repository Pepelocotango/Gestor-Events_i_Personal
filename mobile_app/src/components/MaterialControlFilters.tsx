import React, { useMemo } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { EventFrame, MaterialItem } from '../types';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

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
  const theme = useDataStore((state: any) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const allOrigins = Array.from(new Set(materialItems.map(item => item.location))).sort();
  const allCategories = Array.from(new Set(materialItems.map(item => item.category))).sort();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.background,
      color: colors.text,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    picker: {
        color: colors.text,
    }
  }), [colors]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca per text..."
        placeholderTextColor={colors.placeholder}
        value={filters.searchText}
        onChangeText={(val) => handleFilterChange('searchText', val)}
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedEventIds}
          onValueChange={(itemValue) => handleFilterChange('selectedEventIds', itemValue || '')}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="-- Tots els Esdeveniments --" value="" color={colors.placeholder} />
          {eventFrames.map(ef => (
            <Picker.Item key={ef.id} label={ef.name} value={ef.id} color={colors.text} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedOrigins}
          onValueChange={(itemValue) => handleFilterChange('selectedOrigins', itemValue || '')}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="-- Tots els Orígens --" value="" color={colors.placeholder} />
          {allOrigins.map(o => (
            <Picker.Item key={o} label={o} value={o} color={colors.text} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filters.selectedCategories}
          onValueChange={(itemValue) => handleFilterChange('selectedCategories', itemValue || '')}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="-- Totes les Categories --" value="" color={colors.placeholder} />
          {allCategories.map(c => (
            <Picker.Item key={c} label={c} value={c} color={colors.text} />
          ))}
        </Picker>
      </View>
      <Button title="Netejar Filtres" onPress={clearFilters} color={colors.primary} />
    </View>
  );
};

export default MaterialControlFilters;
