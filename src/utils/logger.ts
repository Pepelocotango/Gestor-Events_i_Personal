const logger = {
  info: (message: string, data?: any) => {
    console.log(message, data);
    if (window.electronAPI && typeof window.electronAPI.log === 'function') {
      window.electronAPI.log(message, data);
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data);
    if (window.electronAPI && typeof window.electronAPI.log === 'function') {
      window.electronAPI.log(`[WARN] ${message}`, data);
    }
  },
  error: (message: string, data?: any) => {
    console.error(message, data);
    if (window.electronAPI && typeof window.electronAPI.log === 'function') {
      window.electronAPI.log(`[ERROR] ${message}`, data);
    }
  },
};

export default logger;
