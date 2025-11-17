import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type MaterialToolbarProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSort: () => void;
  onFilter: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

const MaterialToolbar: React.FC<MaterialToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onSort,
  onFilter,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca material..."
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity onPress={onSort} style={styles.iconButton}>
          <Icon name="sort" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onFilter} style={styles.iconButton}>
          <Icon name="filter-variant" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.expansionBar}>
        <TouchableOpacity onPress={onExpandAll} style={styles.iconButton}>
          <Icon name="arrow-expand-vertical" size={24} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCollapseAll} style={styles.iconButton}>
          <Icon name="arrow-collapse-vertical" size={24} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },
  iconButton: {
    padding: 5,
  },
  expansionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
});

export default MaterialToolbar;
