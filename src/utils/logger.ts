const logger = {
  debug: (...args: any[]) => {
    console.debug(...args);
    window.electronAPI?.logToMain?.('debug', ...args);
  },
  info: (...args: any[]) => {
    console.log(...args);
    window.electronAPI?.logToMain?.('info', ...args);
  },
  warn: (...args: any[]) => {
    console.warn(...args);
    window.electronAPI?.logToMain?.('warn', ...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
    window.electronAPI?.logToMain?.('error', ...args);
  }
};

export default logger;
