const logger = {
  info: (message: string, data?: any) => {
    console.log(message, data);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(data, (_key, value) => 
          typeof value === 'function' ? undefined : value
        ));
        window.electronAPI.log(message, clonableData);
      } catch (e) {
        window.electronAPI.log(message, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(message, data);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(data, (_key, value) =>
          typeof value === 'function' ? undefined : value
        ));
        window.electronAPI.log(`[WARN] ${message}`, clonableData);
      } catch (e) {
        window.electronAPI.log(`[WARN] ${message}`, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },
  error: (message: string, data?: any) => {
    console.error(message, data);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(data, (_key, value) =>
          typeof value === 'function' ? undefined : value
        ));
        window.electronAPI.log(`[ERROR] ${message}`, clonableData);
      } catch (e) {
        window.electronAPI.log(`[ERROR] ${message}`, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  }
};
export default logger;
