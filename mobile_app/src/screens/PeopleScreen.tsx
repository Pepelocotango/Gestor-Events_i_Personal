import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Modal, Button } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';
import PeopleToolbar from '../components/PeopleToolbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PeopleScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonList'>;

type Props = {
  navigation: PeopleScreenNavigationProp;
};

const PeopleScreen = ({ navigation }: Props) => {
  const { peopleGroups, deletePersonGroup } = useDataStore();
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof PersonGroup, direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

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
    setSortModalVisible(false);
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

  const renderSortModal = () => (
    <Modal
      transparent={true}
      visible={isSortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ordenar per</Text>
          <Button title={`Nom ${sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('name')} />
          <Button title={`Rol ${sortConfig.key === 'role' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('role')} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <PeopleToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        onSort={() => setSortModalVisible(true)}
        onFilter={() => Alert.alert("WIP", "Filtres pròximament")}
      />
      {renderSortModal()}
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
              <TouchableOpacity onPress={() => navigation.navigate('PersonForm', { personId: item.id })}>
                <Icon name="pencil" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Icon name="delete" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>No s'han trobat contactes.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PersonForm', {})}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemInfo: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default PeopleScreen;
