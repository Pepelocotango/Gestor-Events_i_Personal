export interface PersistenceAdapter {
  // Document management
  openFileDialog?: () => Promise<{ success: boolean; canceled?: boolean; filePath?: string; message?: string }>;
  readFile?: (filePath: string) => Promise<{ success: boolean; content?: string; message?: string }>;
  saveFile?: (options: { filePath: string; data: string }) => Promise<{ success: boolean; message?: string }>;
  showSaveDialog?: (options: any) => Promise<any>;
  showUnsavedChangesDialog?: (options: { message: string; buttons: string[] }) => Promise<{ response: number }>;

  // Session & App lifecycle
  getSessionData?: () => Promise<any>;
  saveSessionData?: (key: string, value: any) => Promise<{ success: boolean; message?: string }>;
  getRecentFiles?: () => Promise<string[]>;
  addRecentFile?: (filePath: string) => Promise<{ success: boolean; recentFiles: string[] }>;
  getAppMetadata?: () => Promise<{ name: string; version: string; description: string }>;

  // Google integration
  loadGoogleConfig?: () => Promise<any>;
  saveGoogleConfig?: (config: any) => Promise<any>;
  getGoogleEvents?: () => Promise<{ success: boolean; events?: any[]; message?: string }>;
  syncWithGoogle?: (payload: { localData: any; targetCalendarId: string }) => Promise<any>;

  // Misc
  onSyncProgress?: (callback: (progress: any) => void) => () => void;
  onMenuAction?: (callback: (action: string) => void) => () => void;
  onGoogleAuthSuccess?: (callback: () => void) => () => void;
  onGoogleAuthError?: (callback: (msg: string) => void) => () => void;
}

export default PersistenceAdapter;
