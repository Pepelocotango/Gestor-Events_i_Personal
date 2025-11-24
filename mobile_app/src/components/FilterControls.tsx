import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PersonGroup, EventFrame } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

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
  const { theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      padding: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 15,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
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
    pickerContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 4,
      overflow: 'hidden',
    },
    picker: {
      flex: 1,
      height: 44,
      color: colors.text,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.searchRow}>
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Cerca global..."
          placeholderTextColor={colors.placeholder}
          value={filters.text}
          onChangeText={(value) => handleFilterChange('text', value)}
        />
        <TouchableOpacity onPress={clearFilters} style={dynamicStyles.clearButton}>
          <Icon name="filter-remove" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={dynamicStyles.pickerRow}>
        <View style={dynamicStyles.pickerContainer}>
          <Picker
            selectedValue={filters.person}
            onValueChange={(itemValue) => handleFilterChange('person', itemValue)}
            style={dynamicStyles.picker}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Totes les persones" value="" color={colors.placeholder}/>
            {peopleGroups.map((p) => (
              <Picker.Item key={p.id} label={p.name} value={p.id} color={colors.text}/>
            ))}
          </Picker>
        </View>
        <View style={dynamicStyles.pickerContainer}>
          <Picker
            selectedValue={filters.eventFrame}
            onValueChange={(itemValue) => handleFilterChange('eventFrame', itemValue)}
            style={dynamicStyles.picker}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="Tots els esdeveniments" value="" color={colors.placeholder} />
            {eventFrames.map((ef) => (
              <Picker.Item key={ef.id} label={ef.name} value={ef.id} color={colors.text} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
};

export default FilterControls;
