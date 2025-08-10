import React, { useState, useEffect } from 'react';
import { GoogleCalendar, GoogleConfig, ShowToastFunction } from '@/types';
import { useEventData } from '@/contexts/EventDataContext';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const { refreshGoogleEvents } = useEventData();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [appCalendarId, setAppCalendarId] = useState<string | null>(null);
  const [calendarSuffix, setCalendarSuffix] = useState('');
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
            setAppCalendarId(configResult.appCalendarId || null);
            setCalendarSuffix(configResult.calendarSuffix || '');
          } else {
            // Si no hi ha configuració, inicialitzem els estats
            setSelectedIds(new Set());
            setAppCalendarId(null);
            setCalendarSuffix('');
          }

          if (calendarsResult.success) {
            setCalendars(calendarsResult.calendars || []);
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

  const handleToggle = (calendarId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) newSet.delete(calendarId);
      else newSet.add(calendarId);
      return newSet;
    });
  };

  const handleSave = async () => {
    if (window.electronAPI?.saveGoogleConfig) {
      const configToSave: GoogleConfig = {
        selectedCalendarIds: Array.from(selectedIds),
        appCalendarId: appCalendarId || undefined,
        calendarSuffix: calendarSuffix.trim()
      };
      const result = await window.electronAPI.saveGoogleConfig(configToSave);
      if (result.success) {
        showToast('Configuració de calendaris desada.', 'success');
        await refreshGoogleEvents();
        onClose();
      } else {
        showToast('No s\'ha pogut desar la configuració.', 'error');
      }
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      "Estàs segur que vols desconnectar el teu compte de Google?\n\n" +
      "Aquesta acció:\n" +
      "- Eliminarà permanentment el calendari de l'aplicació del teu compte de Google.\n" +
      "- Revocarà l'accés de l'aplicació al teu compte.\n" +
      "- Esborrarà tota la configuració de Google d'aquesta aplicació.\n\n" +
      "Aquesta acció és irreversible."
    );

    if (confirmed && window.electronAPI?.googleDisconnect) {
      try {
        const result = await window.electronAPI.googleDisconnect();
        if (result.success) {
          showToast('Compte de Google desconnectat correctament.', 'success');
          setSelectedIds(new Set());
          setAppCalendarId(null);
          setCalendarSuffix('');
          setCalendars([]);
          setError(null);
          await refreshGoogleEvents();
          onClose();
        } else {
          showToast(result.message || 'Hi ha hagut un error durant la desconnexió.', 'error');
        }
      } catch (err) {
        showToast((err as Error).message, 'error');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuració de Google Calendar</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
          <p><strong className="font-semibold">Important:</strong> L'aplicació crearà un calendari dedicat (p. ex., "Gestor d'Esdeveniments (App)") al teu compte de Google.</p>
          <p>La sincronització és <strong>unidireccional</strong>: les dades de l'app sobreescriuen les dades d'aquest calendari. Qualsevol canvi que facis directament a Google Calendar en aquest calendari específic <strong>es perdrà</strong> a la propera sincronització.</p>
        </div>
      </div>

      <div>
        <label htmlFor="calendarSuffix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sufix personalitzat per al calendari (opcional)
        </label>
        <input
          type="text"
          id="calendarSuffix"
          value={calendarSuffix}
          onChange={(e) => setCalendarSuffix(e.target.value)}
          placeholder="Ex: Teatre Principal"
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
        />
        <p className="mt-1 text-xs text-gray-500">El nom final serà: Gestor d'Esdeveniments (App) - {calendarSuffix || "..."}</p>
      </div>

      {appCalendarId && (
        <div>
          <label htmlFor="appCalendarId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ID del Calendari de l'App
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="appCalendarId"
              readOnly
              value={appCalendarId}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(appCalendarId);
                showToast('ID del calendari copiat al porta-retalls!', 'success');
              }}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-sm"
            >
              Copiar
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Si el calendari no apareix automàticament, pots afegir-lo manualment a Google Calendar anant a "Afegeix altres calendaris" {'>'} "Subscriu-te al calendari" i enganxant aquest ID.
          </p>
        </div>
      )}

      <div className="p-4 border dark:border-gray-600 rounded-md min-h-[200px]">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Calendaris addicionals (només lectura)</h4>
        {loading && <p className="text-center text-gray-500">Carregant calendaris...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && calendars.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {calendars.map(cal => (
              <li key={cal.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={cal.id}
                  checked={selectedIds.has(cal.id)}
                  onChange={() => handleToggle(cal.id)}
                  disabled={cal.id === appCalendarId}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  style={{ accentColor: cal.backgroundColor }}
                />
                <label htmlFor={cal.id} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cal.summary}
                  {cal.id === appCalendarId && <span className="ml-2 text-xs font-bold text-indigo-600">(Calendari de l'App)</span>}
                  {cal.primary && cal.id !== appCalendarId && ' (Principal)'}
                </label>
              </li>
            ))}
          </ul>
        )}
         {!loading && !error && calendars.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">No s'han trobat calendaris o no estàs connectat a Google.</p>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
          disabled={!appCalendarId}
          title={!appCalendarId ? "No estàs connectat a un compte de Google" : "Desconnecta el teu compte de Google"}
        >
          Desconnectar Compte
        </button>
        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
          Desar i Tancar
        </button>
      </div>
    </div>
  );
};

export default GoogleSettingsModal;