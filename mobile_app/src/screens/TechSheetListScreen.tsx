import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataStore } from '../stores/dataStore';
import { TechSheetsStackParamList } from '../navigation';
import { EventFrame } from '../types';
import TechSheetListItem from '../components/TechSheetListItem';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type TechSheetListScreenNavigationProp = StackNavigationProp<
  TechSheetsStackParamList,
  'TechSheetList'
>;

type Props = {
  navigation: TechSheetListScreenNavigationProp;
};

export default function TechSheetListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { isLoading, error, eventFrames, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const techSheets = useMemo(
    () => eventFrames.filter((ef) => ef.techSheet),
    [eventFrames]
  );

  const handleItemPress = useCallback((eventId: string) => {
    navigation.navigate('TechSheetDetail', { eventId });
  }, [navigation]);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
      textAlign: 'center',
    },
    errorText: {
      color: 'red',
    },
  }), [colors]);

  if (isLoading) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <Text style={dynamicStyles.errorText}>{error}</Text>
      </View>
    );
  }

  if (techSheets.length === 0) {
    return (
      <View style={dynamicStyles.centerContainer}>
        <Text style={dynamicStyles.text}>{t('mobile.tech_sheet_list.no_tech_sheets')}</Text>
        <Text style={dynamicStyles.text}>{t('mobile.tech_sheet_list.ensure_file_open')}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: EventFrame }) => (
    <TechSheetListItem
      item={item}
      onPress={() => handleItemPress(item.id)}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={techSheets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={dynamicStyles.container}
        windowSize={10}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}
