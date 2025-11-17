import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, Alert, TouchableOpacity, Modal, Button } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';
import MaterialToolbar from '../components/MaterialToolbar';
import MaterialListItem from '../components/MaterialListItem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type MaterialScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialList'>;

type Props = {
  navigation: MaterialScreenNavigationProp;
};

// Definim els tipus per a les props del component SectionHeader
type SectionHeaderProps = {
  title: string;
  isExpanded: boolean;
  sortMode: 'category' | 'name';
  onToggle: (title: string) => void;
};

// Component memoitzat per a les capçaleres de secció
const SectionHeader = React.memo<SectionHeaderProps>(({ title, isExpanded, sortMode, onToggle }) => (
  <TouchableOpacity onPress={() => onToggle(title)} style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    {sortMode === 'category' && (
      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color="#333" />
    )}
  </TouchableOpacity>
));

const MaterialScreen = ({ navigation }: Props) => {
  const { materialItems, deleteMaterialItem } = useDataStore();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'category' | 'name'>('category');
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      "Eliminar Material",
      "Esteu segur que voleu eliminar aquest ítem?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deleteMaterialItem(id), style: 'destructive' }
      ]
    );
  }, [deleteMaterialItem]);

  const sectionsData = useMemo(() => {
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
      return [{ title: 'Tots els materials per nom', data: sortedByName }];
    }

    const grouped: { [key: string]: MaterialItem[] } = filtered.reduce((acc, item) => {
      const category = item.category || 'Sense Categoria';
      if (!acc[category]) acc[category] = [];
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

  const handleExpandAll = () => {
    const allCategories = new Set(sectionsData.map(s => s.title));
    setExpandedCategories(allCategories);
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  useEffect(() => {
    if (sortMode === 'category') {
      handleExpandAll();
    }
  }, [sortMode, sectionsData]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const sectionsWithExpansion = useMemo(() => {
    if (sortMode !== 'category') {
      return sectionsData;
    }
    return sectionsData.map(section => ({
      ...section,
      data: expandedCategories.has(section.title) ? section.data : [],
    }));
  }, [sectionsData, expandedCategories, sortMode]);

  const renderSortModal = () => (
    <Modal
      transparent={true}
      visible={isSortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agrupar i ordenar per</Text>
          <Button title={`Categoria ${sortMode === 'category' ? '✓' : ''}`} onPress={() => { setSortMode('category'); setSortModalVisible(false); }} />
          <Button title={`Nom ${sortMode === 'name' ? '✓' : ''}`} onPress={() => { setSortMode('name'); setSortModalVisible(false); }} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <MaterialToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        onSort={() => setSortModalVisible(true)}
        onFilter={() => Alert.alert("WIP", "Filtres pròximament")}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />
      {renderSortModal()}
      <SectionList
        sections={sectionsWithExpansion}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MaterialListItem
            item={item}
            onEdit={(id) => navigation.navigate('MaterialForm', { materialId: id })}
            onDelete={handleDelete}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SectionHeader
            title={title}
            isExpanded={expandedCategories.has(title)}
            sortMode={sortMode}
            onToggle={toggleCategory}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>No s'ha trobat material.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MaterialForm', {})}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
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

export default MaterialScreen;
