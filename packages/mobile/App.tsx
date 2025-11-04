import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initializeEventDataStore, useEventDataStore } from '@gep/core/stores/eventDataStore';
import type { AppData } from '@gep/core/types';
import MobilePersistenceAdapter from './src/MobilePersistenceAdapter';
import { Asset } from 'expo-asset';

export default function App() {
  const [statusMessage, setStatusMessage] = useState('Inicialitzant...');

  useEffect(() => {
    const setupAndLoadData = async () => {
      try {
        // 1. Inicialitza l'store amb l'adaptador
        initializeEventDataStore(MobilePersistenceAdapter);
        setStatusMessage('Store inicialitzat.');

        // 2. Descarrega l'actiu d'exemple
        const asset = Asset.fromModule(require('./assets/example_all.json'));
        await asset.downloadAsync();
        setStatusMessage('Actiu d\'exemple preparat.');

        // 3. Demana a l'adaptador que s'asseguri que el fitxer existeix i ens retorni la ruta
        const { path: userDataPath, message: ensureMessage } = await MobilePersistenceAdapter.ensureDataFileExists(asset);
        setStatusMessage(ensureMessage);

        // 4. Llegeix i carrega les dades des de la ruta obtinguda
        setStatusMessage('Llegint i carregant dades...');
        const { success, content, message: readMessage } = await MobilePersistenceAdapter.readFile(userDataPath);

        if (!success || !content) {
          throw new Error(`No s'ha pogut llegir el fitxer de dades: ${readMessage}`);
        }

        const dataToLoad: AppData = JSON.parse(content);
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
