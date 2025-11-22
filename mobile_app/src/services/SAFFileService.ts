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
      // Buidem la memòria cau del selector de documents per assegurar-nos que sempre es llegeixi el fitxer més recent
      const cacheDir = `${FileSystem.cacheDirectory}DocumentPicker`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
      }

      const pickerOptions = {
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      };

      const result = await DocumentPicker.getDocumentAsync(pickerOptions);

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        const content = await FileSystem.readAsStringAsync(uri, {
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
      throw new Error(`No s'ha pogut obrir el fitxer: ${(error as Error).message}`);
    }
  }

  public async saveFileAs(jsonString: string, fileName: string): Promise<{ uri: string; name: string } | null> {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        return null;
      }

      const result = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/json'
        );

      await FileSystem.writeAsStringAsync(result, jsonString, {
        encoding: 'utf8',
      });

      const name = result.split('%2F').pop()?.split('?')[0] || fileName;

      return { uri: result, name: decodeURIComponent(name) };
    } catch (error) {
      console.error('Error al desar el fitxer com a:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }

  public async shareFile(jsonString: string, fileName: string): Promise<void> {
    try {
      const temporaryFilePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(temporaryFilePath, jsonString, {
        encoding: 'utf8',
      });

      await Sharing.shareAsync(temporaryFilePath, {
        mimeType: 'application/json',
        dialogTitle: 'Compartir fitxer...',
      });

    } catch (error) {
      console.error('Error al compartir el fitxer:', error);
      throw new Error('No s’ha pogut compartir el fitxer.');
    }
  }
}
