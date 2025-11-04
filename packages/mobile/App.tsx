import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initializeEventDataStore, useEventDataStore } from '@gep/core/stores/eventDataStore';
import type { AppData } from '@gep/core/types';
import MobilePersistenceAdapter from './src/MobilePersistenceAdapter';
// ELIMINAT: import { Asset } from 'expo-asset';
import exampleData from './assets/example_all.json'; // AFEGIT

export default function App() {
  const [statusMessage, setStatusMessage] = useState('Inicialitzant...');

  useEffect(() => {
    const setupAndLoadData = async () => {
      try {
        // 1. Inicialitza l'store amb l'adaptador
        initializeEventDataStore(MobilePersistenceAdapter);
        setStatusMessage('Store inicialitzat.');

        // 2. Utilitza les dades importades directament
        setStatusMessage('Dades d\'exemple importades directament.');
        const dataToLoad = exampleData as AppData;
        
        // 3. Carrega les dades a l'store
        const result = await useEventDataStore.getState().loadData(dataToLoad);
        setStatusMessage(result.message || 'Procés finalitzat.');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatusMessage(`Error: ${errorMessage}`);
        console.error('Error durant la inicialització:', error);
      }
    };

    setupAndLoadData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{statusMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
  }
});