import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { useDataStore } from '../stores/dataStore';
import { DeviceFileService } from '../services/DeviceFileService';

type DataSourceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DataSource'
>;

type Props = {
  navigation: DataSourceScreenNavigationProp;
};

const DataSourceScreen = ({ navigation }: Props) => {
  const { loadDataFromFile } = useDataStore();

  const handleOpenFile = async () => {
    const fileService = new DeviceFileService();
    try {
      const data = await fileService.loadData();
      if (data) {
        // @ts-ignore
        loadDataFromFile(data, { name: 'fitxer local' });
        // Reseteja la pila de navegació i navega a Home
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
      }
    } catch (error: any) {
      if (error.message.includes('cancel·lada')) {
        // No mostris cap alerta si l'usuari ha cancel·lat la selecció
        console.log(error.message);
      } else {
        Alert.alert('Error', 'No s\'ha pogut carregar el fitxer.');
        console.error(error);
      }
    }
  };

  const handleConnectDropbox = () => {
    // Lògica per iniciar el flux d'autenticació de Dropbox
    Alert.alert('Pròximament', 'La connexió amb Dropbox encara no està implementada.');
    console.log('Connectant amb Dropbox...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Selecciona una font de dades</Text>
        <View style={styles.buttonContainer}>
          <Button title="Obrir fitxer del dispositiu" onPress={handleOpenFile} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Connectar amb Dropbox" onPress={handleConnectDropbox} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
});

export default DataSourceScreen;
