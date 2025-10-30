import type { PersistenceAdapter } from '../packages/core/src/persistenceAdapter';

class ElectronPersistenceAdapterImpl implements PersistenceAdapter {
  openFileDialog = () => {
    const r = window.electronAPI?.openFileDialog?.();
    return (r ?? Promise.resolve({ success: false })) as any;
  };

  readFile = (path: string) => {
    const r = window.electronAPI?.readFile?.(path);
    return (r ?? Promise.resolve({ success: false, message: 'Adapter not available' })) as any;
  };

  saveFile = (options: { filePath: string; data: string }) => {
    const r = window.electronAPI?.saveFile?.(options);
    return (r ?? Promise.resolve({ success: false, message: 'Adapter not available' })) as any;
  };

  showSaveDialog = (options: any) => {
    const r = window.electronAPI?.showSaveDialog?.(options);
    return (r ?? Promise.resolve({ success: false, canceled: true })) as any;
  };

  showUnsavedChangesDialog = (options: { message: string; buttons: string[] }) => {
    const r = window.electronAPI?.showUnsavedChangesDialog?.(options);
    return (r ?? Promise.resolve({ response: 2 })) as any;
  };

  getSessionData = () => {
    const r = window.electronAPI?.getSessionData?.();
    return (r ?? Promise.resolve({})) as any;
  };

  saveSessionData = (key: string, value: any) => {
    const r = window.electronAPI?.saveSessionData?.(key, value);
    return (r ?? Promise.resolve({ success: false })) as any;
  };

  getRecentFiles = () => {
    const r = window.electronAPI?.getRecentFiles?.();
    return (r ?? Promise.resolve([])) as any;
  };

  addRecentFile = (filePath: string) => {
    const r = window.electronAPI?.addRecentFile?.(filePath);
    return (r ?? Promise.resolve({ success: false, recentFiles: [] })) as any;
  };

  getAppMetadata = () => {
    const r = window.electronAPI?.getAppMetadata?.();
    return (r ?? Promise.resolve({ name: '', version: '', description: '' })) as any;
  };

  loadGoogleConfig = () => {
    const r = window.electronAPI?.loadGoogleConfig?.();
    return (r ?? Promise.resolve(null)) as any;
  };

  saveGoogleConfig = (config: any) => {
    const r = window.electronAPI?.saveGoogleConfig?.(config);
    return (r ?? Promise.resolve({ success: false })) as any;
  };

  getGoogleEvents = () => {
    const r = window.electronAPI?.getGoogleEvents?.();
    return (r ?? Promise.resolve({ success: false })) as any;
  };

  syncWithGoogle = (payload: { localData: any; targetCalendarId: string }) => {
    const r = window.electronAPI?.syncWithGoogle?.(payload);
    return (r ?? Promise.resolve({ success: false })) as any;
  };

  onSyncProgress = (cb: (progress: any) => void) => window.electronAPI?.onSyncProgress?.(cb) ?? (() => {});
  onMenuAction = (cb: (action: string) => void) => window.electronAPI?.onMenuAction?.(cb) ?? (() => {});
  onGoogleAuthSuccess = (cb: () => void) => window.electronAPI?.onGoogleAuthSuccess?.(cb) ?? (() => {});
  onGoogleAuthError = (cb: (msg: string) => void) => window.electronAPI?.onGoogleAuthError?.(cb) ?? (() => {});
}

export default ElectronPersistenceAdapterImpl;
