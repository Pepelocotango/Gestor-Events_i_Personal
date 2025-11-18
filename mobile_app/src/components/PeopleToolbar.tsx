import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type PeopleToolbarProps = {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSort: () => void;
  onFilter: () => void;
};

const PeopleToolbar: React.FC<PeopleToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onSort,
  onFilter,
}) => {
  return (
    <View style={styles.toolbar}>
      <TextInput
        style={styles.searchInput}
        placeholder="Cerca persones..."
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      <TouchableOpacity onPress={onSort} style={styles.iconButton}>
        <Icon name="sort" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
});

export default PeopleToolbar;
