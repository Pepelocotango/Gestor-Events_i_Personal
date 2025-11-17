import React, { useLayoutEffect, useState, useMemo } from 'react';
import { View, Text, Button, StyleSheet, SectionList, Alert, TextInput, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';

type MaterialScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialList'>;

type Props = {
  navigation: MaterialScreenNavigationProp;
};

const MaterialScreen = ({ navigation }: Props) => {
  const { materialItems, deleteMaterialItem } = useDataStore();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'category' | 'name'>('category');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          <Button
            onPress={() => navigation.navigate('MaterialControl')}
            title="Control"
          />
          <View style={{ width: 10 }} />
          <Button
            onPress={() => navigation.navigate('MaterialForm', {})}
            title="Afegir"
          />
        </View>
      ),
    });
  }, [navigation]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Material",
      "Esteu segur que voleu eliminar aquest ítem?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deleteMaterialItem(id), style: 'destructive' }
      ]
    );
  };

  const sections = useMemo(() => {
    const filtered = materialItems.filter(item => {
      const searchTerm = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
      );
    });

    if (sortMode === 'name') {
      const sortedByName = filtered.sort((a, b) => a.name.localeCompare(b.name, 'ca', { sensitivity: 'base' }));
      return [{ title: 'Tots els materials', data: sortedByName }];
    }

    // Group by category
    const grouped: { [key: string]: MaterialItem[] } = filtered.reduce((acc, item) => {
      const category = item.category || 'Sense Categoria';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as { [key: string]: MaterialItem[] });

    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b, 'ca', { sensitivity: 'base' }))
      .map(category => ({
        title: category,
        data: grouped[category].sort((a, b) => a.name.localeCompare(b.name, 'ca', { sensitivity: 'base' })),
      }));
  }, [materialItems, search, sortMode]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Cerca per nom, categoria, ubicació..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Agrupar per:</Text>
        <TouchableOpacity onPress={() => setSortMode('category')} style={[styles.sortButton, sortMode === 'category' && styles.sortButtonActive]}>
          <Text style={styles.sortButtonText}>Categoria</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortMode('name')} style={[styles.sortButton, sortMode === 'name' && styles.sortButtonActive]}>
          <Text style={styles.sortButtonText}>Nom</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionsContainer}>
        <Button title="Importar" onPress={() => Alert.alert("WIP", "Importar pròximament")} />
        <Button title="Exportar" onPress={() => Alert.alert("WIP", "Exportar pròximament")} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSubText}>Estoc: {item.stock} | Ubicació: {item.location}</Text>
            </View>
            <View style={styles.itemActions}>
              <Button title="Editar" onPress={() => navigation.navigate('MaterialForm', { materialId: item.id })} />
              <Button title="Eliminar" onPress={() => handleDelete(item.id)} color="red" />
            </View>
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>No s'ha trobat material.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sortLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: 'white',
  },
  sectionHeader: {
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
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
    gap: 10,
  },
  emptyList: {
    textAlign: 'center',
    marginTop: 30,
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

export default MaterialScreen;
