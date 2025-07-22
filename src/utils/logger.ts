const logger = {
  info: (message: string, data?: any) => {
    // 1. Log a la consola del frontend (amb l'objecte complet)
    console.log(message, data);

    // 2. Envia una versió segura i clonable al backend
    if (window.electronAPI?.log) {
      try {
        // La millor manera de fer-lo clonable és serialitzar-lo i deserialitzar-lo,
        // eliminant les funcions en el procés.
        const clonableData = JSON.parse(JSON.stringify(data, (_key, value) => 
          typeof value === 'function' ? '[Function]' : value
        ));
        window.electronAPI.log(message, clonableData);
      } catch (e) {
        // Si falla, envia un missatge d'error per no perdre el log
        window.electronAPI.log(message, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },

  warn: (message: string, data?: any) => {
    console.warn(message, data);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(data, (_key, value) => 
          typeof value === 'function' ? '[Function]' : value
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
          typeof value === 'function' ? '[Function]' : value
        ));
        window.electronAPI.log(`[ERROR] ${message}`, clonableData);
      } catch (e) {
        window.electronAPI.log(`[ERROR] ${message}`, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },
};

export default logger;
