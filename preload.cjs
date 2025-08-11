const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadAppData: () => ipcRenderer.invoke('load-app-data'),
  saveAppData: (data) => ipcRenderer.invoke('save-app-data', data),
   loadGoogleConfig: () => ipcRenderer.invoke('load-google-config'),
   onConfirmQuit: (callback) => {
    ipcRenderer.on('confirm-quit-signal', (event, ...args) => callback(...args));
   },
  sendQuitConfirmedByRenderer: () => ipcRenderer.send('quit-confirmed-by-renderer-signal'),
   startGoogleAuth: () => ipcRenderer.invoke('google-auth-start'),
  onGoogleAuthSuccess: (callback) => ipcRenderer.on('google-auth-success', callback),
  onGoogleAuthError: (callback) => ipcRenderer.on('google-auth-error', callback),
  getCalendarList: () => ipcRenderer.invoke('google-get-calendar-list'),
  saveGoogleConfig: (config) => ipcRenderer.invoke('save-google-config', config),
  getGoogleEvents: () => ipcRenderer.invoke('get-google-events'),
  syncWithGoogle: (payload) => ipcRenderer.invoke('sync-with-google', payload),
  googleDisconnect: () => ipcRenderer.invoke('google-disconnect'),
  deleteAppCalendar: (calendarId) => ipcRenderer.invoke('delete-app-calendar', calendarId),
  createNewAppCalendar: (suffix) => ipcRenderer.invoke('create-new-app-calendar', suffix),
  getDefaultDataPath: () => ipcRenderer.invoke('get-default-data-path'),
  performHardReset: () => ipcRenderer.invoke('perform-hard-reset'),

  // Menu actions
  onMenuAction: (callback) => {
    const handler = (event, action) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => {
      ipcRenderer.removeListener('menu-action', handler);
    };
  },
  onFileDataLoaded: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('file-data-loaded', handler);
    return () => {
      ipcRenderer.removeListener('file-data-loaded', handler);
    };
  },
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  log: (message, data) => ipcRenderer.send('log-message', message, data)
});