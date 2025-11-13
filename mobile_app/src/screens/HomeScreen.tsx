import React, { useEffect, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Button,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataStore } from '../stores/dataStore';
import { EventFrame } from '../types';
import { RootStackParamList } from '../navigation';

// Helper to format date ranges
const formatDateRange = (start: string, end: string) => {
  try {
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  } catch (e) {
    return 'Dates invàlides';
  }
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
  const {
    eventFrames,
    isLoading,
    error,
    hasUnsavedChanges,
    saveDataToFile,
    deleteEventFrame,
  } = useDataStore();

  // Configure header buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          {hasUnsavedChanges && (
            <Button
              onPress={async () => {
                await saveDataToFile();
                Alert.alert('Èxit', 'Les dades s’han desat correctament.');
              }}
              title="Desar"
            />
          )}
          <Button
            onPress={() => navigation.navigate('EventForm', {})}
            title="+"
          />
        </View>
      ),
    });
  }, [navigation, hasUnsavedChanges, saveDataToFile]);

  // Prevent leaving the screen with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Descartar canvis?',
        'Teniu canvis no desats. Esteu segur que voleu descartar-los i sortir?',
        [
          { text: 'No, quedar-se', style: 'cancel', onPress: () => {} },
          {
            text: 'Sí, descartar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const handleEdit = (eventId: string) => {
    navigation.navigate('EventForm', { eventId });
  };

  const handleDelete = (eventId: string) => {
    Alert.alert(
      'Confirmar eliminació',
      'Esteu segur que voleu eliminar aquest esdeveniment?',
      [
        { text: 'Cancel·lar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteEventFrame(eventId),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: EventFrame }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemDetails}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDates}>
          {formatDateRange(item.startDate, item.endDate)}
        </Text>
      </TouchableOpacity>
      <View style={styles.itemActions}>
        <Button title="Editar" onPress={() => handleEdit(item.id)} />
        <View style={styles.buttonSpacer} />
        <Button
          title="Eliminar"
          onPress={() => handleDelete(item.id)}
          color="#F44336"
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregant esdeveniments...</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={eventFrames}
        renderItem={renderItem}
        keyExtractor={(item: EventFrame) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDates: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacer: {
    width: 10, // Adds space between buttons
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
