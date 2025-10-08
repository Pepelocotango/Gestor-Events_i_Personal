import React, { useState, useEffect } from 'react';
import { ManagedAppCalendar } from '@/types';
import Tooltip from '../ui/Tooltip';

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
        <h3 className="text-lg font-medium text-foreground">Selecciona el Calendari de Destinació</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tria a quin calendari de l'aplicació vols pujar les dades actuals. Aquesta acció sobreescriurà tot el contingut del calendari de destinació.
        </p>
      </div>

      {managedCalendars.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
          {managedCalendars.map(cal => (
            <div key={cal.id} className="flex items-center p-2 rounded-md border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <Tooltip text={`Seleccionar el calendari '${cal.name}' com a destinació per a la sincronització`}>
                <input
                  type="radio"
                  id={`sync-cal-${cal.id}`}
                  name="syncCalendar"
                  value={cal.id}
                  checked={cal.id === selectedCalendarId}
                  onChange={() => setSelectedCalendarId(cal.id)}
                  className="h-4 w-4 accent-primary focus:ring-ring border-border"
                />
              </Tooltip>
              <label htmlFor={`sync-cal-${cal.id}`} className="ml-3 block text-sm font-medium text-foreground">
                {cal.name}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-6 bg-muted/50 rounded-md">
          <p>No s'ha trobat cap calendari gestionat per l'aplicació.</p>
          <p className="mt-1">Si us plau, ves a "Configuració Google Calendar" per crear-ne un primer.</p>
        </div>
      )}

      <div className="flex justify-end items-center pt-4 border-t border-border space-x-2">
        <Tooltip text="Tancar sense sincronitzar">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text={!selectedCalendarId ? 'Has de seleccionar un calendari per poder sincronitzar' : `Sobreescriurà les dades de '${selectedCalendar?.name}' amb les dades actuals de l'app`}>
          <button
            onClick={handleSync}
            disabled={!selectedCalendarId}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedCalendar ? `Sincronitzar amb "${selectedCalendar.name}"` : 'Selecciona un calendari'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default SelectSyncCalendarModal;
