/**
 * Utilitat de gestió de guardat global.
 * Permet registrar callbacks de guardat de components individuals (com els que usen useBufferedSave)
 * i forçar el seu buidatge (flush) abans d'un guardat global de l'aplicació.
 */

const saveListeners = new Set<() => void>();

/**
 * Registra un callback de guardat.
 * @param callback Funció a executar quan es demani un guardat global.
 * @returns Funció per desregistrar el callback.
 */
export function registerSaveListener(callback: () => void): () => void {
  saveListeners.add(callback);
  return () => {
    saveListeners.delete(callback);
  };
}

/**
 * Executa tots els callbacks de guardat registrats.
 * S'utilitza try/catch per assegurar que si un callback falla, la resta es continuïn executant.
 */
export function triggerAllSaves(): void {
  console.log(`[SaveManager] Executant ${saveListeners.size} callbacks de guardat...`);
  saveListeners.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error('[SaveManager] Error en executar un callback de guardat:', error);
    }
  });
}
