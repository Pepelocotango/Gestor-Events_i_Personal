import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type ActionToolbarProps = {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  toggleAllCards: () => void;
  areAllExpanded: boolean;
};

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  sortOrder,
  setSortOrder,
  showArchived,
  setShowArchived,
  toggleAllCards,
  areAllExpanded,
}: ActionToolbarProps) => {
  const { t } = useTranslation();
  const theme = useDataStore((state: any) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const styles = React.useMemo(() => StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    buttonText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
  }), [colors]);

  return (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <Icon name={sortOrder === 'asc' ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={24} color={colors.text} />
        <Text style={styles.buttonText}>{t('mobile.action_toolbar.sort_by_date')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowArchived(!showArchived)}
      >
        <Icon name={showArchived ? "archive-eye" : "archive-eye-outline"} size={24} color={colors.text} />
        <Text style={styles.buttonText}>{showArchived ? t('mobile.action_toolbar.showing_archived') : t('mobile.action_toolbar.show_archived')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleAllCards}>
        <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text} />
        <Text style={styles.buttonText}>{areAllExpanded ? t('mobile.action_toolbar.collapse_all') : t('mobile.action_toolbar.expand_all')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionToolbar;
