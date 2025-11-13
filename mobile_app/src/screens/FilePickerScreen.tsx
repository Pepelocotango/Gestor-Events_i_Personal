import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList } from '../navigation';
import { useDataStore } from '../stores/dataStore';

type FilePickerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FilePicker'
>;

type FilePickerScreenRouteProp = RouteProp<RootStackParamList, 'FilePicker'>;

type Props = {
  navigation: FilePickerScreenNavigationProp;
  route: FilePickerScreenRouteProp;
};

const FilePickerScreen = ({ route, navigation }: Props) => {
  const { workspaceUri } = route.params;
  const { loadDataFromFile } = useDataStore();
  const [files, setFiles] = useState<FileSystem.FileInfo[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!workspaceUri) return;
      try {
        const fileUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(workspaceUri);
        const fileInfoPromises = fileUris
          .filter((uri) => uri.endsWith('.json'))
          .map((uri) => FileSystem.getInfoAsync(uri));

        const settledFileInfos = await Promise.all(fileInfoPromises);

        const existingFiles = settledFileInfos.filter(
          (info) => info.exists
        ) as FileSystem.FileInfo[];

        setFiles(existingFiles);
      } catch (error) {
        Alert.alert("Error", "No s'ha pogut llegir el directori.");
        console.error(error);
      }
    };

    fetchFiles();
  }, [workspaceUri]);

  const handleFilePress = async (fileInfo: FileSystem.FileInfo) => {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileInfo.uri);
      const data = JSON.parse(fileContent);
      const fileName = fileInfo.uri.split('/').pop() || 'unknown';
      loadDataFromFile(data, { uri: fileInfo.uri, name: fileName });
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (error) {
      Alert.alert('Error', 'No s\'ha pogut carregar el fitxer.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona un fitxer</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.fileItem}
            onPress={() => handleFilePress(item)}
          >
            <Text>{item.uri.split('/').pop()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fileItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default FilePickerScreen;
