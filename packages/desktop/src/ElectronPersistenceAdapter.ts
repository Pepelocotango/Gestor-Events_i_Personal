
import type { PersistenceAdapter, GoogleConfig, SyncPayload, SaveDialogOptions, UnsavedChangesDialogOptions, NotificationPayload, SyncProgressState, AppData } from '@gep/core';

// Aquest objecte implementa la interfície PersistenceAdapter definida al paquet @gep/core.
// La seva única responsabilitat és delegar cada crida a la funció corresponent
// de l'API d'Electron exposada a través de l'objecte `window.electronAPI` pel preload script.
// Això manté la lògica de l'aplicació (stores) completament aïllada de l'entorn d'execució.

const ElectronPersistenceAdapter: PersistenceAdapter = {
  // --- Gestió de dades i fitxers ---

  // Llegeix el contingut d'un fitxer de forma asíncrona.
  readFile: (filePath: string) => {
    return window.electronAPI.readFile(filePath);
  },

  // Desa dades a un fitxer específic.
  saveFile: (options: { filePath: string; data: string; }) => {
    return window.electronAPI.saveFile(options);
  },

  // Mostra un diàleg per desar un fitxer i opcionalment hi escriu les dades.
  showSaveDialog: (options: SaveDialogOptions) => {
    return window.electronAPI.showSaveDialog(options);
  },

  // Mostra un diàleg per obrir un fitxer.
  openFileDialog: () => {
    return window.electronAPI.openFileDialog();
  },

  // Mostra un diàleg de confirmació per a canvis no desats.
  showUnsavedChangesDialog: (options: UnsavedChangesDialogOptions) => {
    return window.electronAPI.showUnsavedChangesDialog(options);
  },

  // --- Integració amb Google ---

  // Desa la configuració de Google de l'usuari.
  saveGoogleConfig: (config: Partial<GoogleConfig>) => {
    return window.electronAPI.saveGoogleConfig(config);
  },

  // Carrega la configuració de Google de l'usuari.
  loadGoogleConfig: () => {
    return window.electronAPI.loadGoogleConfig();
  },

  // Obté els esdeveniments del calendari de Google.
  getGoogleEvents: () => {
    return window.electronAPI.getGoogleEvents();
  },

  // Inicia el procés de sincronització amb Google Calendar.
  syncWithGoogle: (payload: SyncPayload) => {
    // La referència directa a `exportData` i `loadData` es gestiona dins de l'store.
    // L'adaptador només ha de passar les dades i opcions al procés principal.
    return window.electronAPI.syncWithGoogle(payload);
  },

  // Inicia el flux d'autenticació amb Google.
  startGoogleAuth: () => {
    return window.electronAPI.startGoogleAuth();
  },

  // --- Cicle de vida i metadades de l'aplicació ---

  // Obté les metadades de l'aplicació (nom, versió, etc.).
  getAppMetadata: () => {
    return window.electronAPI.getAppMetadata();
  },

  // Obté la plataforma actual de forma síncrona.
  getPlatformSync: () => {
    return window.electronAPI.getPlatformSync();
  },

  // Tanca l'aplicació.
  quitApplication: () => {
    window.electronAPI.quitApplication();
  },

  // Restaura la configuració de fàbrica.
  factoryReset: () => {
    return window.electronAPI.factoryReset();
  },

  // --- Sessió i configuració ---

  // Afegeix un fitxer a la llista de fitxers recents.
  addRecentFile: (filePath: string) => {
    return window.electronAPI.addRecentFile(filePath);
  },

  // Obté la llista de fitxers recents.
  getRecentFiles: () => {
    return window.electronAPI.getRecentFiles();
  },

  // Obté dades de la sessió actual.
  getSessionData: () => {
    return window.electronAPI.getSessionData();
  },

  // Desa dades a la sessió actual.
  saveSessionData: (key: string, value: any) => {
    return window.electronAPI.saveSessionData(key, value);
  },

  // --- Utilitats ---

  // Obre la carpeta de logs.
  openLogsFolder: () => {
    return window.electronAPI.openLogsFolder();
  },

  // Obre la carpeta de backups.
  openBackupsFolder: () => {
    return window.electronAPI.openBackupsFolder();
  },

  // --- Event Listeners (IPC) ---

  // Registra un callback per a l'esdeveniment de confirmació de tancament.
  onConfirmQuit: (callback: () => void) => {
    return window.electronAPI.onConfirmQuit(callback);
  },

  // Registra un callback per a l'èxit de l'autenticació de Google.
  onGoogleAuthSuccess: (callback: () => void) => {
    return window.electronAPI.onGoogleAuthSuccess(callback);
  },

  // Registra un callback per a l'error de l'autenticació de Google.
  onGoogleAuthError: (callback: (message: string) => void) => {
    return window.electronAPI.onGoogleAuthError(callback);
  },

  // Registra un callback per al progrés de la sincronització.
  onSyncProgress: (callback: (progress: SyncProgressState) => void) => {
    return window.electronAPI.onSyncProgress(callback);
  },

  // Registra un callback per quan l'app es reiniciarà.
  onAppWillRelaunchAfterReset: (callback: () => void) => {
    return window.electronAPI.onAppWillRelaunchAfterReset(callback);
  },

  // Registra un callback per a errors de sincronització.
  onSyncError: (callback: (error: string) => void) => {
    return window.electronAPI.onSyncError(callback);
  },

  // Registra un callback per a èxits de sincronització.
  onSyncSuccess: (callback: (message: string) => void) => {
    return window.electronAPI.onSyncSuccess(callback);
  },

  // Registra un callback per a notificacions generals del backend.
  onBackendNotification: (callback: (notification: NotificationPayload) => void) => {
    return window.electronAPI.onBackendNotification(callback);
  },

  // Registra un callback per a les accions del menú personalitzat.
  onMenuAction: (callback: (action: string) => void) => {
    return window.electronAPI.onMenuAction(callback);
  },
};

export default ElectronPersistenceAdapter;
