// Com que electron-log sobreescriu els mètodes de la consola al procés principal,
// podem utilitzar directament els mètodes de la consola al renderer i electron-log
// els capturarà automàticament a través del seu IPC.
// Això simplifica enormement el codi i elimina la necessitat de mantenir un logger personalitzat.

export const logger = {
  debug: (...args: any[]) => {
    if (window.electronLog) {
      window.electronLog.debug(...args);
    } else {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if (window.electronLog) {
      window.electronLog.info(...args);
    } else {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (window.electronLog) {
      window.electronLog.warn(...args);
    } else {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (window.electronLog) {
      window.electronLog.error(...args);
    } else {
      console.error(...args);
    }
  }
};
