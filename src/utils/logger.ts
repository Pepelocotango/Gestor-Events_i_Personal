const summarizeDataForLog = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Avoid cloning huge objects for logging
  if (JSON.stringify(data).length < 2000) {
    return data;
  }

  const summary: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (Array.isArray(value)) {
        summary[key] = `[Array of length ${value.length}]`;
      } else if (typeof value === 'object' && value !== null) {
        summary[key] = '[Object]';
      } else {
        summary[key] = value;
      }
    }
  }
  return summary;
}

const logger = {
  info: (message: string, data?: any) => {
    const summarizedData = summarizeDataForLog(data);
    console.log(message, summarizedData);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(summarizedData, (_key, value) =>
          typeof value === 'function' ? undefined : value
        ));
        window.electronAPI.log(message, clonableData);
      } catch (e) {
        window.electronAPI.log(message, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },
  warn: (message: string, data?: any) => {
    const summarizedData = summarizeDataForLog(data);
    console.warn(message, summarizedData);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(summarizedData, (_key, value) =>
          typeof value === 'function' ? undefined : value
        ));
        window.electronAPI.log(`[WARN] ${message}`, clonableData);
      } catch (e) {
        window.electronAPI.log(`[WARN] ${message}`, { ipcLogCloningError: "L'objecte de dades no s'ha pogut clonar." });
      }
    }
  },
  error: (message: string, data?: any) => {
    const summarizedData = summarizeDataForLog(data);
    console.error(message, summarizedData);
    if (window.electronAPI?.log) {
      try {
        const clonableData = JSON.parse(JSON.stringify(summarizedData, (_key, value) =>
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
