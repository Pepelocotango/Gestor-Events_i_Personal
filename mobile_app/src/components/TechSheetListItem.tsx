import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EventFrame } from '../types';
import { formatDate } from '../utils/dateFormat';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

type Props = {
  item: EventFrame;
  onPress: () => void;
};

const TechSheetListItem = ({ item, onPress }: Props) => {
  const theme = useDataStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      borderColor: colors.border,
      borderWidth: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    detail: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.text,
    },
    bold: {
      fontWeight: 'bold',
      color: colors.text,
    },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.detail}>
        <Text style={styles.bold}>Lloc:</Text> {item.place || 'No especificat'}
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.bold}>Data:</Text> {formatDate(item.startDate)}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(TechSheetListItem);
