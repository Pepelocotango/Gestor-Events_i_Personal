import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type MaterialToolbarProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSort: () => void;
  onFilter: () => void;
  toggleAllCategories: () => void;
  areAllExpanded: boolean;
};

const MaterialToolbar: React.FC<MaterialToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onSort,
  onFilter,
  toggleAllCategories,
  areAllExpanded,
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
      </View>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleAllCategories}>
            <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color="#333" />
            <Text style={styles.buttonText}>{areAllExpanded ? 'Replegar' : 'Expandir'}</Text>
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
    paddingBottom: 5,
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
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 15,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default MaterialToolbar;
