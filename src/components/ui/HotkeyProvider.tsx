/**
 * =============================================================================
 * HOTKEY PROVIDER
 * =============================================================================
 * DESCRIPCIÓ:
 * Component proveïdor per envoltar l'aplicació i gestionar hotkeys globals.
 * En el futur pot contenir configuració centralitzada d'hotkeys.
 *
 * ÍNDEX:
 * - IMPORTS: Llibreries React
 * - COMPONENT PRINCIPAL: HotkeyProvider que envoltarà l'aplicació
 * =============================================================================
 */

import React from 'react';

interface HotkeyProviderProps {
  children: React.ReactNode;
}

export const HotkeyProvider: React.FC<HotkeyProviderProps> = ({ children }) => {
  // En el futur, aquí podem afegir configuració centralitzada d'hotkeys
  // Per ara, simplement envolta els fills
  
  return <>{children}</>;
};
