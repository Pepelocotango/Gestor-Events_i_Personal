import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const dynamicStyles = useMemo(() => StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 15,
      marginRight: 10,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconButton: {
      padding: 5,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.toolbar}>
      <TextInput
        style={dynamicStyles.searchInput}
        placeholder={t('mobile.people.search_placeholder')}
        placeholderTextColor={colors.placeholder}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      <TouchableOpacity onPress={onSort} style={dynamicStyles.iconButton}>
        <Icon name="sort" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export default PeopleToolbar;
