import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebouncedSaveOptions<T> {
  initialData: T;
  onSave: (data: T) => void;
  delay?: number;
}

export interface UseDebouncedSaveReturn<T> {
  data: T;
  updateField: (field: keyof T, value: any) => void;
  setData: (newData: T | ((prev: T) => T)) => void;
  saveNow: () => void;
  isDirty: boolean;
}

export function useDebouncedSave<T>({
  initialData,
  onSave,
  delay = 2000,
}: UseDebouncedSaveOptions<T>): UseDebouncedSaveReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const dataRef = useRef(data);
  const isDirtyRef = useRef(isDirty);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when state changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Sync with initialData when it changes
  useEffect(() => {
    setDataState(initialData);
    setIsDirty(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [initialData]);

  // Debounced save logic
  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (isDirtyRef.current) {
          onSave(dataRef.current);
          setIsDirty(false);
        }
      }, delay);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, delay, onSave]);

  // Cleanup on unmount or when initialData changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (isDirtyRef.current) {
        onSave(dataRef.current);
        setIsDirty(false);
      }
    };
  }, [onSave]);

  const updateField = useCallback((field: keyof T, value: any) => {
    // Guarda: si el nou valor és idèntic al valor actual, no actualitzis l'estat ni marquis isDirty
    const currentValue = dataRef.current[field];
    if (JSON.stringify(currentValue) === JSON.stringify(value)) {
      return;
    }
    
    setDataState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const setData = useCallback((newData: T | ((prev: T) => T)) => {
    // Si és una funció, executar-la
    const resolvedData = typeof newData === 'function' ? (newData as (prev: T) => T)(dataRef.current) : newData;
    
    // Comprovació de seguretat: si les dades noves són exactament iguals a les actuals, no fer res
    if (JSON.stringify(resolvedData) === JSON.stringify(dataRef.current)) {
      return;
    }
    
    setDataState(resolvedData);
    setIsDirty(true);
  }, []);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirtyRef.current) {
      onSave(dataRef.current);
      setIsDirty(false); // Assegura't que isDirty es posa a false immediatament
    }
  }, [onSave]);

  return {
    data,
    updateField,
    setData,
    saveNow,
    isDirty,
  };
}
