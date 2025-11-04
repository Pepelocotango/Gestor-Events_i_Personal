import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initializeEventDataStore, useEventDataStore } from '@gep/core/stores/eventDataStore';
import type { AppData } from '@gep/core/types';
import MobilePersistenceAdapter from './src/MobilePersistenceAdapter';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export default function App() {
  const [statusMessage, setStatusMessage] = useState('Inicialitzant...');

  useEffect(() => {
    const setupAndLoadData = async () => {
      try {
        // 1. Inicialitza l'store amb l'adaptador de persistència mòbil
        initializeEventDataStore(MobilePersistenceAdapter);
        setStatusMessage('Store inicialitzat.');

        // 2. Defineix la ruta del fitxer de dades de l'usuari
        // @ts-ignore: Ignorem l'error de tipus de FileSystem.documentDirectory
        const userDataPath = (FileSystem.documentDirectory || '') + 'user_data.json';
        console.log('Ruta del fitxer de dades:', userDataPath);

        // 3. Comprova si el fitxer de dades ja existeix
        const fileInfo = await FileSystem.getInfoAsync(userDataPath);

        // 4. Si no existeix, copia'l des dels assets
        if (!fileInfo.exists) {
          setStatusMessage('El fitxer de dades no existeix. Copiant exemple...');

          const asset = Asset.fromModule(require('./assets/example_all.json'));
          await asset.downloadAsync();

          console.log('Actiu descarregat a:', asset.localUri);

          if (asset.localUri) {
            await FileSystem.copyAsync({
              from: asset.localUri,
              to: userDataPath,
            });
            setStatusMessage('Fitxer d\'exemple copiat correctament.');
          } else {
            throw new Error("No s'ha pogut obtenir la URI local de l'actiu.");
          }
        } else {
            setStatusMessage('El fitxer de dades ja existeix.');
        }

        // 5. Llegeix el contingut del fitxer, el parseja i el carrega a l'store
        setStatusMessage('Llegint i carregant dades...');
        const { success, content, message } = await MobilePersistenceAdapter.readFile(userDataPath);

        if (!success || !content) {
            throw new Error(`No s'ha pogut llegir el fitxer de dades: ${message}`);
        }

        const dataToLoad: AppData = JSON.parse(content);

        const result = await useEventDataStore.getState().loadData(dataToLoad);

        // 6. Actualitza el missatge d'estat amb el resultat
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
