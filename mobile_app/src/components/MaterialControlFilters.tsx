import React, { useMemo } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import CustomSelect from './CustomSelect';
import { EventFrame, MaterialItem } from '../types';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const allOrigins = Array.from(new Set(materialItems.map(item => item.location))).sort();
  const allCategories = Array.from(new Set(materialItems.map(item => item.category))).sort();

  const eventOptions = [{ label: t('mobile.filters.all_events'), value: '' }, ...eventFrames.map(ef => ({ label: ef.name, value: ef.id }))];
  const originOptions = [{ label: t('mobile.filters.all_origins'), value: '' }, ...allOrigins.map(o => ({ label: o, value: o }))];
  const categoryOptions = [{ label: t('mobile.filters.all_categories'), value: '' }, ...allCategories.map(c => ({ label: c, value: c }))];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      padding: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.card,
      color: colors.text,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerContainer: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 4,
      overflow: 'hidden',
    },
    picker: {
        color: colors.text,
        backgroundColor: colors.card,
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
        <CustomSelect
          value={filters.selectedEventIds}
          onValueChange={(val) => handleFilterChange('selectedEventIds', val)}
          options={eventOptions}
          placeholder={t('mobile.filters.all_events')}
        />
      </View>
      <View style={styles.pickerContainer}>
        <CustomSelect
          value={filters.selectedOrigins}
          onValueChange={(val) => handleFilterChange('selectedOrigins', val)}
          options={originOptions}
          placeholder={t('mobile.filters.all_origins')}
        />
      </View>
      <View style={styles.pickerContainer}>
        <CustomSelect
          value={filters.selectedCategories}
          onValueChange={(val) => handleFilterChange('selectedCategories', val)}
          options={categoryOptions}
          placeholder={t('mobile.filters.all_categories')}
        />
      </View>
      <Button title={t('main.clean_filters')} onPress={clearFilters} color={colors.primary} />
    </View>
  );
};

export default MaterialControlFilters;
