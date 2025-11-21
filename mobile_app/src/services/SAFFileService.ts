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
      const pickerOptions = {
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      };
      console.log('[DEBUG_SAF] Obrint selector de fitxer amb opcions:', pickerOptions);

      const result = await DocumentPicker.getDocumentAsync(pickerOptions);

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('[DEBUG_SAF] Asset rebut de DocumentPicker:', JSON.stringify(asset, null, 2));

        const uri = asset.uri;
        if (uri.startsWith('content://')) {
          console.log(`[DEBUG_SAF] La URI és de tipus 'content://' (nativa del proveïdor).`);
        } else if (uri.startsWith('file://')) {
          console.log(`[DEBUG_SAF] La URI és de tipus 'file://' (còpia local a la cache).`);
        } else {
          console.warn(`[DEBUG_SAF] La URI té un format inesperat: ${uri}`);
        }

        console.log(`[DEBUG_SAF] Iniciant lectura del fitxer des de la URI: ${uri}`);
        const content = await FileSystem.readAsStringAsync(uri, {
          encoding: 'utf8',
        });
        console.log('[DEBUG_RAW_READ] Contingut llegit (inici):', content.substring(0, 500));
        
        const data = JSON.parse(content);

        const firstEventLastModified = data.eventFrames?.[0]?.lastModified;
        console.log(`[DEBUG_SAF] Lectura finalitzada. Contingut parsejat. Data de modificació del primer esdeveniment: ${firstEventLastModified || 'N/A'}`);

        console.log(`[DEBUG_SAF] Intentant esborrar el fitxer de la cache: ${uri}`);
        try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
            console.log(`[DEBUG_SAF] Fitxer de la cache esborrat amb èxit.`);
        } catch (cleanupError) {
            console.warn("[DEBUG_SAF] No s'ha pogut netejar el fitxer temporal de la cache:", cleanupError);
        }

        return {
          uri: uri, 
          name: asset.name,
          content: data,
        };
      }
      console.log('[DEBUG_SAF] L\'usuari ha cancel·lat la selecció de fitxer.');
      return null;
    } catch (error) {
      console.error("[DEBUG_SAF] Error a l'obrir el fitxer:", error);
      throw new Error(`No s'ha pogut obrir el fitxer: ${(error as Error).message}`);
    }
  }

  public async saveFileAs(jsonString: string, fileName: string): Promise<void> {
    try {
      const temporaryFilePath = `${FileSystem.cacheDirectory}${fileName}`;
      console.log(`[DEBUG_SAF] Preparant fitxer temporal per desar a: ${temporaryFilePath}`);

      console.log('[DEBUG_RAW_WRITE] Contingut a desar (inici):', jsonString.substring(0, 500));
      await FileSystem.writeAsStringAsync(temporaryFilePath, jsonString, {
        encoding: 'utf8',
      });

      console.log('[DEBUG_SAF] Fitxer temporal escrit. Cridant a Sharing.shareAsync...');
      await Sharing.shareAsync(temporaryFilePath, {
        mimeType: 'application/json',
        dialogTitle: 'Desar com a...',
      });
      console.log('[DEBUG_SAF] Diàleg de compartir finalitzat.');

    } catch (error) {
      console.error('[DEBUG_SAF] Error al desar el fitxer:', error);
      throw new Error('No s’ha pogut desar el fitxer.');
    }
  }
}