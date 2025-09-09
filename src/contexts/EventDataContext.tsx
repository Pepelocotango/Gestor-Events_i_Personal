import React from 'react';
import { useEventDataStore } from '../stores/eventDataStore';

// Capa de compatibilitat per a components que encara importen l'antic
// `useEventData` des de `src/contexts/EventDataContext`.
// Retorna la mateixa API (aproximada) que tenien els components originals,
// però delega en el store de Zustand.

export const EventDataProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // L'antic provider ja no és necessari, però mantenim el component
  // per compatibilitat amb imports que esperen un provider.
  return <>{children}</>;
};

export const useEventData = () => {
  const store = useEventDataStore;

  // Selectors reactius per a les dades que normalment canvien amb freqüència
  const eventFrames = store(state => state.eventFrames);
  const peopleGroups = store(state => state.peopleGroups);
  const materialItems = store(state => state.materialItems);
  const googleEvents = store(state => state.googleEvents);
  const hasUnsavedChanges = store(state => state.hasUnsavedChanges);
  const isSyncing = store(state => state.isSyncing);
  const syncProgress = store(state => state.syncProgress);

  // Accions i helpers (no reactius) s'obtenen directament del getState per evitar
  // re-suscripcions innecessàries quan es passen com callbacks.
  const {
    addEventFrame,
    updateEventFrame,
    deleteEventFrame,
    addPersonGroup,
    updatePersonGroup,
    deletePersonGroup,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addMaterialItem,
    updateMaterialItem,
    deleteMaterialItem,
    loadData,
    exportData,
    refreshGoogleEvents,
    executeSync,
    getPersonGroupById,
    getEventFrameById,
    getAssignmentById,
    getMaterialAvailability,
    addOrUpdateTechSheet,
  } = store.getState();

  return {
    // dades reactives
    eventFrames,
    peopleGroups,
    materialItems,
    googleEvents,
    hasUnsavedChanges,
    isSyncing,
    syncProgress,

    // accions
    addEventFrame,
    updateEventFrame,
    deleteEventFrame,
    addPersonGroup,
    updatePersonGroup,
    deletePersonGroup,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addMaterialItem,
    updateMaterialItem,
    deleteMaterialItem,
    loadData,
    exportData,
    refreshGoogleEvents,
    executeSync,
    getPersonGroupById,
    getEventFrameById,
    getAssignmentById,
    getMaterialAvailability,
    addOrUpdateTechSheet,

    // Exposeixo getState per si algun component necessita accedir a l'store sencer
    _getStoreState: store.getState,
  } as any;
};

export default useEventData;
