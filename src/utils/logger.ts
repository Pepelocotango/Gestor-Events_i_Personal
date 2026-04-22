/**
 * =============================================================================
 * LOGGER
 * =============================================================================
 * DESCRIPCIÓ:
 * Servei de logging unificat per a consola i Electron main process.
 *
 * ÍNDEX:
 * - MÈTODES DE LOGGING: debug, info, warn, error amb sortida doble.
 * =============================================================================
 */

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
