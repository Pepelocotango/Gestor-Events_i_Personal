import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialItem } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

type MaterialListItemProps = {
  item: MaterialItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const MaterialListItem: React.FC<MaterialListItemProps> = ({ item, onEdit, onDelete }) => {
  const { theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const dynamicStyles = useMemo(() => StyleSheet.create({
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    itemContent: {
      flex: 1,
      marginRight: 10,
    },
    itemText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    itemSubText: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 4,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.item}>
      <View style={dynamicStyles.itemContent}>
        <Text style={dynamicStyles.itemText}>{item.name}</Text>
        <Text style={dynamicStyles.itemSubText}>Estoc: {item.stock} | Ubicació: {item.location}</Text>
      </View>
      <View style={dynamicStyles.itemActions}>
        <TouchableOpacity onPress={() => onEdit(item.id)}>
          <Icon name="pencil" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Icon name="delete" size={24} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(MaterialListItem);
