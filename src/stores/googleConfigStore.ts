import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GoogleCalendar, ManagedAppCalendar, GoogleConfig } from '../types';
import { useEventDataStore } from './eventDataStore';
import { useModalStore } from './modalStore';
import logger from '../utils/logger';

interface GoogleConfigState {
  externalCalendars: GoogleCalendar[];
  selectedIds: string[];
  managedCalendars: ManagedAppCalendar[];
  activeCalendarId: string | null;
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
}

interface ActionResult {
    success: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface GoogleConfigActions {
  startGoogleAuthFlow: () => Promise<void>; // <<< NOU
  fetchAndLoadConfig: () => Promise<void>;
  toggleExternalCalendar: (calendarId: string) => void;
  setActiveCalendarId: (calendarId: string | null) => void;
  saveConfig: () => Promise<ActionResult>;
  createNewCalendar: (suffix: string) => Promise<ActionResult | undefined>;
  deleteCalendar: (calendar: ManagedAppCalendar) => void;
  disconnectGoogle: () => void;
  initialize: () => void; // <<< NOU
}

const initialState: GoogleConfigState = {
  externalCalendars: [],
  selectedIds: [],
  managedCalendars: [],
  activeCalendarId: null,
  loading: true,
  error: null,
  isSyncing: false,
};

export const useGoogleConfigStore = create<GoogleConfigState & GoogleConfigActions>()(
  immer((set, get) => ({
    ...initialState,

    initialize: () => {
      if (window.electronAPI?.onGoogleAuthSuccess) {
        window.electronAPI.onGoogleAuthSuccess(() => {
          logger.info("Rebut 'google-auth-success' a la store. Refrescant configuració.");
          get().fetchAndLoadConfig();
          useModalStore.getState().showToast('Connectat a Google Calendar amb èxit!', 'success');
        });
      }
      if (window.electronAPI?.onGoogleAuthError) {
        window.electronAPI.onGoogleAuthError((errorMessage) => {
            logger.error("Rebut 'google-auth-error' a la store.", { errorMessage });
            useModalStore.getState().showToast(`Error d'autenticació: ${errorMessage}`, 'error');
        });
      }
    },

    startGoogleAuthFlow: async () => {
      logger.info('[UI] Iniciant flux d\'autenticació amb Google des de la store.');
      if (window.electronAPI) {
        const result = await window.electronAPI.startGoogleAuth();
        if (result.success) {
          useModalStore.getState().showToast('Obrint el navegador per autenticar-se amb Google...', 'info');
        } else {
          useModalStore.getState().showToast(result.message || "No s'ha pogut iniciar l'autenticació.", 'error');
        }
      } else {
        useModalStore.getState().showToast('Aquesta funcionalitat només està disponible a l\'aplicació d\'escriptori.', 'warning');
      }
    },

    fetchAndLoadConfig: async () => {
      if (!window.electronAPI?.loadGoogleConfig || !window.electronAPI?.getCalendarList) {
        set({ loading: false, error: "API d'Electron no disponible." });
        return;
      }
      set({ loading: true, error: null });
      try {
        const [configResult, calendarsResult] = await Promise.all([
          window.electronAPI.loadGoogleConfig() as Promise<GoogleConfig | null>,
          window.electronAPI.getCalendarList()
        ]);

        let managedIdsSet = new Set<string>();
        if (configResult) {
          managedIdsSet = new Set(configResult.managedAppCalendars?.map(c => c.id) || []);
          set({
            selectedIds: configResult.selectedCalendarIds || [],
            managedCalendars: configResult.managedAppCalendars || [],
            activeCalendarId: configResult.activeAppCalendarId || null,
          });
        }

        if (calendarsResult.success) {
          set({
            externalCalendars: calendarsResult.calendars?.filter(c => !managedIdsSet.has(c.id)) || [],
          });
        } else {
          set({ error: calendarsResult.message || 'Error desconegut obtenint calendaris.' });
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        logger.error("Error a fetchAndLoadConfig:", { errorMessage });
        set({ error: errorMessage });
      } finally {
        set({ loading: false });
      }
    },

    toggleExternalCalendar: (calendarId: string) => {
      set(state => {
        const newSet = new Set(state.selectedIds);
        if (newSet.has(calendarId)) {
          newSet.delete(calendarId);
        } else {
          newSet.add(calendarId);
        }
        state.selectedIds = Array.from(newSet);
      });
    },

    setActiveCalendarId: (calendarId: string | null) => {
      set({ activeCalendarId: calendarId });
    },

    saveConfig: async () => {
        const { selectedIds, activeCalendarId } = get();
        if (window.electronAPI?.saveGoogleConfig) {
            const configToSave: Partial<GoogleConfig> = {
                selectedCalendarIds: selectedIds,
                activeAppCalendarId: activeCalendarId,
            };
            const result = await window.electronAPI.saveGoogleConfig(configToSave);
            if (result.success) {
                await useEventDataStore.getState().refreshGoogleEvents();
                return { success: true, message: 'Configuració desada.', 'type': 'success' };
            } else {
                return { success: false, message: result.message || "No s'ha pogut desar la configuració.", type: 'error' };
            }
        }
        return { success: false, message: "API d'Electron no disponible.", type: 'error' };
    },

    createNewCalendar: async (suffix: string) => {
        if (window.electronAPI?.createNewAppCalendar) {
            const result = await window.electronAPI.createNewAppCalendar(suffix);
            if (result.success && result.data) {
                set({
                    managedCalendars: result.data.managedAppCalendars,
                    activeCalendarId: result.data.activeAppCalendarId,
                });
                await get().fetchAndLoadConfig();
                return { success: true, message: result.message || 'Calendari creat correctament.', type: 'success' };
            } else {
                return { success: false, message: result.message || 'Error creant el calendari.', type: 'error' };
            }
        }
    },

    deleteCalendar: (calendar: ManagedAppCalendar) => {
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
                useModalStore.getState().showToast(result.message || 'Calendari eliminat correctament.', 'success');
                set({
                    managedCalendars: result.data.managedAppCalendars,
                    activeCalendarId: result.data.activeAppCalendarId,
                });
                await get().fetchAndLoadConfig();
                await useEventDataStore.getState().refreshGoogleEvents();
              } else {
                useModalStore.getState().showToast(result.message || "Hi ha hagut un error durant l'eliminació.", 'error');
              }
            } catch (err) {
                useModalStore.getState().showToast((err as Error).message, 'error');
            }
          }
        },
      });
    },

    disconnectGoogle: () => {
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
                  useModalStore.getState().showToast('Compte de Google desconnectat correctament.', 'success');
                  await useEventDataStore.getState().refreshGoogleEvents();
                  get().fetchAndLoadConfig();
                  closeModal();
                } else {
                  useModalStore.getState().showToast(result.message || 'Hi ha hagut un error durant la desconnexió.', 'error');
                }
              } catch (err) {
                useModalStore.getState().showToast((err as Error).message, 'error');
              }
            }
          },
        });
      },
  }))
);
