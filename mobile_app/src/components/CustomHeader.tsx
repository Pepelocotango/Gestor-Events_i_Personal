import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { useStore } from 'zustand';
import { SAFFileService } from '../services/SAFFileService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const fileService = new SAFFileService();

type ActiveScreen = 'EventList' | 'PersonList' | 'MaterialList' | 'MaterialControl';

interface CustomHeaderProps {
  navigation: any;
  route: { name: ActiveScreen };
}

const CustomHeader = ({ navigation, route }: CustomHeaderProps) => {
  const {
    fileName,
    hasUnsavedChanges,
    setData,
    clearData,
    saveData,
    undo,
    redo,
  } = useDataStore();

  const { pastStates, futureStates } = useStore(useDataStore.temporal);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleOpenFile = async () => {
    const openAndSetData = async () => {
      try {
        const result = await fileService.openFile();
        if (result) {
          setData(result.content, result.name);
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
    try {
      await saveData();
      Alert.alert("Èxit", "S'ha iniciat el procés de desat. Trieu on desar el fitxer.");
    } catch (e) {
      Alert.alert("Error", "No s'ha pogut desar el fitxer.");
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

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{fileName || 'Gestor d\'Esdeveniments'}</Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity onPress={undo} disabled={!canUndo}>
            <Icon name="undo-variant" size={28} color={canUndo ? '#333' : '#ccc'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redo} disabled={!canRedo}>
            <Icon name="redo-variant" size={28} color={canRedo ? '#333' : '#ccc'} />
          </TouchableOpacity>
        </View>
        <View style={styles.buttonGroup}>
          {fileName ? (
            <>
              <TouchableOpacity onPress={handleSaveFile} disabled={!hasUnsavedChanges}>
                <Icon name="content-save" size={28} color={hasUnsavedChanges ? '#007AFF' : '#ccc'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCloseFile}>
                <Icon name="close-circle-outline" size={28} color="#FF3B30" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleOpenFile} style={styles.openButton}>
              <Icon name="folder-open-outline" size={28} color="#007AFF" />
              <Text style={styles.openButtonText}>Obrir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  topRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  }
});

export default CustomHeader;
