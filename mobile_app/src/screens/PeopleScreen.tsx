import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Modal, Button } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';
import PeopleToolbar from '../components/PeopleToolbar';
import PersonListItem from '../components/PersonListItem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type PeopleScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonList'>;

type Props = {
  navigation: PeopleScreenNavigationProp;
};

const PeopleScreen = ({ navigation }: Props) => {
  const { t, i18n } = useTranslation();
  const { peopleGroups, deletePersonGroup, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
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

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('common.delete'),
      t('common.confirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { text: t('common.delete'), onPress: () => deletePersonGroup(id), style: 'destructive' }
      ]
    );
  }, [deletePersonGroup]);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyList: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      backgroundColor: colors.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 10,
      width: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
      color: colors.text,
    },
  }), [colors, theme]);

  const renderSortModal = () => (
    <Modal
      transparent={true}
      visible={isSortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity style={dynamicStyles.modalOverlay} onPress={() => setSortModalVisible(false)}>
        <View style={dynamicStyles.modalContent}>
          <Text style={dynamicStyles.modalTitle}>{t('people.sort_by')}</Text>
          <Button title={`${t('mobile.form_labels.name')} ${sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('name')} color={colors.primary} />
          <Button title={`${t('mobile.form_labels.role')} ${sortConfig.key === 'role' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}`} onPress={() => requestSort('role')} color={colors.primary}/>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={dynamicStyles.container}>
      <PeopleToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        onSort={() => setSortModalVisible(true)}
        onFilter={() => Alert.alert(t('common.error'), t('main.no_events_found'))}
      />
      {renderSortModal()}
      <FlatList
        data={sortedAndFilteredGroups}
        keyExtractor={(item: PersonGroup) => item.id}
        renderItem={({ item }) => (
          <PersonListItem
            item={item}
            onEdit={(id) => navigation.navigate('PersonForm', { personId: id })}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={<Text style={dynamicStyles.emptyList}>{t('people.no_contacts_found')}</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('PersonForm', {})}
      >
        <Icon name="plus" size={30} color={theme === 'dark' ? darkTheme.background : lightTheme.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({});

export default PeopleScreen;
