/**
 * =============================================================================
 * USE HOTKEY
 * =============================================================================
 * DESCRIPCIÓ:
 * Hook simple per gestionar hotkeys globals basats en el focus.
 *
 * ÍNDEX:
 * - IMPORTS: Llibreries React
 * - HOOK PRINCIPAL: useHotkey amb lògica de focus i hotkey
 * =============================================================================
 */

import { useEffect } from 'react';

interface UseHotkeyOptions {
  /**
   * Tecla principal de la hotkey (default: 'Enter')
   */
  key?: string;
  
  /**
   * Requereix Ctrl/Cmd (default: true)
   */
  requireCtrl?: boolean;
  
  /**
   * Selector CSS per determinar on el focus activa la hotkey
   * Si no es proporciona, la hotkey estarà activa globalment
   */
  selector?: string;
}

export const useHotkey = (
  callback: () => void,
  options: UseHotkeyOptions = {}
) => {
  const {
    key = 'Enter',
    requireCtrl = true,
    selector,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Comprova si els modificadors coincideixen
      const ctrlMatch = requireCtrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;

      if (ctrlMatch && e.key === key) {
        // Si hi ha selector, comprova si el focus està dins del selector
        if (selector) {
          const activeElement = document.activeElement as Element;
          if (!activeElement || !activeElement.closest(selector)) {
            return;
          }
        }

        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback, key, requireCtrl, selector]);
};
