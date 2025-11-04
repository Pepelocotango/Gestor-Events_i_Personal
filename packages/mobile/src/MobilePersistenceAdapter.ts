import type { PersistenceAdapter, AppData, ShowSaveDialogOptions, ShowSaveDialogResult } from '@gep/core/types';
import { getInfoAsync, readAsStringAsync, writeAsStringAsync, copyAsync, documentDirectory, EncodingType } from 'expo-file-system/legacy';

// Aquesta implementació completa de PersistenceAdapter està dissenyada per a l'entorn mòbil.
// Els mètodes que no són rellevants per a la plataforma mòbil llancen un error
// per indicar que no estan implementats, però existeixen per satisfer el contracte de la interfície.

class MobilePersistenceAdapter implements Omit<PersistenceAdapter, 'on' | 'off' | 'removeAllListeners'> {
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; message?: string; }> {
    try {
      const content = await readAsStringAsync(filePath, {
        encoding: EncodingType.UTF8,
      });
      return { success: true, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message };
    }
  }

  async saveFile({ filePath, data }: { filePath: string; data: string }): Promise<{ success: boolean; message?: string; }> {
    try {
      await writeAsStringAsync(filePath, data, {
        encoding: EncodingType.UTF8,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message };
    }
  }

  async ensureDataFileExists(asset: any): Promise<{ path: string; message: string }> {
    const userDataPath = (documentDirectory || '') + 'user_data.json';
    const fileInfo = await getInfoAsync(userDataPath);

    if (!fileInfo.exists) {
      if (asset.localUri) {
        await copyAsync({
          from: asset.localUri,
          to: userDataPath,
        });
        return { path: userDataPath, message: 'Fitxer d\'exemple copiat correctament.' };
      } else {
        throw new Error("No s'ha pogut obtenir la URI local de l'actiu per copiar.");
      }
    }
    return { path: userDataPath, message: 'El fitxer de dades ja existeix.' };
    }

  // --- Mètodes no implementats (per a compatibilitat de tipus) ---

  async openFileDialog(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; message?: string; }> {
    throw new Error('openFileDialog no està implementat a la plataforma mòbil.');
  }

  async showSaveDialog(options: ShowSaveDialogOptions): Promise<ShowSaveDialogResult> {
    throw new Error('showSaveDialog no està implementat a la plataforma mòbil.');
  }

  async showUnsavedChangesDialog(options: { message: string; buttons: string[] }): Promise<{ response: number; }> {
    throw new Error('showUnsavedChangesDialog no està implementat a la plataforma mòbil.');
  }

  async logInfo(message: string): Promise<void> {
    console.log(message);
  }

  async logError(message: string): Promise<void> {
    console.error(message);
  }

  // Afegeix la resta de mètodes de la interfície amb implementacions buides o que llancin errors
  onConfirmQuit(callback: () => void): () => void {
    throw new Error('Method not implemented.');
  }
  quitApplication(): void {
    throw new Error('Method not implemented.');
  }
  getSessionData(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  saveSessionData(key: string, value: any): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  getRecentFiles(): Promise<string[]> {
     throw new Error('Method not implemented.');
  }
  addRecentFile(filePath: string): Promise<{ success: boolean; recentFiles: string[]; }> {
    throw new Error('Method not implemented.');
  }
  getAppMetadata(): Promise<{ name: string; version: string; description: string; }> {
    throw new Error('Method not implemented.');
  }
  loadGoogleConfig(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  startGoogleAuth(): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  onGoogleAuthSuccess(callback: () => void): () => void {
    throw new Error('Method not implemented.');
  }
  onGoogleAuthError(callback: (errorMessage: string) => void): () => void {
    throw new Error('Method not implemented.');
  }
  getCalendarList(): Promise<{ success: boolean; calendars?: any[]; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  saveGoogleConfig(config: any): Promise<{ success: boolean; data?: any; message?: string; }> {
    throw new Error('Method not implementat.');
  }
  getGoogleEvents(): Promise<{ success: boolean; events?: any[]; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  getEventDetails(calendarId: string, eventId: string): Promise<{ success: boolean; event?: any; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  syncWithGoogle(payload: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  onSyncProgress(callback: (progress: any) => void): () => void {
    throw new Error('Method not implemented.');
  }
  googleDisconnect(): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  deleteAppCalendar(calendarId: string): Promise<{ success: boolean; message?: string; data?: any; }> {
    throw new Error('Method not implemented.');
  }
  createNewAppCalendar(suffix: string): Promise<{ success: boolean; message?: string; data?: any; }> {
    throw new Error('Method not implemented.');
  }
  onMenuAction(callback: (action: string) => void): () => void {
    throw new Error('Method not implemented.');
  }
  triggerMenuAction(action: string): void {
    throw new Error('Method not implemented.');
  }
  onBackendNotification(callback: (notification: any) => void): () => void {
    throw new Error('Method not implemented.');
  }
  factoryReset(): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  openLogsFolder(): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  openBackupsFolder(): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  loadAppData(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  saveAppData(data: AppData): Promise<{ success: boolean; message?: string; }> {
    throw new Error('Method not implemented.');
  }
  getDefaultDataPath(): Promise<string> {
    throw new Error('Method not implemented.');
  }
  onAppWillRelaunchAfterReset(callback: () => void): () => void {
    throw new Error('Method not implemented.');
  }
  onSyncError(callback: (error: string) => void): () => void {
    throw new Error('Method not implemented.');
  }
  onSyncSuccess(callback: (message: string) => void): () => void {
    throw new Error('Method not implemented.');
  }
  getPlatformSync(): "darwin" | "win32" | "linux" {
    throw new Error('Method not implemented.');
  }
}

export default new MobilePersistenceAdapter() as any as PersistenceAdapter;
