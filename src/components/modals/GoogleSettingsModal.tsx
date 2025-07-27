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
            window.electronAPI.loadGoogleConfig(),
            window.electronAPI.getCalendarList()
          ]);

          if (configResult) {
            setSelectedIds(new Set(configResult.selectedCalendarIds));
            setAppCalendarId(configResult.appCalendarId || null);
            setCalendarSuffix(configResult.calendarSuffix || '');
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

      <div className="p-4 border dark:border-gray-600 rounded-md min-h-[200px]">
        <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Calendaris addicionals (només lectura)</h4>
        {loading && <p className="text-center text-gray-500">Carregant calendaris...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && (
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
      </div>
      
      <div className="flex justify-end pt-4 border-t dark:border-gray-700">
        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
          Desar i Tancar
        </button>
      </div>
    </div>
  );
};

export default GoogleSettingsModal;