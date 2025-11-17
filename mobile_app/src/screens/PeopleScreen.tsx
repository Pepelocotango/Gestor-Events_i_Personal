import React, { useLayoutEffect, useState, useMemo } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';

type PeopleScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonList'>;

type Props = {
  navigation: PeopleScreenNavigationProp;
};

const PeopleScreen = ({ navigation }: Props) => {
  const { peopleGroups, deletePersonGroup } = useDataStore();
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PersonGroup, direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => navigation.navigate('PersonForm', {})}
          title="Afegir"
        />
      ),
    });
  }, [navigation]);

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const sortedAndFilteredGroups = useMemo(() => {
    const filtered = peopleGroups.filter(pg => {
      if (!search.trim()) return true;
      const s = normalize(search);
      return [pg.name, pg.role, pg.email, pg.tel1, pg.tel2]
        .filter(Boolean)
        .map(val => normalize(val!))
        .some(val => val.includes(s));
    });

    return filtered.sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      const comparison = String(valA).localeCompare(String(valB), 'ca', { sensitivity: 'base' });
      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
  }, [peopleGroups, search, sortConfig]);

  const requestSort = (key: keyof PersonGroup) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Persona",
      "Esteu segur que voleu eliminar aquesta persona?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deletePersonGroup(id), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
       <TextInput
        style={styles.searchBar}
        placeholder="Cerca per nom, rol, email..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar per:</Text>
        <Button title={`Nom ${sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('name')} />
        <Button title={`Rol ${sortConfig.key === 'role' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('role')} />
      </View>
      <View style={styles.actionsContainer}>
        <Button title="Importar" onPress={() => Alert.alert("WIP", "Importar pròximament")} />
        <Button title="Exportar" onPress={() => Alert.alert("WIP", "Exportar pròximament")} />
      </View>
      <FlatList
        data={sortedAndFilteredGroups}
        keyExtractor={(item: PersonGroup) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.role ? <Text style={styles.itemSubText}>{item.role}</Text> : null}
              {item.tel1 ? <Text style={styles.itemInfo}>{item.tel1}</Text> : null}
              {item.email ? <Text style={styles.itemInfo}>{item.email}</Text> : null}
            </View>
            <View style={styles.itemActions}>
              <Button title="Editar" onPress={() => navigation.navigate('PersonForm', { personId: item.id })} />
              <Button title="Eliminar" onPress={() => handleDelete(item.id)} color="red" />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>No s'han trobat contactes.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  sortLabel: {
    marginRight: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
  },
  itemInfo: {
    fontSize: 12,
    color: '#333',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
  },
});

export default PeopleScreen;
