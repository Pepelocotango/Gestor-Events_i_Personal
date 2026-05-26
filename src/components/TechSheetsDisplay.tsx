/**
 * =============================================================================
 * TECH SHEETS DISPLAY
 * =============================================================================
 * DESCRIPCIÓ:
 * Component per mostrar i gestionar les fitxes tècniques amb lazy loading.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i component lazy.
 * - COMPONENT PRINCIPAL: TechSheetsDisplay amb selecció d'esdeveniment.
 * - ESTAT I FILTRATGE: Estat de selecció i filtres d'arxiu.
 * - HANDLERS: Gestió de selecció d'esdeveniment.
 * - RENDERITZAT: Estructura amb Suspense per lazy loading.
 * =============================================================================
 */

import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame, ShowToastFunction } from '../types';
import Tooltip from './ui/Tooltip';
import CollapsibleSection from './ui/CollapsibleSection';

const TechSheetForm = lazy(() => import('./tech_sheets/TechSheetForm'));

interface TechSheetsDisplayProps {
  showToast: ShowToastFunction;
}

const TechSheetsDisplay: React.FC<TechSheetsDisplayProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState(false);

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
      .filter(ef => includeArchived || !ef.isArchived)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [eventFrames, includeArchived]);

  const selectedEventFrame = useMemo((): EventFrame | undefined => {
    return eventFrames.find((ef: EventFrame) => ef.id === selectedEventFrameId);
  }, [eventFrames, selectedEventFrameId]);

  useEffect(() => {
    if (selectedEventFrameId && !sortedEventFrames.some(ef => ef.id === selectedEventFrameId)) {
      setSelectedEventFrameId('');
    }
  }, [sortedEventFrames, selectedEventFrameId]);

  return (
    <CollapsibleSection
      title={t('tech_sheets.manager_title')}
      defaultOpen={true}
    >
      <div className="space-y-4">
        <div className="max-w-md space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="event-selector" className="block text-sm font-medium text-muted-foreground">
              {t('tech_sheets.select_event_label')}
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeArchivedTechSheets"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
              />
              <label htmlFor="includeArchivedTechSheets" className="ml-2 text-sm font-medium text-foreground">
                {t('tech_sheets.include_archived')}
              </label>
            </div>
          </div>
          <Tooltip text={includeArchived ? t('tech_sheets.archived_tooltip_on') : t('tech_sheets.archived_tooltip_off')}>
            <select
              id="event-selector"
              value={selectedEventFrameId}
              onChange={(e) => setSelectedEventFrameId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-background text-foreground border-border border focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm rounded-md"
            >
              <option value="" disabled>-- {t('tech_sheets.select_placeholder')} --</option>
              {sortedEventFrames.map((event) => (
                <option key={event.id} value={event.id}>
                  {new Date(event.startDate).toLocaleDateString('ca-ES')} - {event.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>

        {selectedEventFrame && selectedEventFrame.techSheet ? (
          <Suspense fallback={<div className="text-center p-8">{t('tech_sheets.loading_form')}</div>}>
            <TechSheetForm
              key={selectedEventFrame.id}
              eventFrame={selectedEventFrame}
              showToast={showToast}
            />
          </Suspense>
        ) : (
          selectedEventFrameId && (
            <div className="p-4 text-center text-warning-foreground bg-warning/10 rounded-lg">
              <p>{t('tech_sheets.no_sheet_warning')}</p>
            </div>
          )
        )}
      </div>
    </CollapsibleSection>
  );
};

export default TechSheetsDisplay;