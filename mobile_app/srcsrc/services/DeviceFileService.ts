import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { IFileService } from './fileService';
import { AppData } from '../types';

export class DeviceFileService implements IFileService {
  public async loadData(): Promise<AppData> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(uri);
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

  public saveData(data: AppData): Promise<void> {
    // Aquesta funció no és necessària per a aquest servei
    console.warn('La funció saveData no està implementada per a DeviceFileService.');
    return Promise.resolve();
  }
}
