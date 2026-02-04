import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame, Performance, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';
import CollapsibleSection from './ui/CollapsibleSection';
import { exportEventPerformancesSummaryPdf } from '../utils/pdfGenerator';

const PerformanceList = lazy(() => import('./performances/PerformanceList'));
const PerformanceDetailContainer = lazy(() => import('./performances/PerformanceDetailContainer'));

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
      status: 'pending',
      techData: {
        inputList: [],
        lightingNotes: '',
        videoNotes: '',
        stageRequirements: '',
      },
      hospitalityData: {
        dressingRooms: '',
        cateringNotes: '',
        dietaryRequirements: '',
        travelLogistics: '',
        parkingNotes: '',
      },
      advancing: {
        riderReceived: false,
        counterRiderSent: false,
        schedulesConfirmed: false,
        hospitalityClosed: false,
      },
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

  const handleExportEventSummary = () => {
    if (!selectedEventFrameId) return;
    
    const eventFrame = eventFrames.find(ef => ef.id === selectedEventFrameId);
    if (!eventFrame) return;

    exportEventPerformancesSummaryPdf(eventFrame, eventFrame.performances || [], showToast);
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Tooltip text={t('performances.event_selector_tooltip')}>
                <label className="block text-sm font-medium">
                  {t('performances.select_event')}
                </label>
              </Tooltip>
              <select
                value={selectedEventFrameId}
                onChange={(e) => setSelectedEventFrameId(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t('performances.select_event_placeholder')}</option>
                {eventFrames
                  .filter(ef => !ef.isArchived)
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map(event => (
                    <option key={event.id} value={event.id}>
                      {new Date(event.startDate).toLocaleDateString('ca-ES')} - {event.name}
                    </option>
                  ))}
              </select>
            </div>

            {selectedEventFrameId && (
              <Tooltip text={t('performances.export_runsheet_tooltip')}>
                <button
                  onClick={handleExportEventSummary}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  📄 {t('performances.export_runsheet')}
                </button>
              </Tooltip>
            )}
          </div>

          {/* Missatge si no hi ha esdeveniment seleccionat */}
          {!selectedEventFrameId && (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 border-2 border-dashed border-border rounded-lg">
              <p className="text-lg font-medium">{t('performances.no_event_selected')}</p>
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
                    <PerformanceDetailContainer
                      eventFrameId={selectedEventFrameId}
                      performance={selectedPerformance}
                      showToast={showToast}
                    />
                  </Suspense>
                ) : (
                  <div className="text-center py-12 text-muted-foreground bg-muted/30 border-2 border-dashed border-border rounded-lg">
                    <p className="text-lg font-medium">{t('performances.no_performance_selected')}</p>
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
