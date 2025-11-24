import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PersonGroup } from '../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { darkTheme, lightTheme } from '../utils/themes';

type PersonListItemProps = {
  item: PersonGroup;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const PersonListItem: React.FC<PersonListItemProps> = ({ item, onEdit, onDelete }) => {
  const themeName = useDataStore((state) => state.theme);
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(() => StyleSheet.create({
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    itemContent: {
      flex: 1,
      marginRight: 10,
    },
    itemText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    itemSubText: {
      fontSize: 14,
      color: theme.placeholder,
      marginTop: 2,
    },
    itemInfo: {
      fontSize: 12,
      color: theme.text,
      marginTop: 2,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
  }), [theme]);

  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.name}</Text>
        {item.role ? <Text style={styles.itemSubText}>{item.role}</Text> : null}
        {item.tel1 ? <Text style={styles.itemInfo}>{item.tel1}</Text> : null}
        {item.email ? <Text style={styles.itemInfo}>{item.email}</Text> : null}
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

export default React.memo(PersonListItem);
