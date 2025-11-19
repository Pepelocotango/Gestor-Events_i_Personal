import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialItem } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type MaterialListItemProps = {
  item: MaterialItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const MaterialListItem: React.FC<MaterialListItemProps> = ({ item, onEdit, onDelete }) => {
  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.name}</Text>
        <Text style={styles.itemSubText}>Estoc: {item.stock} | Ubicació: {item.location}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => onEdit(item.id)}>
          <Icon name="pencil" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Icon name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});

export default React.memo(MaterialListItem);
