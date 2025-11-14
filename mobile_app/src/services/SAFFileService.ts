import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { AppData } from '../types';
import { IFileService } from './fileService';
import 'react-native-get-random-values'; // Polyfill per a uuid
import { v4 as uuidv4 } from 'uuid';

export class SAFFileService implements IFileService {
  public async openFile(): Promise<{
    uri: string;
    name: string;
    content: AppData;
  } | null> {
    try {
      // Pas 1: Obtenir la URI persistent amb DocumentPicker.
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false, // Crucial per obtenir la URI original.
        multiple: false,
        type: 'application/json',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const originalUri = asset.uri;

        // Pas 2: Crear una ruta de destí única a la memòria cau.
        const temporaryUri = `${FileSystem.cacheDirectory}${uuidv4()}-${asset.name}`;

        // Pas 3: Copiar el fitxer a la ubicació temporal.
        await FileSystem.copyAsync({
          from: originalUri,
          to: temporaryUri,
        });

        // Pas 4: Llegir el contingut des de la còpia temporal.
        const content = await FileSystem.readAsStringAsync(temporaryUri, {
          encoding: 'utf8',
        });
        const data = JSON.parse(content);

        // Neteja opcional del fitxer temporal després de llegir-lo.
        await FileSystem.deleteAsync(temporaryUri, { idempotent: true });

        // Pas 5: Retornar la URI original persistent juntament amb les dades.
        return {
          uri: originalUri,
          name: asset.name,
          content: data,
        };
      }
      return null; // L'usuari ha cancel·lat.
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
          encoding: 'utf8',
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
        encoding: 'utf8',
      });
    } catch (error) {
      console.error('Error al desar el fitxer:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}
