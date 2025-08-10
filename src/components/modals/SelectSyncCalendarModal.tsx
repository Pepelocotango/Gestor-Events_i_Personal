import React, { useState, useEffect } from 'react';
import { ManagedAppCalendar } from '@/types';

interface SelectSyncCalendarModalProps {
  onClose: () => void;
  onConfirm: (targetCalendarId: string) => void;
  managedCalendars: ManagedAppCalendar[];
  activeCalendarId: string | null;
}

const SelectSyncCalendarModal: React.FC<SelectSyncCalendarModalProps> = ({
  onClose,
  onConfirm,
  managedCalendars,
  activeCalendarId,
}) => {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(activeCalendarId);

  useEffect(() => {
    // Pre-select the active calendar, or the first one if no active one is set.
    if (activeCalendarId && managedCalendars.some(c => c.id === activeCalendarId)) {
      setSelectedCalendarId(activeCalendarId);
    } else if (managedCalendars.length > 0) {
      setSelectedCalendarId(managedCalendars[0].id);
    } else {
      setSelectedCalendarId(null);
    }
  }, [activeCalendarId, managedCalendars]);

  const handleSync = () => {
    if (selectedCalendarId) {
      onConfirm(selectedCalendarId);
    }
  };

  const selectedCalendar = managedCalendars.find(c => c.id === selectedCalendarId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selecciona el Calendari de Destinació</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tria a quin calendari de l'aplicació vols pujar les dades actuals. Aquesta acció sobreescriurà tot el contingut del calendari de destinació.
        </p>
      </div>

      {managedCalendars.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
          {managedCalendars.map(cal => (
            <div key={cal.id} className="flex items-center p-2 rounded-md border border-transparent has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
              <input
                type="radio"
                id={`sync-cal-${cal.id}`}
                name="syncCalendar"
                value={cal.id}
                checked={cal.id === selectedCalendarId}
                onChange={() => setSelectedCalendarId(cal.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor={`sync-cal-${cal.id}`} className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {cal.name}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p>No s'ha trobat cap calendari gestionat per l'aplicació.</p>
          <p className="mt-1">Si us plau, ves a "Configuració Google Calendar" per crear-ne un primer.</p>
        </div>
      )}

      <div className="flex justify-end items-center pt-4 border-t dark:border-gray-700 space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancel·lar
        </button>
        <button
          onClick={handleSync}
          disabled={!selectedCalendarId}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedCalendar ? `Sincronitzar amb "${selectedCalendar.name}"` : 'Selecciona un calendari'}
        </button>
      </div>
    </div>
  );
};

export default SelectSyncCalendarModal;
