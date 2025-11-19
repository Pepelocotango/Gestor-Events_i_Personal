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

type TechSheetListScreenNavigationProp = StackNavigationProp<
  TechSheetsStackParamList,
  'TechSheetList'
>;

type Props = {
  navigation: TechSheetListScreenNavigationProp;
};

export default function TechSheetListScreen({ navigation }: Props) {
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const eventFrames = useDataStore((state) => state.eventFrames);

  const techSheets = useMemo(
    () => eventFrames.filter((ef) => ef.techSheet),
    [eventFrames]
  );

  const handleItemPress = useCallback((eventId: string) => {
    navigation.navigate('TechSheetDetail', { eventId });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (techSheets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>No s'han trobat fitxes de bolo.</Text>
        <Text>Assegura't d'haver obert un fitxer de dades.</Text>
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
    <FlatList
      data={techSheets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      windowSize={10}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
  },
});
