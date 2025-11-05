import { useEventDataStore } from './eventDataStore';
import { useModalStore } from './modalStore';
import { logger } from '../utils/logger';
import { generateGoogleEventDescription } from '../utils/googleCalendarUtils';
// Aquesta variable s'inicialitza des de l'App d'escriptori
let persistenceAdapter = null;
export const initializeDesktopActions = (adapter) => {
    persistenceAdapter = adapter;
};
export const refreshGoogleEvents = async () => {
    if (persistenceAdapter?.getGoogleEvents) {
        const result = await persistenceAdapter.getGoogleEvents();
        if (result.success && result.events) {
            useEventDataStore.setState({ googleEvents: result.events });
            return { success: true };
        }
        else if (result.message) {
            return { success: false, message: result.message, type: 'error' };
        }
    }
    return { success: false, message: 'Adapter de persistència no disponible.', type: 'error' };
};
export const executeSync = async (targetCalendarId) => {
    const { exportData, loadData } = useEventDataStore.getState();
    let finalResult = { success: false, message: 'La sincronització no es va completar.', type: 'error' };
    useEventDataStore.setState({ isSyncing: true, syncProgress: { current: 0, total: 0, message: 'Iniciant...', visible: true } });
    if (persistenceAdapter?.syncWithGoogle) {
        const localData = await exportData();
        const { peopleGroups } = useEventDataStore.getState();
        const enrichedEventFrames = localData.eventFrames.map(frame => ({
            ...frame,
            googleDescription: generateGoogleEventDescription(frame, peopleGroups),
        }));
        const enrichedLocalData = { ...localData, eventFrames: enrichedEventFrames };
        const result = await persistenceAdapter.syncWithGoogle({ localData: enrichedLocalData, targetCalendarId });
        if (result && result.success && result.data) {
            await loadData(result.data);
            await refreshGoogleEvents();
            finalResult = { success: true, message: result.message || 'Sincronització completada.', type: 'success' };
        }
        else {
            await refreshGoogleEvents();
            finalResult = { success: false, message: (result && result.message) || 'Error desconegut durant la sincronització.', type: 'error', code: result?.code };
        }
    }
    useEventDataStore.setState({ isSyncing: false, syncProgress: { ...useEventDataStore.getState().syncProgress, visible: false } });
    return finalResult;
};
export const syncWithGoogle = async () => {
    const { openModal, closeModal } = useModalStore.getState();
    if (persistenceAdapter?.loadGoogleConfig) {
        const config = await persistenceAdapter.loadGoogleConfig();
        if (!config || !config.managedAppCalendars || config.managedAppCalendars.length === 0) {
            openModal('googleSettings');
            return;
        }
        openModal('selectSyncCalendar', {
            managedCalendars: config.managedAppCalendars,
            activeCalendarId: config.activeAppCalendarId,
            onConfirmSync: (targetCalendarId) => {
                closeModal();
                executeSync(targetCalendarId);
            }
        });
    }
    else {
        logger.warn("L'API d'Electron per a Google Config no està disponible.");
    }
};
//# sourceMappingURL=desktopActions.js.map