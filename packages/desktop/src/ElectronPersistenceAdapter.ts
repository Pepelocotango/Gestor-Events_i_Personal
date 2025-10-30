
import type { PersistenceAdapter, GoogleConfig, ShowSaveDialogOptions, SyncProgressState, AppData } from '@gep/core';

// Helper function to create a "no-op" or "not available" response.
const notAvailable = <T>(feature: string, returnValue: T): Promise<T> => {
    console.warn(`[ElectronPersistenceAdapter] ${feature} is not available.`);
    return Promise.resolve(returnValue);
};

// No-op function for listeners when API is not available
const noOpListener = () => () => {};

const ElectronPersistenceAdapter: PersistenceAdapter = {
  // --- File and Data Management ---
  readFile: (filePath: string) => {
    if (!window.electronAPI?.readFile) return notAvailable('readFile', { success: false, message: 'API no disponible.' });
    return window.electronAPI.readFile(filePath);
  },
  saveFile: (options: { filePath: string; data: string; }) => {
    if (!window.electronAPI?.saveFile) return notAvailable('saveFile', { success: false, message: 'API no disponible.' });
    return window.electronAPI.saveFile(options);
  },
  showSaveDialog: (options: ShowSaveDialogOptions) => {
    if (!window.electronAPI?.showSaveDialog) return notAvailable('showSaveDialog', { success: false, canceled: true, message: 'API no disponible.' });
    return window.electronAPI.showSaveDialog(options);
  },
  openFileDialog: () => {
    if (!window.electronAPI?.openFileDialog) return notAvailable('openFileDialog', { success: false, canceled: true, message: 'API no disponible.' });
    return window.electronAPI.openFileDialog();
  },
  showUnsavedChangesDialog: (options: { message: string, buttons: string[] }) => {
    if (!window.electronAPI?.showUnsavedChangesDialog) return notAvailable('showUnsavedChangesDialog', { response: 2 }); // Default to 'Cancel'
    return window.electronAPI.showUnsavedChangesDialog(options);
  },

  // --- Google Integration ---
  saveGoogleConfig: (config: Partial<GoogleConfig>) => {
    if (!window.electronAPI?.saveGoogleConfig) return notAvailable('saveGoogleConfig', { success: false, message: 'API no disponible.' });
    return window.electronAPI.saveGoogleConfig(config);
  },
  loadGoogleConfig: () => {
    if (!window.electronAPI?.loadGoogleConfig) return notAvailable('loadGoogleConfig', null);
    return window.electronAPI.loadGoogleConfig();
  },
  getGoogleEvents: () => {
    if (!window.electronAPI?.getGoogleEvents) return notAvailable('getGoogleEvents', { success: false, message: 'API no disponible.' });
    return window.electronAPI.getGoogleEvents();
  },
  syncWithGoogle: (payload: { localData: AppData; targetCalendarId: string; }) => {
    if (!window.electronAPI?.syncWithGoogle) return notAvailable('syncWithGoogle', { success: false, message: 'API no disponible.' });
    return window.electronAPI.syncWithGoogle(payload);
  },
  startGoogleAuth: () => {
    if (!window.electronAPI?.startGoogleAuth) return notAvailable('startGoogleAuth', { success: false, message: 'API no disponible.' });
    return window.electronAPI.startGoogleAuth();
  },

  // --- App Lifecycle & Metadata ---
  getAppMetadata: () => {
    if (!window.electronAPI?.getAppMetadata) return notAvailable('getAppMetadata', { name: 'N/A', version: 'N/A', description: 'N/A' });
    return window.electronAPI.getAppMetadata();
  },
  getPlatformSync: () => {
    return (window.electronAPI?.getPlatformSync() || 'linux') as 'darwin' | 'win32' | 'linux';
  },
  quitApplication: () => {
    window.electronAPI?.quitApplication();
  },
  factoryReset: () => {
    if (!window.electronAPI?.factoryReset) return notAvailable('factoryReset', { success: false, message: 'API no disponible.' });
    return window.electronAPI.factoryReset();
  },

  // --- Session & Config ---
  addRecentFile: (filePath: string) => {
    if (!window.electronAPI?.addRecentFile) return notAvailable('addRecentFile', { success: false, recentFiles: [] });
    return window.electronAPI.addRecentFile(filePath);
  },
  getRecentFiles: () => {
    if (!window.electronAPI?.getRecentFiles) return notAvailable('getRecentFiles', []);
    return window.electronAPI.getRecentFiles();
  },
  getSessionData: () => {
    if (!window.electronAPI?.getSessionData) return notAvailable('getSessionData', {});
    return window.electronAPI.getSessionData();
  },
  saveSessionData: (key: string, value: any) => {
    if (!window.electronAPI?.saveSessionData) return notAvailable('saveSessionData', { success: false });
    return window.electronAPI.saveSessionData(key, value);
  },

  // --- Utilities ---
  openLogsFolder: () => {
    if (!window.electronAPI?.openLogsFolder) return notAvailable('openLogsFolder', { success: false, message: 'API no disponible.' });
    return window.electronAPI.openLogsFolder();
  },
  openBackupsFolder: () => {
    if (!window.electronAPI?.openBackupsFolder) return notAvailable('openBackupsFolder', { success: false, message: 'API no disponible.' });
    return window.electronAPI.openBackupsFolder();
  },

  // --- Event Listeners (IPC) ---
  onConfirmQuit: (callback: () => void) => {
    return window.electronAPI?.onConfirmQuit(callback) || noOpListener();
  },
  onGoogleAuthSuccess: (callback: () => void) => {
    return window.electronAPI?.onGoogleAuthSuccess(callback) || noOpListener();
  },
  onGoogleAuthError: (callback: (message: string) => void) => {
    return window.electronAPI?.onGoogleAuthError(callback) || noOpListener();
  },
  onSyncProgress: (callback: (progress: SyncProgressState) => void) => {
    // Note: The original error was that the callback in the API expected Omit<SyncProgressState, 'visible'>
    // We adjust the adapter's public interface to match the core definition for consistency.
    const wrapper = (progress: Omit<SyncProgressState, 'visible'>) => callback({ ...progress, visible: true });
    return window.electronAPI?.onSyncProgress(wrapper) || noOpListener();
  },
  onAppWillRelaunchAfterReset: (callback: () => void) => {
    return window.electronAPI?.onAppWillRelaunchAfterReset(callback) || noOpListener();
  },
  onSyncError: (callback: (error: string) => void) => {
    return window.electronAPI?.onSyncError(callback) || noOpListener();
  },
  onSyncSuccess: (callback: (message: string) => void) => {
    return window.electronAPI?.onSyncSuccess(callback) || noOpListener();
  },
  onBackendNotification: (callback: (notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void) => {
    return window.electronAPI?.onBackendNotification(callback) || noOpListener();
  },
  onMenuAction: (callback: (action: string) => void) => {
    return window.electronAPI?.onMenuAction(callback) || noOpListener();
  },
};

export default ElectronPersistenceAdapter;
