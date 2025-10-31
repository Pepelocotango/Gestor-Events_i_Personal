import { toast } from 'react-hot-toast';
import { Filter } from '@gep/core';

type SaveDialogOptions = {
  title: string;
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
  data: string | ArrayBuffer;
  isDocumentSave?: boolean;
};

/**
 * Funció centralitzada per desar fitxers utilitzant el diàleg nadiu d'Electron.
 * Aquesta funció actua com a pont entre el frontend (React) i el procés principal (main.cjs).
 *
 * @param options - Un objecte de configuració per al diàleg de desat.
 *   - title: El títol de la finestra del diàleg.
 *   - defaultPath: El nom de fitxer suggerit per defecte.
 *   - filters: Un array per filtrar els tipus de fitxer (ex: [{ name: 'PDF', extensions: ['pdf'] }]).
 *   - data: El contingut a desar, ja sigui una cadena de text (per a CSV) o un ArrayBuffer (per a PDF).
 *   - isDocumentSave: Un booleà opcional per indicar si és un desat de document principal,
 *     per a la gestió de còpies de seguretat al backend. Per defecte és `false`.
 * @param showToast - Una funció per mostrar notificacions (toast) a la UI.
 */
export const saveFileWithDialog = async (
  options: SaveDialogOptions,
  showToast: (message: string, type: 'success' | 'error') => void
) => {
  const { title, defaultPath, filters, data, isDocumentSave = false } = options;

  try {
    // Per als PDFs, el contingut es genera com a ArrayBuffer al frontend.
    // El procés principal d'Electron espera un Buffer de Node.js per escriure al fitxer.
    // Per tant, fem la conversió aquí abans d'enviar les dades a través del pont IPC.
    const dataToSend =
      data instanceof ArrayBuffer ? Buffer.from(data) : data;

    const result = await window.electronAPI.showSaveDialog({
      title,
      defaultPath,
      filters,
      data: dataToSend,
      isDocumentSave,
    });

    if (result.success) {
      showToast(`Fitxer desat correctament a ${result.filePath}`, 'success');
      console.log(`Fitxer desat amb èxit: ${result.filePath}`);
    } else if (result.canceled) {
      console.log('El diàleg de desat ha estat cancel·lat per l\'usuari.');
    } else {
      throw new Error(result.message || 'S\'ha produït un error desconegut en desar el fitxer.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast(`Error en desar el fitxer: ${errorMessage}`, 'error');
    console.error('Ha fallat la operació de desar fitxer:', error);
  }
};
