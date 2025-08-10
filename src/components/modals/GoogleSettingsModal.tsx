import React, { useState, useEffect } from 'react';
import { GoogleCalendar, GoogleConfig, ManagedAppCalendar, ShowToastFunction } from '@/types';
import { useEventData } from '@/contexts/EventDataContext';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const { refreshGoogleEvents, openModal } = useEventData();

  // State for external, read-only calendars
  const [externalCalendars, setExternalCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // State for app-managed calendars
  const [managedCalendars, setManagedCalendars] = useState<ManagedAppCalendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndLoadConfig = async () => {
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
    };
    fetchAndLoadConfig();
  }, []);

  const handleToggleExternal = (calendarId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) newSet.delete(calendarId);
      else newSet.add(calendarId);
      return newSet;
    });
  };

  const handleCreateNewCalendar = () => {
    openModal('confirmHardReset', {
      titleOverride: "Crear Nou Calendari de l'App",
      itemName: "Introdueix un sufix únic per al nou calendari (ex: Teatre Principal). Aquest sufix s'afegirà al nom base \"Gestor d'Esdeveniments (App)\".",
      confirmButtonText: "Crear Calendari",
      requiresInput: true,
      onConfirmSpecial: async (inputValue) => {
        if (!inputValue || inputValue.trim() === '') {
          showToast('El sufix no pot estar buit.', 'warning');
          return;
        }
        if (window.electronAPI?.createNewAppCalendar) {
          try {
            const result = await window.electronAPI.createNewAppCalendar(inputValue.trim());
            if (result.success && result.data) {
              setManagedCalendars(result.data.managedAppCalendars);
              setActiveCalendarId(result.data.activeAppCalendarId);
              showToast('Nou calendari creat i seleccionat com a actiu.', 'success');
              await refreshGoogleEvents();
            } else {
              showToast(result.message || 'No s\'ha pogut crear el calendari.', 'error');
            }
          } catch (err) {
            showToast((err as Error).message, 'error');
          }
        }
      },
    });
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
          <button onClick={handleCreateNewCalendar} className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">
            + Crear Nou
          </button>
        </div>

        {loading && <p className="text-center text-gray-500">Carregant...</p>}
        {!loading && managedCalendars.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {managedCalendars.map(cal => (
              <li key={cal.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`cal-${cal.id}`}
                    name="activeCalendar"
                    checked={cal.id === activeCalendarId}
                    onChange={() => setActiveCalendarId(cal.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor={`cal-${cal.id}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {cal.name}
                    {cal.id === activeCalendarId && <span className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">(ACTIU)</span>}
                  </label>
                </div>
                <button
                  onClick={() => handleDeleteCalendar(cal)}
                  className="px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  Eliminar
                </button>
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
                <input
                  type="checkbox"
                  id={cal.id}
                  checked={selectedIds.has(cal.id)}
                  onChange={() => handleToggleExternal(cal.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  style={{ accentColor: cal.backgroundColor }}
                />
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
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          disabled={managedCalendars.length === 0}
          title={managedCalendars.length === 0 ? "No hi ha cap compte de Google connectat" : "Desconnecta el teu compte de Google"}
        >
          Desconnectar Compte
        </button>
        <button onClick={handleSaveAndClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
          Desar i Tancar
        </button>
      </div>
    </div>
  );
};

export default GoogleSettingsModal;