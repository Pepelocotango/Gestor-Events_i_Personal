// packages/core/src/desktop-specific/stores/eventDataStore.desktop.ts

import { useEventDataStore as useEventDataStoreBase, initializeEventDataStore as initializeEventDataStoreBase } from '../../platform-agnostic/stores/eventDataStore.base';
import { useModalStore } from '../../platform-agnostic/stores/modalStore';
import { logger } from '../../platform-agnostic/utils/logger';
import type { AppData, EventFrame, EventFrameForExport, Assignment } from '../../platform-agnostic/types';
import type { PersistenceAdapter } from '../../platform-agnostic/persistenceAdapter';
import { generateGoogleEventDescription } from '../utils/googleCalendarUtils';

// Re-exportem l'inicialitzador per mantenir la compatibilitat
export const initializeEventDataStore = (adapter: PersistenceAdapter) => {
initializeEventDataStoreBase(adapter);
};

// Aquesta serà la nostra exportació principal, que apunta a l'store base
export const useEventDataStore = useEventDataStoreBase;

// ====================================================================
// == EXTENSIÓ DE FUNCIONALITATS PER A L'ESCRIPTORI ==
// ====================================================================

// Obtenim l'estat inicial de l'store base per afegir-hi les noves funcions
const initialState = useEventDataStore.getState();

useEventDataStore.setState({
...initialState,

// ===== FUNCIONALITATS D'ESCRIPTORI (GOOGLE SYNC) =====

refreshGoogleEvents: async () => {
if (window.electronAPI?.getGoogleEvents) {
const result = await window.electronAPI.getGoogleEvents();
if (result.success && result.events) {
useEventDataStore.setState({ googleEvents: result.events });
return { success: true, message: 'Esdeveniments de Google actualitzats.', type: 'success' };
} else if (result.message) {
return { success: false, message: result.message, type: 'error' };
}
}
return { success: false, message: 'API no disponible.', type: 'error' };
},

syncWithGoogle: async () => {
const { openModal, closeModal } = useModalStore.getState();
const { executeSync } = useEventDataStore.getState();

if (window.electronAPI?.loadGoogleConfig) {
const config = await window.electronAPI.loadGoogleConfig();
if (!config || !config.managedAppCalendars || config.managedAppCalendars.length === 0) {
openModal('googleSettings');
return;
}
openModal('selectSyncCalendar', {
managedCalendars: config.managedAppCalendars,
activeCalendarId: config.activeAppCalendarId,
onConfirmSync: (targetCalendarId: string) => {
closeModal();
if (executeSync) {
executeSync(targetCalendarId);
}
}
});
} else {
logger.warn("L'API d'Electron per a Google Config no està disponible.");
}
},

executeSync: async (targetCalendarId: string) => {
const { exportData, loadData, refreshGoogleEvents } = useEventDataStore.getState();
let finalResult: any = { success: false, message: 'Sincronització no completada.', type: 'error' };

useEventDataStore.setState({ isSyncing: true, syncProgress: { current: 0, total: 0, message: 'Iniciant...', visible: true } });

if (window.electronAPI?.syncWithGoogle) {
const localData = await exportData();

const enrichedEventFrames = localData.eventFrames.map(frame => ({
...frame,
googleDescription: generateGoogleEventDescription(frame as EventFrame, useEventDataStore.getState().peopleGroups),
}));

const enrichedLocalData = { ...localData, eventFrames: enrichedEventFrames };

const result = await window.electronAPI.syncWithGoogle({ localData: enrichedLocalData, targetCalendarId });

if (result && result.success && result.data) {
await loadData(result.data);
if (refreshGoogleEvents) await refreshGoogleEvents();
finalResult = { success: true, message: result.message || 'Sincronització completada.', type: 'success' };
} else {
if (refreshGoogleEvents) await refreshGoogleEvents();
finalResult = { success: false, message: (result && result.message) || 'Error durant la sincronització.', type: 'error', code: result?.code };
}
}

useEventDataStore.setState({ isSyncing: false, syncProgress: { ...useEventDataStore.getState().syncProgress, visible: false } });
return finalResult;
},

// ===== SOBREESCRIPTURA DE FUNCIONS PER A ESCRIPTORI =====

exportData: async () => {
const { eventFrames, peopleGroups, materialItems } = useEventDataStore.getState();
const allAssignmentsList: Assignment[] = eventFrames.flatMap((ef: EventFrame) => ef.assignments);
const eventFramesForExport: EventFrameForExport[] = eventFrames.map(({ assignments, ...restOfFrame }: EventFrame) => restOfFrame);
let googleConfigForExport: AppData['googleConfig'] = undefined;
if (window.electronAPI?.loadGoogleConfig) {
const fullConfig = await window.electronAPI.loadGoogleConfig();
if (fullConfig) {
googleConfigForExport = { userEmail: fullConfig.userEmail, activeAppCalendarId: fullConfig.activeAppCalendarId, managedAppCalendars: fullConfig.managedAppCalendars };
}
}
const dataToExport = { peopleGroups, eventFrames: eventFramesForExport, materialItems, assignments: allAssignmentsList, googleConfig: googleConfigForExport };
return JSON.parse(JSON.stringify(dataToExport));
},
});

// Re-exportem els selectors de la base per a conveniència
export * from '../../platform-agnostic/stores/eventDataStore.base';
