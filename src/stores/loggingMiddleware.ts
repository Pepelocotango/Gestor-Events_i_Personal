import { StateCreator } from 'zustand';
import logger from '../utils/logger';

// Helper function to summarize large arrays in log data
const summarizeLogData = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length > 5) {
      return `[Array of length ${data.length}]`;
    }
    return data.map(summarizeLogData);
  }

  const newObj: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (Array.isArray(value) && value.length > 5) {
        newObj[key] = `[Array of length ${value.length}]`;
      } else {
        newObj[key] = summarizeLogData(value);
      }
    }
  }
  return newObj;
};


export const loggingMiddleware = <T extends object>(
  f: StateCreator<T>,
  name: string
): StateCreator<T> => (set, get, api) => {
  return f(
    (args) => {
      const oldState = get();

      // Log summarized data instead of the full objects
      logger.info(`[ZUSTAND] ${name} - Acció`, summarizeLogData({
        args,
        // Only show keys of previous state to avoid logging large arrays
        prevStateKeys: Object.keys(oldState),
      }));

      set(args);

      const newState = get();
      try {
        const newStateKeys = Object.keys(newState);
        const summary: { [key: string]: any } = {};
        newStateKeys.forEach(key => {
            const value = (newState as any)[key];
            if(Array.isArray(value)) {
                summary[key] = `[Array of length ${value.length}]`;
            } else {
                summary[key] = value;
            }
        });
        logger.info(`[ZUSTAND] ${name} - Estat actualitzat`, { newStateSummary: summary });

      } catch (e) {
          logger.warn(`[ZUSTAND] ${name} - No s'ha pogut serialitzar el nou estat per comprovar la mida.`);
      }
    },
    get,
    api
  );
};
