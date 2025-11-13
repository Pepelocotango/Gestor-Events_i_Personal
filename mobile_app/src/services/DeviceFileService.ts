import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { IFileService } from './fileService';
import { AppData } from '../types';

export class DeviceFileService implements IFileService {
  public async loadData(): Promise<{ data: AppData; uri: string; name: string }> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accepta qualsevol tipus de fitxer
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Comprovació manual de l'extensió del fitxer
        if (!asset.name.endsWith('.json')) {
          throw new Error('El fitxer seleccionat no és un fitxer JSON.');
        }
        const fileContent = await FileSystem.readAsStringAsync(asset.uri);
        return {
          data: JSON.parse(fileContent),
          uri: asset.uri,
          name: asset.name,
        };
      } else {
        // Llança un error si l'usuari cancel·la la selecció
        throw new Error("Selecció de fitxer cancel·lada per l'usuari.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancel·lada')) {
        throw error;
      }
      console.error('Error en llegir el fitxer del dispositiu:', error);
      throw new Error('No es pot llegir el fitxer seleccionat.');
    }
  }

  public async saveData(data: AppData): Promise<string> {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      throw new Error("Selecció de directori cancel·lada per l'usuari.");
    }

    try {
      const directoryUri = permissions.directoryUri;
      const fileName = `gp-app-data-${Date.now()}.json`;
      const mimeType = 'application/json';

      const fileUri =
        await FileSystem.StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          mimeType,
        );

      const jsonString = JSON.stringify(data, null, 2);

      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return fileUri;
    } catch (error) {
      console.error('Error en desar el fitxer al dispositiu:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}
