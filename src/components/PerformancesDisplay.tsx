import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame, Performance, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';
import CollapsibleSection from './ui/CollapsibleSection';

const PerformanceList = lazy(() => import('./performances/PerformanceList'));
const PerformanceBasicForm = lazy(() => import('./performances/PerformanceBasicForm'));

interface PerformancesDisplayProps {
  showToast?: ShowToastFunction;
}

const PerformancesDisplay: React.FC<PerformancesDisplayProps> = ({ showToast: _showToast }) => {
  const { t } = useTranslation();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const { addPerformance, deletePerformance } = useEventDataStore();
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string>('');
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    const loadLastViewed = async () => {
      if (window.electronAPI?.getSessionData) {
        const sessionData = await window.electronAPI.getSessionData();
        const lastId = sessionData?.lastViewedPerformanceEventId;
        if (lastId && eventFrames.some(ef => ef.id === lastId && !ef.isArchived)) {
          setSelectedEventFrameId(lastId);
        }
      }
    };
    loadLastViewed();
  }, [eventFrames]);

  useEffect(() => {
    if (selectedEventFrameId && window.electronAPI?.saveSessionData) {
      window.electronAPI.saveSessionData('lastViewedPerformanceEventId', selectedEventFrameId);
    }
  }, [selectedEventFrameId]);

  const sortedEventFrames = useMemo(() => {
    return eventFrames
      .filter(ef => includeArchived || !ef.isArchived)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [eventFrames, includeArchived]);

  const selectedEventFrame = useMemo((): EventFrame | undefined => {
    return eventFrames.find((ef: EventFrame) => ef.id === selectedEventFrameId);
  }, [eventFrames, selectedEventFrameId]);

  const selectedPerformance = useMemo((): Performance | undefined => {
    if (!selectedEventFrame || !selectedPerformanceId) return undefined;
    return selectedEventFrame.performances?.find(p => p.id === selectedPerformanceId);
  }, [selectedEventFrame, selectedPerformanceId]);

  useEffect(() => {
    if (selectedEventFrameId && !sortedEventFrames.some(ef => ef.id === selectedEventFrameId)) {
      setSelectedEventFrameId('');
      setSelectedPerformanceId(null);
    }
  }, [sortedEventFrames, selectedEventFrameId]);

  const handleAddPerformance = () => {
    if (!selectedEventFrameId) return;
    
    const newPerformance: Omit<Performance, 'id'> = {
      name: t('performances.new_performance_name'),
      type: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      status: 'pending'
    };

    const newPerformanceId = addPerformance(selectedEventFrameId, newPerformance);
    if (newPerformanceId) {
      setSelectedPerformanceId(newPerformanceId);
    }
  };

  const handleDeletePerformance = (performanceId: string) => {
    if (!selectedEventFrameId) return;
    deletePerformance(selectedEventFrameId, performanceId);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    _showToast?.(message, type);
  };

  return (
    <div className="p-6">
      <CollapsibleSection 
        title={t('performances.manager_title')}
        defaultOpen={true}
      >
        <div className="space-y-6">
          {/* Selector d'Esdeveniment */}
          <div className="max-w-md space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="event-selector" className="block text-sm font-medium text-muted-foreground">
                {t('performances.select_event_label')}
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeArchivedPerformances"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
                />
                <label htmlFor="includeArchivedPerformances" className="ml-2 text-sm font-medium text-foreground">
                  {t('performances.include_archived')}
                </label>
              </div>
            </div>
            <Tooltip text={includeArchived ? t('performances.archived_tooltip_on') : t('performances.archived_tooltip_off')}>
              <select
                id="event-selector"
                value={selectedEventFrameId}
                onChange={(e) => {
                  setSelectedEventFrameId(e.target.value);
                  setSelectedPerformanceId(null);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background text-foreground border-border border focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm rounded-md"
              >
                <option value="" disabled>-- {t('performances.select_placeholder')} --</option>
                {sortedEventFrames.map((event) => (
                  <option key={event.id} value={event.id}>
                    {new Date(event.startDate).toLocaleDateString('ca-ES')} - {event.name}
                  </option>
                ))}
              </select>
            </Tooltip>
          </div>

          {/* Missatge si no hi ha esdeveniment seleccionat */}
          {!selectedEventFrameId && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">{t('performances.no_event_selected')}</p>
            </div>
          )}

          {/* Layout de dues columnes */}
          {selectedEventFrameId && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna 1: Llista d'actuacions */}
              <div className="lg:col-span-1">
                <Suspense fallback={<div className="text-center p-8">{t('common.loading')}</div>}>
                  <PerformanceList
                    eventFrameId={selectedEventFrameId}
                    performances={selectedEventFrame?.performances || []}
                    selectedPerformanceId={selectedPerformanceId}
                    onSelectPerformance={setSelectedPerformanceId}
                    onAddPerformance={handleAddPerformance}
                    onDeletePerformance={handleDeletePerformance}
                    showToast={showToast}
                  />
                </Suspense>
              </div>

              {/* Columna 2 i 3: Formulari */}
              <div className="lg:col-span-2">
                {selectedPerformance ? (
                  <Suspense fallback={<div className="text-center p-8">{t('common.loading')}</div>}>
                    <PerformanceBasicForm
                      eventFrameId={selectedEventFrameId}
                      performance={selectedPerformance}
                      showToast={showToast}
                    />
                  </Suspense>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <p className="text-lg">{t('performances.no_performance_selected')}</p>
                    <p className="text-sm mt-2">{t('performances.select_performance_to_edit')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default PerformancesDisplay;
