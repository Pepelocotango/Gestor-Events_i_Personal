import React, { useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { initializeEventDataStore, useEventDataStore } from '@gep/core/stores/eventDataStore';
import type { AppData } from '@gep/core/types';
import MobilePersistenceAdapter from './src/MobilePersistenceAdapter';
import exampleData from './assets/example_all.json';
import DataSummary from './src/components/DataSummary';

export default function App() {
useEffect(() => {
const setupAndLoadData = async () => {
try {
initializeEventDataStore(MobilePersistenceAdapter);
const dataToLoad = exampleData as AppData;
await useEventDataStore.getState().loadData(dataToLoad);
} catch (error) {
const errorMessage = error instanceof Error ? error.message : String(error);
console.error('Error durant la inicialització:', error);
}
};

setupAndLoadData();
}, []);

return (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <DataSummary />
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
safeArea: {
flex: 1,
backgroundColor: '#ffffff',
paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
},
container: {
flex: 1,
backgroundColor: '#ffffff',
},
});