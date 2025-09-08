import { StateCreator } from 'zustand';
import logger from '../utils/logger';

export const loggingMiddleware = <T>(
  f: StateCreator<T>,
  name: string
): StateCreator<T> => (set, get, api) => {
  return f(
    (args) => {
      logger.info(`[ZUSTAND] ${name} - Acció...`);
      const oldState = get();
      set(args);
      const newState = get();
      logger.info(`[ZUSTAND] ${name} - Estat actualitzat`, { oldState, newState });
    },
    get,
    api
  );
};
