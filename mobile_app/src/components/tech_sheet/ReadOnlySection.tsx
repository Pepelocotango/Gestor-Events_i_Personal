import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDataStore } from '../../stores/dataStore';
import { lightTheme, darkTheme } from '../../utils/themes';

type ReadOnlySectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function ReadOnlySection({ title, children }: ReadOnlySectionProps) {
  const theme = useDataStore((state: any) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(() => StyleSheet.create({
    sectionContainer: {
      marginBottom: 16,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 4,
      color: colors.text,
    },
  }), [colors]);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
