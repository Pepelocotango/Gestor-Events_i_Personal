import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList } from '../navigation';
import { useDataStore } from '../stores/dataStore';

type DataSourceScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DataSource'
>;

type Props = {
  navigation: DataSourceScreenNavigationProp;
};

const DataSourceScreen = ({ navigation }: Props) => {
  const { setWorkspaceUri } = useDataStore();

  const handleSelectWorkspace = async () => {
    try {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const { directoryUri } = permissions;
        setWorkspaceUri(directoryUri);
        navigation.navigate('FilePicker', { workspaceUri: directoryUri });
      } else {
        Alert.alert(
          'Permisos denegats',
          "L'accés a la carpeta és necessari per continuar."
        );
      }
    } catch (error: any) {
      if (!error.message.includes('cancelled')) {
        Alert.alert('Error', "No s'ha pogut seleccionar la carpeta.");
        console.error(error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Selecciona la carpeta de treball</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Seleccionar Carpeta"
            onPress={handleSelectWorkspace}
          />
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
