import type { PersistenceAdapter, AppData, ShowSaveDialogOptions, ShowSaveDialogResult, GoogleConfig, SyncProgressState } from '@gep/core/types';
import * as FileSystem from 'expo-file-system';

// Aquesta és una implementació parcial de PersistenceAdapter per a la Prova de Concepte (POC) mòbil.
// Només s'implementen els mètodes necessaris per llegir i escriure dades localment.

class MobilePersistenceAdapterImpl {
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; message?: string; }> {
    try {
      const content = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return { success: true, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message };
    }
  }

  async saveFile({ filePath, data }: { filePath: string; data: string }): Promise<{ success: boolean; message?: string; }> {
    try {
      await FileSystem.writeAsStringAsync(filePath, data, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message };
    }
  }

  // --- Mètodes no implementats per a la POC ---
  // Aquests mètodes formen part de la interfície PersistenceAdapter però no són
  // necessaris per a la funcionalitat bàsica de la versió mòbil en aquesta fase.
  // Es deixen comentats com a referència per a futures implementacions.

  // async ensureDataFileExists(asset: any): Promise<{ path: string; message: string }> {
  //   const userDataPath = (FileSystem.documentDirectory || '') + 'user_data.json';
  //   const fileInfo = await FileSystem.getInfoAsync(userDataPath);
  //
  //   if (!fileInfo.exists) {
  //     if (asset.localUri) {
  //       await FileSystem.copyAsync({
  //         from: asset.localUri,
  //         to: userDataPath,
  //       });
  //       return { path: userDataPath, message: 'Fitxer d\'exemple copiat correctament.' };
  //     } else {
  //       throw new Error("No s'ha pogut obtenir la URI local de l'actiu per copiar.");
  //     }
  //   }
  //   return { path: userDataPath, message: 'El fitxer de dades ja existeix.' };
  // }

  // // Gestió de dades i fitxers
  // async openFileDialog(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; message?: string; }> {
  //   throw new Error('openFileDialog no està implementat a la plataforma mòbil.');
  // }
  //
  // async showSaveDialog(options: ShowSaveDialogOptions): Promise<ShowSaveDialogResult> {
  //   throw new Error('showSaveDialog no està implementat a la plataforma mòbil.');
  // }
  //
  // async showUnsavedChangesDialog(options: { message: string; buttons: string[] }): Promise<{ response: number; }> {
  //   throw new Error('showUnsavedChangesDialog no està implementat a la plataforma mòbil.');
  // }
  //
  // // Integració amb Google
  // async saveGoogleConfig(config: Partial<GoogleConfig>): Promise<{ success: boolean }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async loadGoogleConfig(): Promise<GoogleConfig | null> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async getGoogleEvents(): Promise<{ success: boolean; events?: any[]; message?: string }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async syncWithGoogle(payload: { localData: AppData, targetCalendarId: string }): Promise<any> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async startGoogleAuth(): Promise<{ success: boolean; message?: string }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // // Cicle de vida i metadades de l'aplicació
  // async getAppMetadata(): Promise<{ name: string; version: string; description: string; }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // getPlatformSync(): 'darwin' | 'win32' | 'linux' {
  //   throw new Error('Method not implemented.');
  // }
  //
  // quitApplication(): void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async factoryReset(): Promise<{ success: boolean; message?: string }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // // Sessió i configuració
  // async addRecentFile(filePath: string): Promise<{ success: boolean; recentFiles: string[] }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async getRecentFiles(): Promise<string[]> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async getSessionData(): Promise<{ [key: string]: any; }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async saveSessionData(key: string, value: any): Promise<{ success: boolean; }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // // Utilitats
  // async openLogsFolder(): Promise<{ success: boolean; message?: string }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // async openBackupsFolder(): Promise<{ success: boolean; message?: string }> {
  //   throw new Error('Method not implemented.');
  // }
  //
  // // Event listeners (IPC)
  // onConfirmQuit(callback: () => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onGoogleAuthSuccess(callback: () => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onGoogleAuthError(callback: (message: string) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onSyncProgress(callback: (progress: SyncProgressState) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onAppWillRelaunchAfterReset(callback: () => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onSyncError(callback: (error: string) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onSyncSuccess(callback: (message: string) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onBackendNotification(callback: (notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
  //
  // onMenuAction(callback: (action: string) => void): () => void {
  //   throw new Error('Method not implemented.');
  // }
}

// Exportem una única instància, fent un cast a PersistenceAdapter per complir amb la interfície.
// Això és segur en el nostre context, ja que @gep/core no cridarà directament
// a cap mètode no implementat en aquesta fase.
export default new MobilePersistenceAdapterImpl() as any as PersistenceAdapter;
