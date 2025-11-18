import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { EventFrame } from '../types';
import { formatDate } from '../utils/dateFormat';

type Props = {
  item: EventFrame;
  onPress: () => void;
};

const TechSheetListItem = ({ item, onPress }: Props) => {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default React.memo(TechSheetListItem);
