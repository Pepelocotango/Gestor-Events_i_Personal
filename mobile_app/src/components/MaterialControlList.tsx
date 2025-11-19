import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialControlRow } from '../types';

interface MaterialControlListProps {
  data: MaterialControlRow[];
}

const MaterialControlList: React.FC<MaterialControlListProps> = ({ data }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const renderItem = ({ item }: { item: MaterialControlRow }) => {
    const isExpanded = expandedIds.has(item.item.id);
    const balanceIsNegative = item.balance < 0;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => toggleExpand(item.item.id)}>
          <View style={styles.mainRow}>
            <Text style={styles.itemName}>{item.item.name}</Text>
            <Text style={balanceIsNegative ? styles.negativeBalance : styles.positiveBalance}>
              Balanç: {item.balance}
            </Text>
          </View>
          <Text>Estoc: {item.item.stock} / Demanda: {item.totalDemand}</Text>
          <Text style={styles.details}>Categoria: {item.item.category} / Origen: {item.item.location}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.breakdownContainer}>
            <Text style={styles.breakdownTitle}>Desglossament:</Text>
            {item.breakdown.map(bd => (
              <Text key={bd.eventFrameId} style={styles.breakdownItem}>
                - {bd.eventName}: {bd.quantity} unitat(s)
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.item.id}
      ListEmptyComponent={<Text style={styles.emptyText}>No s'han trobat resultats.</Text>}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 15,
        marginVertical: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#eee',
    },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    details: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    negativeBalance: {
        color: 'red',
        fontWeight: 'bold',
    },
    positiveBalance: {
        color: 'green',
        fontWeight: 'bold',
    },
    breakdownContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    breakdownTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    breakdownItem: {
        marginLeft: 10,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
    },
});

export default MaterialControlList;
