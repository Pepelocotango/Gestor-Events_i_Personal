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
  const [data, setData] = useState<T>(initialData);
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
    setData(initialData);
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
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirtyRef.current) {
      onSave(dataRef.current);
      setIsDirty(false);
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
