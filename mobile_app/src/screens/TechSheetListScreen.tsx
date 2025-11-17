import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataStore } from '../stores/dataStore';
import { TechSheetsStackParamList } from '../navigation';
import { EventFrame } from '../types';

type TechSheetListScreenNavigationProp = StackNavigationProp<
  TechSheetsStackParamList,
  'TechSheetList'
>;

type Props = {
  navigation: TechSheetListScreenNavigationProp;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString();

export default function TechSheetListScreen({ navigation }: Props) {
  const isLoading = useDataStore((state) => state.isLoading);
  const error = useDataStore((state) => state.error);
  const techSheets = useDataStore((state) =>
    state.eventFrames.filter((ef) => ef.techSheet)
  );

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
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TechSheetDetail', { eventId: item.id })}
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.detail}>
        <Text style={styles.bold}>Lloc:</Text> {item.place || 'No especificat'}
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.bold}>Data:</Text> {formatDate(item.startDate)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={techSheets}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
  },
});
