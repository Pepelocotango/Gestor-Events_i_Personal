import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { AppData } from '../types';
import { IFileService } from './fileService';

export class SAFFileService implements IFileService {
  public async openFile(): Promise<{
    uri: string;
    name: string;
    content: AppData;
  } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false, // Important for SAF URIs
        multiple: false,
        type: 'application/json',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const data = JSON.parse(content);

        return {
          uri: asset.uri,
          name: asset.name,
          content: data,
        };
      }
      return null;
    } catch (error) {
      console.error("Error a l'obrir el fitxer:", error);
      throw new Error("No s'ha pogut obrir el fitxer.");
    }
  }

  public async createFile(
    data: AppData,
    fileName: string
  ): Promise<string | null> {
    try {
      const jsonString = JSON.stringify(data, null, 2);

      const uri = await FileSystem.StorageAccessFramework.createFileAsync(
        '',
        fileName,
        'application/json'
      );

      if (uri) {
        await FileSystem.writeAsStringAsync(uri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return uri;
      }
      return null;
    } catch (error) {
      console.error('Error al crear el fitxer:', error);
      throw new Error('No s’ha pogut crear el fitxer.');
    }
  }

  public async saveFile(uri: string, data: AppData): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await FileSystem.writeAsStringAsync(uri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error('Error al desar el fitxer:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}
