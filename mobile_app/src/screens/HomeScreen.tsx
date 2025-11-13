import React, { useLayoutEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { SAFFileService } from '../services/SAFFileService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { EventFrame } from '../types';

const fileService = new SAFFileService();

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen = ({ navigation }: Props) => {
  const {
    fileUri,
    fileName,
    eventFrames,
    hasUnsavedChanges,
    setData,
    clearData,
    saveData,
    createFile,
    deleteEventFrame,
  } = useDataStore();

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Esdeveniment",
      "Esteu segur que voleu eliminar aquest esdeveniment?",
      [
        {
          text: "Cancel·lar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: () => deleteEventFrame(id),
          style: 'destructive'
        }
      ]
    );
  };

  const handleOpenFile = async () => {
    const openAndSetData = async () => {
      try {
        const result = await fileService.openFile();
        if (result) {
          setData(result.content, result.uri, result.name);
        }
      } catch (error) {
        Alert.alert("Error", "El fitxer seleccionat no és vàlid o està malmès.");
      }
    };

    if (hasUnsavedChanges) {
      Alert.alert(
        "Descartar canvis?",
        "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer actual i descartar els canvis?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: openAndSetData },
        ]
      );
    } else {
      await openAndSetData();
    }
  };

  const handleSaveFile = async () => {
    if (fileUri) {
      try {
        await saveData();
        Alert.alert("Èxit", "El fitxer s'ha desat correctament.");
      } catch (e) {
        Alert.alert("Error", "No s'ha pogut desar el fitxer.");
      }
    }
  };

  const handleSaveAs = async () => {
    try {
      await createFile("newEventData.json");
      Alert.alert("Èxit", "El fitxer s'ha creat correctament.");
    } catch (e) {
      Alert.alert("Error", "No s'ha pogut crear el fitxer.");
    }
  };

  const handleCloseFile = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Descartar canvis?",
        "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer i descartar els canvis?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: clearData },
        ]
      );
    } else {
      clearData();
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: fileName || 'Gestor d\'Esdeveniments',
      headerRight: () => (
        <View style={styles.headerButtons}>
          {fileUri ? (
            <>
              <Button title="Desar" onPress={handleSaveFile} disabled={!hasUnsavedChanges} />
              <Button title="Desar Com a" onPress={handleSaveAs} />
              <Button title="Tancar" onPress={handleCloseFile} />
            </>
          ) : (
            <Button title="Obrir" onPress={handleOpenFile} />
          )}
        </View>
      ),
    });
  }, [navigation, fileUri, fileName, hasUnsavedChanges]);

  if (!fileUri) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Benvingut</Text>
        <Text>Obriu un fitxer per començar a gestionar esdeveniments.</Text>
        <Button title="Obrir Fitxer" onPress={handleOpenFile} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={eventFrames}
        keyExtractor={(item: EventFrame) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          >
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSubText}>{new Date(item.startDate).toLocaleDateString()}</Text>
              <Text style={item.personnelComplete ? styles.statusComplete : styles.statusIncomplete}>
                {item.personnelComplete ? 'Complet' : 'Incomplet'}
              </Text>
            </View>
            <View style={styles.itemActions}>
              <Button title="Editar" onPress={() => navigation.navigate('EventForm', { eventId: item.id })} />
              <Button title="Eliminar" onPress={() => handleDelete(item.id)} color="red" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginRight: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusComplete: {
    color: 'green',
  },
  statusIncomplete: {
    color: 'red',
  },
});

export default HomeScreen;
