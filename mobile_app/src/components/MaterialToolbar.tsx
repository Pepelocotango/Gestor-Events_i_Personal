import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const theme = useDataStore((state: any) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 15,
      marginRight: 10,
      fontSize: 16,
      color: colors.text,
      borderColor: colors.border,
      borderWidth: 1,
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
      color: colors.text,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('mobile.placeholders.search_material')}
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity onPress={onSort} style={styles.iconButton}>
          <Icon name="sort" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleAllCategories}>
            <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text} />
            <Text style={styles.buttonText}>{areAllExpanded ? 'Replegar' : 'Expandir'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MaterialToolbar;
