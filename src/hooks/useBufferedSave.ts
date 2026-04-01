import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { registerSaveListener } from '../utils/saveManager';

interface UseBufferedSaveReturn<T> {
  localData: T;
  localDataRef: MutableRefObject<T>;
  updateLocal: (updates: Partial<T>) => void;
  updateFullObject: (newData: T) => void;
  saveNow: () => void;
  isDirty: boolean;
}

/**
 * Hook per gestionar el desat en memòria intermèdia (buffer) de dades d'un formulari.
 * Evita actualitzacions freqüents a l'estat global, desant només en sortir (unmount/canvi d'ítem)
 * o quan es demana explícitament.
 *
 * @param initialData Les dades inicials provinents de l'estat global.
 * @param saveToGlobal La funció per persistir les dades a l'estat global. Rep un segon paràmetre 'isManual'.
 */
export function useBufferedSave<T extends object>(
  initialData: T,
  saveToGlobal: (data: T, isManual: boolean) => void
): UseBufferedSaveReturn<T> {
  const [localData, setLocalData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);

  // Utilitzem refs per tenir accés a les dades més recents dins de la funció de neteja del useEffect
  const isDirtyRef = useRef(false);
  const localDataRef = useRef<T>(initialData);
  const saveToGlobalRef = useRef(saveToGlobal);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mantenim la ref de la funció de desat actualitzada
  useEffect(() => {
    saveToGlobalRef.current = saveToGlobal;
  }, [saveToGlobal]);

  // Auto-save amb timeout (2 segons després de l'últim canvi)
  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        console.log('[BufferedSave] Auto-save amb timeout');
        saveToGlobalRef.current(localDataRef.current, false);
        isDirtyRef.current = false;
        setIsDirty(false);
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [localData, isDirty]);

  // Sincronització amb dades inicials i lògica de neteja (cleanup)
  useEffect(() => {
    // Primer comprovem si hi ha canvis pendents abans de sobreescriure
    if (isDirtyRef.current) {
      console.log('[BufferedSave] Desant canvis pendents abans de canviar de dades inicials');
      saveToGlobalRef.current(localDataRef.current, false);
    }

    // Ara sí, actualitzem amb les noves dades inicials
    setLocalData(initialData);
    localDataRef.current = initialData;
    isDirtyRef.current = false;
    setIsDirty(false);

    return () => {
      // Aquesta funció s'executa quan el component es desmunta O quan initialData canvia
      if (isDirtyRef.current) {
        console.log('[BufferedSave] Desant canvis pendents en cleanup');
        saveToGlobalRef.current(localDataRef.current, false);
      }
    };
  }, [initialData]);

  // FORÇAR SAVE QUAN CANVIA DE PERFORMANCE (cas especial per Riders)
  useEffect(() => {
    // Aquest useEffect només s'executa quan canvia initialData
    // Si hi ha canvis pendents, ja s'han desat al useEffect anterior
    // Però si no n'hi ha, no fem res
    return () => {
      // Cleanup addicional per assegurar que no es perden dades
      if (isDirtyRef.current) {
        console.log('[BufferedSave] Cleanup addicional - desant canvis pendents');
        saveToGlobalRef.current(localDataRef.current, false);
        isDirtyRef.current = false;
        setIsDirty(false);
      }
    };
  }, [initialData]);

  // Funció per actualitzar l'estat local (merge parcial)
  const updateLocal = useCallback((updates: Partial<T>) => {
    setLocalData((prev) => {
      const next = { ...prev, ...updates };
      localDataRef.current = next;
      return next;
    });

    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setIsDirty(true);
      useEventDataStore.getState().setHasUnsavedChanges(true);
    }
  }, []);

  // Funció per actualitzar l'estat local (reemplaçament complet)
  const updateFullObject = useCallback((newData: T) => {
    setLocalData(newData);
    localDataRef.current = newData;

    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      setIsDirty(true);
      useEventDataStore.getState().setHasUnsavedChanges(true);
    }
  }, []);

  // Funció per forçar el desat immediat
  const saveNow = useCallback(() => {
    console.log('[BufferedSave] saveNow cridat, isDirtyRef.current:', isDirtyRef.current);
    if (isDirtyRef.current) {
      console.log('[BufferedSave] Desant dades:', localDataRef.current);
      saveToGlobalRef.current(localDataRef.current, true);
      isDirtyRef.current = false;
      setIsDirty(false);
      console.log('[BufferedSave] Dades desades correctament');
    } else {
      console.log('[BufferedSave] No hi ha canvis pendents per desar');
    }
  }, []);

  // Registrem el listener de guardat global per forçar el flush quan calgui (ex: Ctrl+S)
  useEffect(() => {
    const unregister = registerSaveListener(saveNow);
    return unregister;
  }, [saveNow]);

  // Auto-save en events de finestra per evitar pèrdua de dades
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        console.log('[Window] Pàgina amagada - desant automàticament');
        saveToGlobalRef.current(localDataRef.current, false);
        isDirtyRef.current = false;
        setIsDirty(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        console.log('[Window] Abans de descarregar - hi ha canvis pendents');
        e.preventDefault();
        e.returnValue = 'Tens canvis sense desar. Vols continuar?';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirtyRef, saveToGlobalRef, setIsDirty]);

  return {
    localData,
    localDataRef,
    updateLocal,
    updateFullObject,
    saveNow,
    isDirty,
  };
}
