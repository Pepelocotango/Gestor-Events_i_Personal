/**
 * =============================================================================
 * SUMMARIES DISPLAY
 * =============================================================================
 * DESCRIPCIÓ:
 * Component per mostrar informes i resums estadístics de l'aplicació.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i selectors.
 * - COMPONENT PRINCIPAL: SummariesDisplay amb informes.
 * - ESTAT I FILTRATGE: Estat de filtres aplicats.
 * - RENDERITZAT: Estructura amb SummaryReports.
 * =============================================================================
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { selectFilteredEventFrames } from '../utils/selectors';
import SummaryReports from './SummaryReports';
import CollapsibleSection from './ui/CollapsibleSection';
import { ChartBarIcon } from '../constants';
import { ShowToastFunction } from '../types';

interface SummariesDisplayProps {
  showToast: ShowToastFunction;
}

const SummariesDisplay: React.FC<SummariesDisplayProps> = ({ showToast }) => {
  const { t } = useTranslation();

  const eventFrames = useEventDataStore(state => state.eventFrames);
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const filterText = useEventDataStore(state => state.filterText);
  const filterStatus = useEventDataStore(state => state.filterStatus);
  const filterDate = useEventDataStore(state => state.filterDate);
  const localFilterUIPerson = useEventDataStore(state => state.localFilterUIPerson);
  const filterPlace = useEventDataStore(state => state.filterPlace);
  const filterUIEventFrame = useEventDataStore(state => state.filterUIEventFrame);

  const [showArchived, setShowArchived] = useState(false);

  const filteredEventFrames = useMemo(() => {
    return selectFilteredEventFrames({
      eventFrames,
      peopleGroups,
      filterText,
      filterStatus,
      filterDate,
      localFilterUIPerson,
      filterPlace,
      filterUIEventFrame,
      showArchived,
    });
  }, [
    eventFrames,
    peopleGroups,
    filterText,
    filterStatus,
    filterDate,
    localFilterUIPerson,
    filterPlace,
    filterUIEventFrame,
    showArchived,
  ]);

  const filteredAndSortedEventFrames = useMemo(() => {
    return [...filteredEventFrames].sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [filteredEventFrames]);

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title={t('main.summaries')}
        icon={<ChartBarIcon />}
        defaultOpen={true}
        id="summary-section"
      >
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="summary-showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
            />
            <label htmlFor="summary-showArchived" className="ml-2 text-sm font-medium text-foreground">
              {t('main.show_archived')}
            </label>
          </div>
        </div>
        <SummaryReports
          setToastMessage={showToast}
          filteredEventFrames={filteredAndSortedEventFrames}
          activeFilters={{
            filterText,
            filterStatus,
            filterDate,
            localFilterUIPerson,
            filterPlace,
            filterUIEventFrame,
          }}
        />
      </CollapsibleSection>
    </div>
  );
};

export default SummariesDisplay;
