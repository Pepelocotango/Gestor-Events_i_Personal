import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { AppData } from '../types';
import { IFileService } from './fileService';

export class SAFFileService implements IFileService {
  public async openFile(): Promise<{
    uri: string;
    name: string;
    content: AppData;
  } | null> {
    try {
      // ELIMINEM la lògica de neteja manual de carpetes perquè és fràgil.

      const result = await DocumentPicker.getDocumentAsync({
        // CANVI CLAU: false.
        // Això fa que ens doni la URI directa al fitxer original (o temporal del sistema),
        // en lloc de crear-ne una còpia persistent a la nostra cache que pot quedar obsoleta.
        copyToCacheDirectory: false, 
        multiple: false,
        type: '*/*',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // En Android, això serà un 'content://...', en iOS un 'file:///tmp/...'
        // En ambdós casos, és la versió "viva" que l'usuari acaba de seleccionar.
        const uriForReading = asset.uri; 

        if (!uriForReading) {
          throw new Error("No s'ha pogut obtenir una URI vàlida per llegir el fitxer.");
        }

        // FileSystem.readAsStringAsync sap llegir URIs 'content://' nativament
        const content = await FileSystem.readAsStringAsync(uriForReading, {
          encoding: 'utf8',
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

  // ... (el mètode saveFileAs es manté igual)
  public async saveFileAs(jsonString: string, fileName: string): Promise<void> {
     // ... el teu codi existent ...
     try {
      const temporaryFilePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(temporaryFilePath, jsonString, {
        encoding: 'utf8',
      });

      await Sharing.shareAsync(temporaryFilePath, {
        mimeType: 'application/json',
        dialogTitle: 'Desar com a...',
      });

    } catch (error) {
      console.error('Error al desar el fitxer:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}