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
      const result = await DocumentPicker.getDocumentAsync({
        // TORNEM A TRUE: Això soluciona l'error "fitxer no vàlid" perquè
        // Expo s'encarrega de moure el fitxer a un lloc on segur que el podem llegir.
        copyToCacheDirectory: true, 
        multiple: false,
        type: '*/*',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // 1. Llegim el contingut del fitxer (ara segur que és accessible)
        const content = await FileSystem.readAsStringAsync(uri, {
          encoding: 'utf8',
        });
        
        // 2. Parsejem les dades
        const data = JSON.parse(content);

        // 3. PAS CLAU: ESBORREM EL FITXER DE LA CACHE IMMEDIATAMENT
        // En eliminar-lo ara mateix, garantim que la propera vegada que l'usuari
        // obri el mateix fitxer, Expo no trobi l'antic i estigui obligat
        // a crear una nova còpia actualitzada de l'original.
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (cleanupError) {
            console.warn("No s'ha pogut netejar el fitxer temporal de la cache:", cleanupError);
        }

        return {
          uri: uri, 
          name: asset.name,
          content: data,
        };
      }
      return null;
    } catch (error) {
      console.error("Error a l'obrir el fitxer:", error);
      // Ara tindrem un error més descriptiu a la consola si falla
      throw new Error(`No s'ha pogut obrir el fitxer: ${(error as Error).message}`);
    }
  }

  public async saveFileAs(jsonString: string, fileName: string): Promise<void> {
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