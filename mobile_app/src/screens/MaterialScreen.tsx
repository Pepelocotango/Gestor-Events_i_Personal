import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, Alert, TouchableOpacity, Modal, Button } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';
import MaterialToolbar from '../components/MaterialToolbar';
import MaterialListItem from '../components/MaterialListItem';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type MaterialScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialList'>;

type Props = {
  navigation: MaterialScreenNavigationProp;
};

type SectionHeaderProps = {
  title: string;
  isExpanded: boolean;
  sortMode: 'category' | 'name';
  onToggle: (title: string) => void;
  style: any;
  textStyle: any;
  iconColor: string;
};

const SectionHeader = React.memo<SectionHeaderProps>(({ title, isExpanded, sortMode, onToggle, style, textStyle, iconColor }) => (
  <TouchableOpacity onPress={() => onToggle(title)} style={style} disabled={sortMode !== 'category'}>
    <Text style={textStyle}>{title}</Text>
    {sortMode === 'category' && (
      <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={iconColor} />
    )}
  </TouchableOpacity>
));

const MaterialScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { materialItems, deleteMaterialItem, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<'category' | 'name'>('category');
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('common.delete'),
      t('common.confirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { text: t('common.delete'), onPress: () => deleteMaterialItem(id), style: 'destructive' }
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
      return [{ title: t('material.sort_name'), data: sortedByName }];
    }

    const grouped: { [key: string]: MaterialItem[] } = filtered.reduce((acc, item) => {
      const category = item.category || t('material.no_category');
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

  const areAllExpanded = useMemo(() => {
    if (sectionsData.length === 0 || sortMode !== 'category') return false;
    return sectionsData.every(s => expandedCategories.has(s.title));
  }, [expandedCategories, sectionsData, sortMode]);

  const toggleAllCategories = () => {
    if (areAllExpanded) {
        setExpandedCategories(new Set());
    } else {
        const allCategories = new Set(sectionsData.map(s => s.title));
        setExpandedCategories(allCategories);
    }
  };

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

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
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
          <Text style={dynamicStyles.modalTitle}>{t('material.sort_by')}</Text>
          <Button title={`${t('mobile.form_labels.category')} ${sortMode === 'category' ? '✓' : ''}`} onPress={() => { setSortMode('category'); setSortModalVisible(false); }} color={colors.primary} />
          <Button title={`${t('mobile.form_labels.name')} ${sortMode === 'name' ? '✓' : ''}`} onPress={() => { setSortMode('name'); setSortModalVisible(false); }} color={colors.primary}/>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={dynamicStyles.container}>
      <MaterialToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        onSort={() => setSortModalVisible(true)}
        onFilter={() => Alert.alert(t('common.error'), t('main.no_events_found'))}
        toggleAllCategories={toggleAllCategories}
        areAllExpanded={areAllExpanded}
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
            style={dynamicStyles.sectionHeader}
            textStyle={dynamicStyles.sectionHeaderText}
            iconColor={colors.text}
          />
        )}
        ListEmptyComponent={<Text style={dynamicStyles.emptyList}>{t('material.no_items_found')}</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={dynamicStyles.fab}
        onPress={() => navigation.navigate('MaterialForm', {})}
      >
        <Icon name="plus" size={30} color={theme === 'dark' ? darkTheme.background : lightTheme.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({});

export default MaterialScreen;
