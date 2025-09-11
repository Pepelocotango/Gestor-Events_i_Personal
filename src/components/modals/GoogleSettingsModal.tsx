import React, { useEffect } from 'react';
import { ShowToastFunction } from '@/types';
import Tooltip from '../ui/Tooltip';
import { useEventDataStore } from '@/stores/eventDataStore';
// import { useModalStore } from '@/stores/modalStore';
import { useGoogleConfigStore } from '@/stores/googleConfigStore';
import logger from '@/utils/logger';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const { executeSync, isSyncing: isEventDataSyncing } = useEventDataStore(state => ({
    executeSync: state.executeSync,
    isSyncing: state.isSyncing,
  }));
  // const openModal = useModalStore(state => state.openModal);

  const {
    // externalCalendars,
    // selectedIds,
    managedCalendars,
    activeCalendarId,
    loading,
    // error,
    fetchAndLoadConfig,
    // toggleExternalCalendar,
    // setActiveCalendarId,
    saveConfig,
    // deleteCalendar,
    disconnectGoogle,
<<<<<<< HEAD
  } = storeState;
=======
  } = useGoogleConfigStore();
>>>>>>> parent of 32a3b62 (fix(google): Prevent render crash in GoogleSettingsModal and enhance logging)

  logger.info('[GoogleSettingsModal Render] State:', storeState);

  logger.info('[GoogleSettingsModal Render] State:', storeState);

  logger.info('[GoogleSettingsModal Render] State:', storeState);

  logger.info('[GoogleSettingsModal Render] State:', storeState);

  logger.info('[GoogleSettingsModal Render] State:', storeState);

  useEffect(() => {
    fetchAndLoadConfig();
  }, [fetchAndLoadConfig]);

  // const handleCreateNewCalendar = () => {
  //   openModal('createAppCalendar');
  // };

  const handleSaveAndClose = async () => {
    const result = await saveConfig();
    showToast(result.message, result.type);
    if (result.success) {
      onClose();
    }
  };

  const isSyncing = isEventDataSyncing || loading;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuració de Google Calendar</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
          <p><strong className="font-semibold">Important:</strong> La sincronització és <strong>unidireccional</strong>: les dades de l'app sobreescriuen les del calendari seleccionat a Google. Qualsevol canvi fet directament a Google en aquests calendaris <strong>es perdrà</strong>.</p>
        </div>
      </div>

      {/* Secció per als calendaris de l'aplicació (TEMPORALMENT DESACTIVADA) */}
      {/* <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
        ...
      </div> */}

      {/* Secció per a calendaris addicionals de només lectura (TEMPORALMENT DESACTIVADA) */}
      {/* <div className="p-4 border dark:border-gray-600 rounded-md min-h-[150px]">
        ...
      </div> */}
      
      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
        <Tooltip text={managedCalendars.length === 0 ? "No hi ha cap compte de Google connectat" : "Desconnecta el teu compte de Google i elimina les dades relacionades"}>
          <button
            onClick={disconnectGoogle}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            disabled={managedCalendars.length === 0 || isSyncing}
          >
            Desconnectar Compte
          </button>
        </Tooltip>
        <div className="flex items-center space-x-2">
          <Tooltip text={!activeCalendarId ? "Selecciona un calendari actiu per poder sincronitzar" : "Forçar una sincronització manual ara"}>
            <button
              onClick={() => {
                if (activeCalendarId) {
                  executeSync(activeCalendarId);
                  onClose();
                } else {
                  showToast("Si us plau, selecciona un calendari actiu per sincronitzar.", 'warning');
                }
              }}
              disabled={!activeCalendarId || isSyncing}
              className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md disabled:opacity-50"
            >
              {isSyncing ? 'Sincronitzant...' : 'Sincronitzar Ara'}
            </button>
          </Tooltip>
          <Tooltip text="Desar la configuració actual i tancar la finestra">
            <button onClick={handleSaveAndClose} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">
              Desar i Tancar
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default GoogleSettingsModal;