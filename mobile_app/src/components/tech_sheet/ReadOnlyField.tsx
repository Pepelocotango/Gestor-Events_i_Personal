import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDataStore } from '../../stores/dataStore';
import { lightTheme, darkTheme } from '../../utils/themes';
import { useTranslation } from 'react-i18next';

type ReadOnlyFieldProps = {
  label: string;
  value: string | undefined | null;
};

export default function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  const { t } = useTranslation();
  const themeName = useDataStore((state) => state.theme);
  const colors = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.fieldContainer, { alignItems: 'flex-start' }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}:</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value || t('mobile.tech_sheet_components.not_specified')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 120,
  },
  value: {
    flex: 1,
  },
});
