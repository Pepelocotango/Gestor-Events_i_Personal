import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useEventDataStore, selectMaterialControlData } from '../stores/eventDataStore';
import { EventFrame, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';
import CollapsibleSection from './ui/CollapsibleSection';

const TechSheetForm = lazy(() => import('./tech_sheets/TechSheetForm'));

interface TechSheetsDisplayProps {
  showToast: ShowToastFunction;
}

const TechSheetsDisplay: React.FC<TechSheetsDisplayProps> = ({ showToast }) => {
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const fullEventDataStore = useEventDataStore(state => state);
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string>('');

  useEffect(() => {
    const loadLastViewed = async () => {
      if (window.electronAPI?.getSessionData) {
        const sessionData = await window.electronAPI.getSessionData();
        const lastId = sessionData?.lastViewedTechSheetId;
        if (lastId && eventFrames.some(ef => ef.id === lastId && !ef.isArchived)) {
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
      .filter(ef => !ef.isArchived)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [eventFrames]);

  const selectedEventFrame = useMemo((): EventFrame | undefined => {
    return eventFrames.find((ef: EventFrame) => ef.id === selectedEventFrameId);
  }, [eventFrames, selectedEventFrameId]);

  const availabilityMap = useMemo(() => {
    if (!selectedEventFrame) {
      return new Map<string, { available: number; total: number }>();
    }

    const controlData = selectMaterialControlData(fullEventDataStore, {
      dateRange: { start: selectedEventFrame.startDate, end: selectedEventFrame.endDate },
    });

    const newMap = new Map<string, { available: number; total: number }>();
    controlData.forEach(row => {
      newMap.set(row.item.id, {
        available: row.item.stock - row.totalDemand,
        total: row.item.stock,
      });
    });

    return newMap;
  }, [selectedEventFrame, fullEventDataStore]);

  useEffect(() => {
    if (selectedEventFrameId && !sortedEventFrames.some(ef => ef.id === selectedEventFrameId)) {
      setSelectedEventFrameId('');
    }
  }, [sortedEventFrames, selectedEventFrameId]);

  return (
    <CollapsibleSection
      title="Gestor de Fitxes de Bolo"
      defaultOpen={true}
    >
      <div className="space-y-4">
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

        {selectedEventFrame && selectedEventFrame.techSheet ? (
          <Suspense fallback={<div className="text-center p-8">Carregant formulari...</div>}>
            <TechSheetForm
              key={selectedEventFrame.id}
              eventFrame={selectedEventFrame}
              showToast={showToast}
              availabilityMap={availabilityMap}
            />
          </Suspense>
        ) : (
          selectedEventFrameId && (
            <div className="p-4 text-center text-warning-foreground bg-warning/10 rounded-lg">
              <p>Aquest esdeveniment no té una fitxa tècnica associada. Pot ser de dades antigues. Desa l'esdeveniment per generar-ne una.</p>
            </div>
          )
        )}
      </div>
    </CollapsibleSection>
  );
};

export default TechSheetsDisplay;