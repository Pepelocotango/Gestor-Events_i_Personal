import * as FileSystem from 'expo-file-system';
import { IFileService } from './fileService';
import { AppData } from '../types';

export class DeviceFileService implements IFileService {
  public async saveData(data: AppData, uri: string): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);

      await FileSystem.writeAsStringAsync(uri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error('Error en desar el fitxer al dispositiu:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }

  // El mètode loadData ja no és necessari aquí, ja que la selecció de fitxers es gestiona a les pantalles.
}
