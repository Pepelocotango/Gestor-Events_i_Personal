import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { EventFrame, Performance, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';
import CollapsibleSection from './ui/CollapsibleSection';
import { exportEventPerformancesSummaryPdf, generateEventPerformancesPdfObject } from '../utils/pdfGenerator';
import { triggerAllSaves } from '../utils/saveManager';
import { PdfIcon, EyeIcon, MicrophoneIcon } from '../constants';

const PerformanceList = lazy(() => import('./performances/PerformanceList'));
const PerformanceDetailContainer = lazy(() => import('./performances/PerformanceDetailContainer'));

interface PerformancesDisplayProps {
  showToast?: ShowToastFunction;
}

const PerformancesDisplay: React.FC<PerformancesDisplayProps> = ({ showToast: _showToast }) => {
  const { t } = useTranslation();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const { addPerformance, deletePerformance } = useEventDataStore();
  const openModal = useModalStore(state => state.openModal);
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string>('');
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);

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
      .filter(ef => !ef.isArchived)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [eventFrames]);

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
        monitorList: [],
        cableList: [],
        spareList: [],
        lightingNotes: '',
        videoNotes: '',
        stageRequirements: ''
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
    
    triggerAllSaves(); // GUARDA ELS BUFFERS ABANS D'EXPORTAR
    
    const eventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === selectedEventFrameId);
    if (!eventFrame) return;

    exportEventPerformancesSummaryPdf(eventFrame, eventFrame.performances || [], showToast);
  };

  const handlePreview = () => {
    if (!selectedEventFrameId) return;
    
    triggerAllSaves(); // GUARDA ELS BUFFERS ABANS DE PREVISUALITZAR
    
    const eventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === selectedEventFrameId);
    if (!eventFrame) return;

    const doc = generateEventPerformancesPdfObject(eventFrame, eventFrame.performances || []);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
    
    openModal('pdfPreview', {
      pdfUrl,
      titleOverride: t('modals.pdf_preview.title_override', { name: eventFrame.name }),
      onSave: () => handleExportEventSummary()
    });
  };

  const showToast: ShowToastFunction = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    _showToast?.(message, type);
  };

  return (
    <div className="px-2 py-2">
      <CollapsibleSection 
        title={t('performances.manager_title')}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Selector d'Esdeveniment */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-4">
              <Tooltip text={t('performances.event_selector_tooltip')}>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tight">
                  {t('performances.select_event')}
                </label>
              </Tooltip>
              <select
                value={selectedEventFrameId}
                onChange={(e) => setSelectedEventFrameId(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium min-w-[250px]"
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
              <div className="flex gap-2">
                <Tooltip text={t('performances.preview_runsheet_tooltip')}>
                  <button
                    onClick={handlePreview}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2 text-xs font-bold"
                  >
                    <EyeIcon className="w-4 h-4" />
                    {t('performances.preview_runsheet')}
                  </button>
                </Tooltip>
                <Tooltip text={t('performances.export_runsheet_tooltip')}>
                  <button
                    onClick={handleExportEventSummary}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2 text-xs font-bold"
                  >
                    <PdfIcon className="w-4 h-4" />
                    {t('performances.export_runsheet')}
                  </button>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Missatge si no hi ha esdeveniment seleccionat */}
          {!selectedEventFrameId && (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-lg">
              <p className="text-lg font-medium italic">{t('performances.no_event_selected')}</p>
            </div>
          )}

          {/* Layout de dues columnes a tota l'amplada */}
          {selectedEventFrameId && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
              {/* Columna 1: Llista d'actuacions (3 de 12 columnes) */}
              <div className="lg:col-span-3 flex flex-col overflow-hidden bg-card rounded-lg border border-border shadow-sm">
                <div className="flex-grow overflow-y-auto p-1 custom-scrollbar">
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
              </div>

              {/* Columna 2 i 3: Formulari (9 de 12 columnes) */}
              <div className="lg:col-span-9 flex flex-col overflow-hidden bg-card rounded-lg border border-border shadow-sm">
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-background/30">
                  {selectedPerformance ? (
                    <Suspense fallback={<div className="text-center p-8">{t('common.loading')}</div>}>
                      <PerformanceDetailContainer
                        eventFrameId={selectedEventFrameId}
                        performance={selectedPerformance}
                        showToast={showToast}
                      />
                    </Suspense>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <MicrophoneIcon className="w-12 h-12 opacity-20" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{t('performances.no_performance_selected')}</p>
                        <p className="text-sm opacity-70">{t('performances.select_performance_to_edit')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default PerformancesDisplay;
