import React, { useEffect } from 'react';
import { ShowToastFunction, GoogleCalendar, ManagedAppCalendar } from '@/types';
import Tooltip from '../ui/Tooltip';
import { useEventDataStore } from '@/stores/eventDataStore';
import { useModalStore } from '@/stores/modalStore';
import {
  useGoogleConfigStore,
  fetchAndLoadConfig,
  saveConfig,
  deleteCalendar,
  disconnectGoogle,
} from '@/stores/googleConfigStore';
import logger from '@/utils/logger';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const executeSync = useEventDataStore(state => state.executeSync);
  const isEventDataSyncing = useEventDataStore(state => state.isSyncing);
  const openModal = useModalStore(state => state.openModal);

  // Subscripció individual a cada 'slice' de l'estat.
  // Això és el que trenca el bucle.
  const externalCalendars = useGoogleConfigStore(state => state.externalCalendars);
  const selectedIds = useGoogleConfigStore(state => state.selectedIds);
  const managedCalendars = useGoogleConfigStore(state => state.managedCalendars);
  const activeCalendarId = useGoogleConfigStore(state => state.activeCalendarId);
  const loading = useGoogleConfigStore(state => state.loading);
  const error = useGoogleConfigStore(state => state.error);

  logger.info('[GoogleSettingsModal Render]', { loading, error });

  useEffect(() => {
    fetchAndLoadConfig();
  }, []); // The empty dependency array is now safe and correct.

  const handleCreateNewCalendar = () => {
    openModal('createAppCalendar');
  };

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

      {/* Secció per als calendaris de l'aplicació */}
      <div className="p-4 border dark:border-gray-600 rounded-md space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Calendaris de l'App Gestionats</h4>
          <Tooltip text="Obrir el diàleg per crear un nou calendari a Google gestionat per l'app">
            <button onClick={handleCreateNewCalendar} className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">
              + Crear Nou
            </button>
          </Tooltip>
        </div>

        {loading && <p className="text-center text-gray-500">Carregant...</p>}
        {!loading && managedCalendars.length > 0 && (
          <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {managedCalendars.map((cal: ManagedAppCalendar) => (
              <li key={cal.id} className="p-2 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-grow">
                    <Tooltip text="Seleccionar com a calendari actiu per a la sincronització">
                      <input
                        type="radio"
                        id={`cal-${cal.id}`}
                        name="activeCalendar"
                        checked={cal.id === activeCalendarId}
                        onChange={() => useGoogleConfigStore.getState().setActiveCalendarId(cal.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500"
                      />
                    </Tooltip>
                    <div className="ml-3">
                      <label htmlFor={`cal-${cal.id}`} className="block text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                        {cal.name}
                        {cal.id === activeCalendarId && <span className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">(ACTIU)</span>}
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Sufix: {cal.suffix || '(cap)'}</span>
                    </div>
                  </div>
                  <Tooltip text={`Eliminar el calendari '${cal.name}' de Google i de l'app`}>
                    <button
                      onClick={() => deleteCalendar(cal)}
                      className="ml-4 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      Eliminar
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-2 pl-7">
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 text-xs">
                        ID
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={cal.id}
                        className="flex-1 min-w-0 block w-full px-2 py-1 rounded-none bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-xs"
                      />
                      <Tooltip text="Copiar l'ID del calendari al porta-retalls">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cal.id);
                            showToast('ID del calendari copiat!', 'success');
                          }}
                          className="inline-flex items-center px-3 py-1 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-200 dark:bg-gray-700 text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Copiar
                        </button>
                      </Tooltip>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && managedCalendars.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            <p>No hi ha cap calendari gestionat per l'aplicació.</p>
            <p>Fes clic a "Crear Nou" per començar.</p>
          </div>
        )}
      </div>

      {/* Secció per a calendaris addicionals de només lectura */}
      <div className="p-4 border dark:border-gray-600 rounded-md min-h-[150px]">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Altres Calendaris de Google (només lectura)</h4>
        {loading && <p className="text-center text-gray-500">Carregant calendaris...</p>}
        {error && <p className="text-center text-red-500">{typeof error === 'string' ? error : (error as Error)?.message || 'S\'ha produït un error desconegut'}</p>}
        {!loading && !error && externalCalendars.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {externalCalendars.map((cal: GoogleCalendar) => (
              <li key={cal.id} className="flex items-center">
                <Tooltip text={`Mostrar/ocultar el calendari '${cal.summary}' a la vista principal`}>
                  <input
                    type="checkbox"
                    id={cal.id}
                    checked={selectedIds.includes(cal.id)}
                    onChange={() => useGoogleConfigStore.getState().toggleExternalCalendar(cal.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    style={{ accentColor: cal.backgroundColor }}
                  />
                </Tooltip>
                <label htmlFor={cal.id} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cal.summary}
                  {cal.primary && ' (Principal)'}
                </label>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && externalCalendars.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">No s'han trobat altres calendaris de Google per seleccionar.</p>
        )}
      </div>
      
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