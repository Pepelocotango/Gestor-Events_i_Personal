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
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on('confirm-quit-signal', handler);
    return () => ipcRenderer.removeListener('confirm-quit-signal', handler);
  },
  createBackupAndQuit: (data) => ipcRenderer.invoke('create-backup-and-quit', data),
  getSessionData: () => ipcRenderer.invoke('get-session-data'),
  saveSessionData: (key, value) => ipcRenderer.invoke('save-session-data', { key, value }),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),

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
  syncWithGoogle: (payload) => ipcRenderer.invoke('sync-with-google', payload),
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
  log: (message, data) => ipcRenderer.send('log-message', message, data),
  loadAppData: () => ipcRenderer.invoke('load-app-data'),
});