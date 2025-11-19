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
      // Neteja proactiva de la memòria cau del DocumentPicker per evitar dades obsoletes.
      const cacheDir = `${FileSystem.cacheDirectory}DocumentPicker`;
      await FileSystem.deleteAsync(cacheDir, { idempotent: true });

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const uriForReading = (asset as any).fileUri || asset.uri;

        if (!uriForReading) {
          throw new Error("No s'ha pogut obtenir una URI vàlida per llegir el fitxer.");
        }

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
