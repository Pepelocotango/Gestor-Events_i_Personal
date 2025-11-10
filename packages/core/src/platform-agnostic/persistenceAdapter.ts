
import type { GoogleConfig, ShowSaveDialogOptions, ShowSaveDialogResult, SyncProgressState, AppData } from './types';

export interface PersistenceAdapter {
  // Gestió de dades i fitxers
  readFile(filePath: string): Promise<{ success: boolean; content?: string; message?: string; }>;
  saveFile(options: { filePath: string; data: string; }): Promise<{ success: boolean; message?: string; }>;
  showSaveDialog(options: ShowSaveDialogOptions): Promise<ShowSaveDialogResult>;
  openFileDialog(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; message?: string; }>;
  showUnsavedChangesDialog(options: { message: string, buttons: string[] }): Promise<{ response: number }>;

  // Integració amb Google
  saveGoogleConfig(config: Partial<GoogleConfig>): Promise<{ success: boolean }>;
  loadGoogleConfig(): Promise<GoogleConfig | null>;
  getGoogleEvents(): Promise<{ success: boolean; events?: any[]; message?: string }>;
  syncWithGoogle(payload: { localData: AppData, targetCalendarId: string }): Promise<any>;
  startGoogleAuth(): Promise<{ success: boolean; message?: string }>;

  // Cicle de vida i metadades de l'aplicació
  getAppMetadata(): Promise<{ name: string; version: string; description: string; }>;
  getPlatformSync(): 'darwin' | 'win32' | 'linux';
  quitApplication(): void;
  factoryReset(): Promise<{ success: boolean; message?: string }>;

  // Sessió i configuració
  addRecentFile(filePath: string): Promise<{ success: boolean; recentFiles: string[] }>;
  getRecentFiles(): Promise<string[]>;
  getSessionData(): Promise<{ [key: string]: any; }>;
  saveSessionData(key: string, value: any): Promise<{ success: boolean; }>;

  // Utilitats
  openLogsFolder(): Promise<{ success: boolean; message?: string }>;
  openBackupsFolder(): Promise<{ success: boolean; message?: string }>;

  // Event listeners (IPC)
  onConfirmQuit(callback: () => void): () => void; // Retorna una funció de neteja
  onGoogleAuthSuccess(callback: () => void): () => void;
  onGoogleAuthError(callback: (message: string) => void): () => void;
  onSyncProgress(callback: (progress: SyncProgressState) => void): () => void;
  onAppWillRelaunchAfterReset(callback: () => void): () => void;
  onSyncError(callback: (error: string) => void): () => void;
  onSyncSuccess(callback: (message: string) => void): () => void;
  onBackendNotification(callback: (notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void): () => void;
  onMenuAction(callback: (action: string) => void): () => void;
}
