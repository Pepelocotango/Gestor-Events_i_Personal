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
      // @ts-ignore
      loadDataFromFile(data, { name: 'fitxer local' });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (error: any) {
      if (error.message.includes('cancel·lada')) {
        console.log(error.message);
      } else if (error instanceof SyntaxError) {
        Alert.alert('Error', 'El fitxer seleccionat no és un JSON vàlid.');
      } else {
        Alert.alert('Error', error.message || 'No s\'ha pogut carregar el fitxer.');
        console.error(error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Selecciona el teu fitxer de dades</Text>
        <View style={styles.buttonContainer}>
          <Button title="Obrir Fitxer (.json)" onPress={handleOpenFile} />
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
