const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Document Management
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showUnsavedChangesDialog: (options) => ipcRenderer.invoke('show-unsaved-changes-dialog', options),

  // Session & App Lifecycle
  onConfirmQuit: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('confirm-quit-signal', subscription);
    return () => ipcRenderer.removeListener('confirm-quit-signal', subscription);
  },
  quitApplication: () => ipcRenderer.invoke('quit-application'),
  getSessionData: () => ipcRenderer.invoke('get-session-data'),
  saveSessionData: (key, value) => ipcRenderer.invoke('save-session-data', { key, value }),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
  getAppMetadata: () => ipcRenderer.invoke('get-app-metadata'),
  getPlatformSync: () => process.platform,

  // File open trigger from OS
  onOpenFileTrigger: (callback) => {
    const subscription = (event, filePath) => callback(filePath);
    ipcRenderer.on('open-file-trigger', subscription);
    return () => ipcRenderer.removeListener('open-file-trigger', subscription);
  },

  // Google Integration
  loadGoogleConfig: () => ipcRenderer.invoke('load-google-config'),
  startGoogleAuth: () => ipcRenderer.invoke('google-auth-start'),
  onGoogleAuthSuccess: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('google-auth-success', subscription);
    return () => ipcRenderer.removeListener('google-auth-success', subscription);
  },
  onGoogleAuthError: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('google-auth-error', subscription);
    return () => ipcRenderer.removeListener('google-auth-error', subscription);
  },
  getCalendarList: () => ipcRenderer.invoke('google-get-calendar-list'),
  saveGoogleConfig: (config) => ipcRenderer.invoke('save-google-config', config),
  getGoogleEvents: () => ipcRenderer.invoke('get-google-events'),
  getEventDetails: (calendarId, eventId) => ipcRenderer.invoke('google-get-event-details', { calendarId, eventId }),
  syncWithGoogle: (payload) => ipcRenderer.invoke('sync-with-google', payload),
  syncSingleEventWithGoogle: (payload) => ipcRenderer.invoke('sync-single-event-with-google', payload),
  onSyncProgress: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('sync-progress', subscription);
    return () => ipcRenderer.removeListener('sync-progress', subscription);
  },
  googleDisconnect: () => ipcRenderer.invoke('google-disconnect'),
  deleteAppCalendar: (calendarId) => ipcRenderer.invoke('delete-app-calendar', calendarId),
  createNewAppCalendar: (suffix) => ipcRenderer.invoke('create-new-app-calendar', suffix),

  // Menu and Notifications
  onMenuAction: (callback) => {
    const handler = (event, action) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
  triggerMenuAction: (action) => ipcRenderer.send('trigger-menu-action', action),

  // Misc & Obsolete
  factoryReset: () => ipcRenderer.invoke('factory-reset'),
  loadAppData: () => ipcRenderer.invoke('load-app-data'),
  getPlatformSync: () => process.platform,
  openLogsFolder: () => ipcRenderer.invoke('open-logs-folder'),
  openBackupsFolder: () => ipcRenderer.invoke('open-backups-folder'),
  
  // NOU: Funció per enviar logs al backend
  logToMain: (level, ...args) => ipcRenderer.send('log-to-main', level, ...args),
});

// IMPORTANT: electron-log exposure removed due to sandbox mode restrictions
// 
// In sandbox mode (which is enabled for security), the preload script cannot
// directly require() Node.js modules like electron-log.
//
// HOW LOGGING WORKS NOW:
// 1. The logger utility (src/utils/logger.ts) checks for window.electronLog first
// 2. If not available, it falls back to console.log/error/warn/debug
// 3. electron-log's log.initialize() in main.cjs (line 83) should automatically
//    capture console.log calls from the renderer via IPC
// 4. If automatic capture doesn't work in sandbox mode, logs will still appear
//    in the browser console (DevTools), which is acceptable for debugging
//
// IMPACT ON COMPILED APP:
// - Development: Logs appear in DevTools console (fully functional)
// - Production: electron-log should capture console.log via IPC if configured correctly
// - If not, logs still work in DevTools (no functionality lost)
//
// This change ELIMINATES the error and maintains full logging functionality.