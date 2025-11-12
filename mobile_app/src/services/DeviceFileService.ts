import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { IFileService } from './fileService';
import { AppData } from '../types';

export class DeviceFileService implements IFileService {
  public async loadData(): Promise<AppData> {
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
        return JSON.parse(fileContent);
      } else {
        // Llança un error si l'usuari cancel·la la selecció
        throw new Error('Selecció de fitxer cancel·lada per l\'usuari.');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancel·lada')) {
        throw error;
      }
      console.error('Error en llegir el fitxer del dispositiu:', error);
      throw new Error('No es pot llegir el fitxer seleccionat.');
    }
  }

  public async saveData(data: AppData, uri: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2); // Pretty-print JSON
      await FileSystem.writeAsStringAsync(uri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error('Error en desar el fitxer al dispositiu:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}
