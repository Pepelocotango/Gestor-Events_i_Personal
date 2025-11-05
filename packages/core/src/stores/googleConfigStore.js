import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { logger } from '../utils/logger';
import { useModalStore } from './modalStore';
import { refreshGoogleEvents } from './desktopActions';
const initialState = {
    externalCalendars: [],
    selectedIds: [],
    managedCalendars: [],
    activeCalendarId: null,
    loading: true,
    error: null,
    isSyncing: false,
};
// --- ZUSTAND STORE CREATION ---
export const useGoogleConfigStore = create()(immer((set) => ({
    ...initialState,
    // Accions síncrones simples que modifiquen l'estat directament
    toggleExternalCalendar: (calendarId) => {
        set(state => {
            const newSet = new Set(state.selectedIds);
            if (newSet.has(calendarId)) {
                newSet.delete(calendarId);
            }
            else {
                newSet.add(calendarId);
            }
            state.selectedIds = Array.from(newSet);
        });
    },
    setActiveCalendarId: (calendarId) => {
        set({ activeCalendarId: calendarId });
    },
    resetGoogleConfig: () => {
        set(initialState);
        logger.info("Estat de la configuració de Google restablert.");
    },
})));
// --- STANDALONE ASYNCHRONOUS/COMPLEX ACTIONS ---
/**
 * Sets up listeners for Google authentication events from the main process.
 */
export const initializeGoogleAuthListeners = () => {
    if (window.electronAPI?.onGoogleAuthSuccess) {
        window.electronAPI.onGoogleAuthSuccess(() => {
            logger.info("Rebut 'google-auth-success' a la store. Refrescant configuració.");
            fetchAndLoadConfig();
        });
    }
    if (window.electronAPI?.onGoogleAuthError) {
        window.electronAPI.onGoogleAuthError((errorMessage) => {
            logger.error("Rebut 'google-auth-error' a la store.", { errorMessage });
        });
    }
};
/**
 * Initiates the Google authentication flow via the main process.
 */
export const startGoogleAuthFlow = async () => {
    logger.info('[UI] Iniciant flux d\'autenticació amb Google.');
    if (window.electronAPI?.startGoogleAuth) {
        return await window.electronAPI.startGoogleAuth();
    }
    else {
        return { success: false, message: 'Aquesta funcionalitat només està disponible a l\'aplicació d\'escriptori.', type: 'warning' };
    }
};
/**
 * Fetches the complete Google Calendar configuration and list of calendars.
 */
export const fetchAndLoadConfig = async () => {
    if (!window.electronAPI?.loadGoogleConfig || !window.electronAPI?.getCalendarList) {
        useGoogleConfigStore.setState({ loading: false, error: "API d'Electron no disponible." });
        return;
    }
    useGoogleConfigStore.setState({ loading: true, error: null });
    try {
        const [configResult, calendarsResult] = await Promise.all([
            window.electronAPI.loadGoogleConfig(),
            window.electronAPI.getCalendarList()
        ]);
        const newConfigState = {
            selectedIds: configResult?.selectedCalendarIds || [],
            managedCalendars: configResult?.managedAppCalendars || [],
            activeCalendarId: configResult?.activeAppCalendarId || null,
        };
        const managedIdsSet = new Set(newConfigState.managedCalendars.map(c => c.id));
        useGoogleConfigStore.setState({
            ...newConfigState,
            externalCalendars: calendarsResult.success ? (calendarsResult.calendars?.filter(c => !managedIdsSet.has(c.id)) || []) : [],
            error: calendarsResult.success ? null : (calendarsResult.message || 'Error desconegut obtenint calendaris.'),
        });
    }
    catch (err) {
        const errorMessage = err.message;
        logger.error("Error a fetchAndLoadConfig:", { errorMessage });
        useGoogleConfigStore.setState({ error: errorMessage });
    }
    finally {
        useGoogleConfigStore.setState({ loading: false });
    }
};
/**
 * Saves the current configuration of selected and active calendars.
 */
export const saveConfig = async () => {
    const { selectedIds, activeCalendarId } = useGoogleConfigStore.getState();
    if (window.electronAPI?.saveGoogleConfig) {
        const configToSave = {
            selectedCalendarIds: selectedIds,
            activeAppCalendarId: activeCalendarId,
        };
        const result = await window.electronAPI.saveGoogleConfig(configToSave);
        if (result.success) {
            setTimeout(() => {
                refreshGoogleEvents();
            }, 0);
            return { success: true, message: 'Configuració desada.', type: 'success' };
        }
        else {
            return { success: false, message: result.message || "No s'ha pogut desar la configuració.", type: 'error' };
        }
    }
    return { success: false, message: "API d'Electron no disponible.", type: 'error' };
};
/**
 * Creates a new Google Calendar managed by the application.
 */
export const createNewCalendar = async (suffix) => {
    if (window.electronAPI?.createNewAppCalendar) {
        const result = await window.electronAPI.createNewAppCalendar(suffix);
        if (result.success && result.data) {
            useGoogleConfigStore.setState({
                managedCalendars: result.data.managedAppCalendars,
                activeCalendarId: result.data.activeAppCalendarId,
            });
            setTimeout(() => {
                fetchAndLoadConfig();
            }, 0);
            return { success: true, message: result.message || 'Calendari creat correctament.', type: 'success' };
        }
        else {
            return { success: false, message: result.message || 'Error creant el calendari.', type: 'error' };
        }
    }
    return { success: false, message: 'API d\'Electron no disponible.', type: 'error' };
};
/**
 * Deletes a managed Google Calendar permanently.
 */
export const deleteCalendar = (calendar, onConfirm) => {
    const { openModal } = useModalStore.getState();
    openModal('confirmHardReset', {
        titleOverride: "Confirmar Eliminació de Calendari",
        itemName: `Estàs segur que vols eliminar permanentment el calendari "${calendar.name}" del teu compte de Google i de l'aplicació? Aquesta acció no es pot desfer.`,
        confirmButtonText: "Sí, Eliminar Calendari",
        onConfirmSpecial: async () => {
            if (window.electronAPI?.deleteAppCalendar) {
                try {
                    const result = await window.electronAPI.deleteAppCalendar(calendar.id);
                    if (result.success && result.data) {
                        useGoogleConfigStore.setState({
                            managedCalendars: result.data.managedAppCalendars,
                            activeCalendarId: result.data.activeAppCalendarId,
                        });
                        setTimeout(() => {
                            fetchAndLoadConfig();
                            refreshGoogleEvents();
                        }, 0);
                    }
                    onConfirm({
                        success: result.success,
                        message: result.message ?? '',
                        type: result.success ? 'success' : 'error',
                    });
                }
                catch (err) {
                    const errorResult = { success: false, message: err.message, type: 'error' };
                    onConfirm(errorResult);
                }
            }
        },
    });
};
/**
 * Disconnects the Google account, deleting all managed calendars and revoking access.
 */
export const disconnectGoogle = (onConfirm) => {
    const { openModal, closeModal } = useModalStore.getState();
    openModal('confirmHardReset', {
        titleOverride: "Confirmar Desconnexió de Google",
        itemName: "Estàs segur que vols desconnectar el teu compte de Google? Aquesta acció és irreversible i farà el següent:<br><br>" +
            "<ul class='list-disc list-inside text-left'>" +
            "<li><b>Eliminarà TOTS</b> els calendaris gestionats per l'aplicació del teu compte de Google.</li>" +
            "<li><b>Revocarà</b> l'accés de l'aplicació al teu compte.</li>" +
            "<li><b>Esborrarà</b> tota la configuració local de Google.</li>" +
            "</ul>",
        confirmButtonText: "Sí, Desconnectar",
        onConfirmSpecial: async () => {
            if (window.electronAPI?.googleDisconnect) {
                try {
                    const result = await window.electronAPI.googleDisconnect();
                    if (result.success) {
                        setTimeout(() => {
                            refreshGoogleEvents();
                            fetchAndLoadConfig();
                        }, 0);
                        closeModal();
                    }
                    onConfirm({
                        success: result.success,
                        message: result.message ?? '',
                        type: result.success ? 'success' : 'error'
                    });
                }
                catch (err) {
                    const errorResult = { success: false, message: err.message, type: 'error' };
                    onConfirm(errorResult);
                }
            }
        },
    });
};
//# sourceMappingURL=googleConfigStore.js.map