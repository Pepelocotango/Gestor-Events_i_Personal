import type { ShowToastFunction } from '@gep/core';

/**
 * Opcions per al diàleg de desat de fitxers.
 */
interface SaveFileOptions {
  title: string;
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
  data: ArrayBuffer | string;
}

/**
 * Obre un diàleg nadiu per desar un fitxer (PDF, CSV, etc.).
 * Aquesta funció fa d'intermediari amb l'API d'Electron exposada a `window.electronAPI`.
 * @param options - La configuració del diàleg i les dades a desar.
 * @param showToast - Funció per mostrar notificacions a la UI.
 */
export async function saveFileWithDialog(
  options: SaveFileOptions,
  showToast: ShowToastFunction
): Promise<void> {
  // Comprova si l'API d'Electron està disponible.
  if (window.electronAPI?.showSaveDialog) {
    try {
      // Crida a la funció del procés principal per mostrar el diàleg i desar el fitxer.
      // Les dades (ArrayBuffer | string) s'envien directament. La conversió a Buffer
      // es farà al procés principal (backend) on l'API de Node.js està disponible.
      const result = await window.electronAPI.showSaveDialog({
        ...options, // options ja conté 'data', així que s'enviarà directament.
        isDocumentSave: false, // Això sempre és `false` per a exportacions.
      });

      // Gestiona el resultat de l'operació.
      if (result.success) {
        showToast('Fitxer desat amb èxit!', 'success');
      } else if (!result.canceled) {
        // Mostra un error si el desat falla per un motiu diferent a la cancel·lació.
        showToast(`Error en desar el fitxer: ${result.message}`, 'error');
      }
      // Si l'usuari cancel·la (`result.canceled === true`), no es fa res.

    } catch (error) {
      console.error('Error durant el procés de desat del fitxer:', error);
      showToast(`S'ha produït un error inesperat: ${(error as Error).message}`, 'error');
    }
  } else {
    // Aquest cas no hauria de passar en l'entorn d'Electron.
    console.error('L\'API d\'Electron (window.electronAPI.showSaveDialog) no està disponible.');
    showToast('Error: La funcionalitat per desar fitxers no està disponible.', 'error');
  }
}
