import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';

const TechSheetForm = lazy(() => import('./tech_sheets/TechSheetForm'));

interface TechSheetsDisplayProps {
  showToast: ShowToastFunction;
}

const TechSheetsDisplay: React.FC<TechSheetsDisplayProps> = ({ showToast }) => {
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string>('');

  useEffect(() => {
    const loadLastViewed = async () => {
      if (window.electronAPI?.getSessionData) {
        const sessionData = await window.electronAPI.getSessionData();
        const lastId = sessionData?.lastViewedTechSheetId;
        // Check if the event still exists and is not archived before selecting it
        if (lastId && eventFrames.some(ef => ef.id === lastId && ef.isArchived !== true)) {
          setSelectedEventFrameId(lastId);
        }
      }
    };
    loadLastViewed();
  }, [eventFrames]);

  useEffect(() => {
    if (selectedEventFrameId && window.electronAPI?.saveSessionData) {
      window.electronAPI.saveSessionData('lastViewedTechSheetId', selectedEventFrameId);
    }
  }, [selectedEventFrameId]);

  const sortedEventFrames = useMemo(() => {
    return eventFrames
      .filter(ef => ef.isArchived !== true)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [eventFrames]);

  const selectedEventFrame = useMemo((): EventFrame | undefined => {
    return eventFrames.find((ef: EventFrame) => ef.id === selectedEventFrameId);
  }, [eventFrames, selectedEventFrameId]);

  useEffect(() => {
    // If the currently selected event is no longer in the sorted list (e.g., it got archived), clear the selection
    if (selectedEventFrameId && !sortedEventFrames.some(ef => ef.id === selectedEventFrameId)) {
        setSelectedEventFrameId('');
    }
  }, [sortedEventFrames, selectedEventFrameId]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-card rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 text-card-foreground">Gestor de Fitxes de Bolo</h2>
        
        <div className="max-w-md">
          <label htmlFor="event-selector" className="block text-sm font-medium text-muted-foreground">
            Selecciona un esdeveniment per veure o editar la seva fitxa:
          </label>
          <Tooltip text="Llista d'esdeveniments ordenats per data més recent">
            <select
              id="event-selector"
              value={selectedEventFrameId}
              onChange={(e) => setSelectedEventFrameId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background text-foreground border-input border focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm rounded-md"
            >
              <option value="" disabled>-- Tria un esdeveniment --</option>
              {sortedEventFrames.map((event) => (
                <option key={event.id} value={event.id}>
                  {new Date(event.startDate).toLocaleDateString('ca-ES')} - {event.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>
      </div>

          
      {selectedEventFrame && selectedEventFrame.techSheet ? (
        <Suspense fallback={<div className="text-center p-8">Carregant formulari...</div>}>
          <TechSheetForm 
            key={selectedEventFrame.id}
            eventFrame={selectedEventFrame}
            showToast={showToast}
          />
        </Suspense>
      ) : (
        selectedEventFrameId && (
          <div className="p-4 text-center text-orange-500 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <p>Aquest esdeveniment no té una fitxa tècnica associada. Pot ser de dades antigues. Desa l'esdeveniment per generar-ne una.</p>
          </div>
        )
      )}
    </div>
  );
};

export default TechSheetsDisplay;