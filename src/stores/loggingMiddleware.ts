/**
 * =============================================================================
 * LOGGING MIDDLEWARE
 * =============================================================================
 * DESCRIPCIÓ:
 * Middleware de Zustand per a registrar accions i canvis d'estat al logger.
 *
 * ÍNDEX:
 * - MIDDLEWARE DE LOGGING: loggingMiddleware per registrar accions de Zustand.
 * =============================================================================
 */

import { StateCreator } from 'zustand';
import logger from '../utils/logger';

export const loggingMiddleware = <T extends object>(
  f: StateCreator<T>,
  name: string
): StateCreator<T> => (set, get, api) => {
  return f(
    (args) => {
      const oldState = get();

      logger.info(`[ZUSTAND] ${name} - Acció`, {
        args,
        prevState: oldState,
      });

      set(args);

      const newState = get();
      try {
        const newStateSize = JSON.stringify(newState).length;
        // Si l'estat és molt gran (ex: > 50KB), no el registris sencer
        if (newStateSize > 50000) {
          logger.info(`[ZUSTAND] ${name} - Estat actualitzat (mida > 50KB, omès)`);
        } else {
          logger.info(`[ZUSTAND] ${name} - Estat actualitzat`, { newState });
        }
      } catch (e) {
          logger.warn(`[ZUSTAND] ${name} - No s'ha pogut serialitzar el nou estat per comprovar la mida.`);
      }
    },
    get,
    api
  );
};
