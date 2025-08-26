import React, { useState, useEffect, useCallback } from 'react';
import { GoogleCalendar, GoogleConfig, ManagedAppCalendar, ShowToastFunction } from '@/types';
import { useEventData } from '@/contexts/EventDataContext';
import Tooltip from '../ui/Tooltip';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const { refreshGoogleEvents, openModal, executeSync, isSyncing } = useEventData();

  // State for external, read-only calendars
  const [externalCalendars, setExternalCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // State for app-managed calendars
  const [managedCalendars, setManagedCalendars] = useState<ManagedAppCalendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndLoadConfig = useCallback(async () => {
    if (window.electronAPI?.loadGoogleConfig && window.electronAPI?.getCalendarList) {
      setLoading(true);
      try {
        const [configResult, calendarsResult] = await Promise.all([
          window.electronAPI.loadGoogleConfig() as Promise<GoogleConfig | null>,
          window.electronAPI.getCalendarList()
        ]);

        if (configResult) {
          setSelectedIds(new Set(configResult.selectedCalendarIds || []));
          setManagedCalendars(configResult.managedAppCalendars || []);
          setActiveCalendarId(configResult.activeAppCalendarId || null);
        }

        if (calendarsResult.success) {
          const managedIdsSet = new Set(configResult?.managedAppCalendars?.map(c => c.id) || []);
          setExternalCalendars(calendarsResult.calendars?.filter(c => !managedIdsSet.has(c.id)) || []);
        } else {
          setError(calendarsResult.message || 'Error desconegut obtenint calendaris.');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAndLoadConfig();

    const handleConfigChange = () => {
        showToast('La configuració de Google ha canviat, actualitzant...', 'info');
        fetchAndLoadConfig();
    };

    window.addEventListener('googleConfigChanged', handleConfigChange);
    return () => {
        window.removeEventListener('googleConfigChanged', handleConfigChange);
    };
  }, [fetchAndLoadConfig, showToast]);

  const handleToggleExternal = (calendarId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) newSet.delete(calendarId);
      else newSet.add(calendarId);
      return newSet;
    });
  };

  const handleCreateNewCalendar = () => {
    openModal('createAppCalendar');
  };

  const handleDeleteCalendar = (calendar: ManagedAppCalendar) => {
    openModal('confirmHardReset', {
      titleOverride: "Confirmar Eliminació de Calendari",
      itemName: `Estàs segur que vols eliminar permanentment el calendari "${calendar.name}" del teu compte de Google i de l'aplicació? Aquesta acció no es pot desfer.`,
      confirmButtonText: "Sí, Eliminar Calendari",
      onConfirmSpecial: async () => {
        if (window.electronAPI?.deleteAppCalendar) {
          try {
            const result = await window.electronAPI.deleteAppCalendar(calendar.id);
            if (result.success && result.data) {
              showToast(result.message || 'Calendari eliminat correctament.', 'success');
              setManagedCalendars(result.data.managedAppCalendars);
              setActiveCalendarId(result.data.activeAppCalendarId);
              // Also remove from the general selection list
              setSelectedIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(calendar.id);
                  return newSet;
              });
              await refreshGoogleEvents();
            } else {
              showToast(result.message || 'Hi ha hagut un error durant l\'eliminació.', 'error');
            }
          } catch (err) {
            showToast((err as Error).message, 'error');
          }
        }
      },
    });
  };

  const handleSaveAndClose = async () => {
    if (window.electronAPI?.saveGoogleConfig) {
      const configToSave: Partial<GoogleConfig> = {
        selectedCalendarIds: Array.from(selectedIds),
        activeAppCalendarId: activeCalendarId,
      };
      const result = await window.electronAPI.saveGoogleConfig(configToSave);
      if (result.success) {
        showToast('Configuració desada.', 'success');
        await refreshGoogleEvents();
        onClose();
      } else {
        showToast(result.message || 'No s\'ha pogut desar la configuració.', 'error');
      }
    }
  };

  const handleDisconnect = () => {
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
              showToast('Compte de Google desconnectat correctament.', 'success');
              await refreshGoogleEvents();
              onClose();
            } else {
              showToast(result.message || 'Hi ha hagut un error durant la desconnexió.', 'error');
            }
          } catch (err) {
            showToast((err as Error).message, 'error');
          }
        }
      },
    });
  };

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
            {managedCalendars.map(cal => (
              <li key={cal.id} className="p-2 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-grow">
                    <Tooltip text="Seleccionar com a calendari actiu per a la sincronització">
                      <input
                        type="radio"
                        id={`cal-${cal.id}`}
                        name="activeCalendar"
                        checked={cal.id === activeCalendarId}
                        onChange={() => setActiveCalendarId(cal.id)}
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
                      onClick={() => handleDeleteCalendar(cal)}
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
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && externalCalendars.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {externalCalendars.map(cal => (
              <li key={cal.id} className="flex items-center">
                <Tooltip text={`Mostrar/ocultar el calendari '${cal.summary}' a la vista principal`}>
                  <input
                    type="checkbox"
                    id={cal.id}
                    checked={selectedIds.has(cal.id)}
                    onChange={() => handleToggleExternal(cal.id)}
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
            onClick={handleDisconnect}
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