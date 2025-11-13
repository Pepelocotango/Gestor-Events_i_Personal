import React, { useLayoutEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert } from 'react-native';
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
  } = useDataStore();

  const handleOpenFile = async () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Descartar canvis?",
        "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer actual i descartar els canvis?",
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: async () => {
              const result = await fileService.openFile();
              if (result) {
                setData(result.content, result.uri, result.name);
              }
            }
          },
        ]
      );
    } else {
      const result = await fileService.openFile();
      if (result) {
        setData(result.content, result.uri, result.name);
      }
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
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
});

export default HomeScreen;
