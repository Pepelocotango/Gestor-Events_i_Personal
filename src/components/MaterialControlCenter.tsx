import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { selectMaterialControlData, selectAvailableOrigins, MaterialControlFilters as FiltersState } from '../stores/eventDataStore';
import { ShowToastFunction } from '../types';
import { exportMaterialControlSummaryPdf, exportMaterialControlDetailedPdf } from '../utils/pdfGenerator';
import { exportMaterialControlCsv } from '../utils/csvUtils';
import MaterialControlFilters from './MaterialControlFilters';
import MaterialControlTable from './MaterialControlTable';
import Tooltip from './ui/Tooltip';

interface MaterialControlCenterProps {
  showToast: ShowToastFunction;
}

const MaterialControlCenter: React.FC<MaterialControlCenterProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const materialItems = useEventDataStore(state => state.materialItems);
  const isUpdatingMaterial = useEventDataStore(state => state.isUpdatingMaterial);

  const [filters, setFilters] = useState<FiltersState>({
    dateRange: { start: '', end: '' },
    selectedEventIds: [],
    selectedOrigins: [],
    selectedCategories: [],
    searchText: '',
  });

  const allOrigins = useMemo(() => selectAvailableOrigins({ materialItems } as any), [materialItems]);
  const allCategories = useMemo(() => {
    const categories = new Set(materialItems.map(item => item.category));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [materialItems]);

  const filteredData = useMemo(() => {
    if (isUpdatingMaterial) {
      return [];
    }
    const data = selectMaterialControlData({ eventFrames, materialItems } as any, filters);

    // Centralized sorting: 1. Category, 2. Origin, 3. Name
    const sortedData = [...data].sort((a, b) => {
      const categoryComparison = a.item.category.localeCompare(b.item.category);
      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      const originComparison = a.item.location.localeCompare(b.item.location);
      if (originComparison !== 0) {
        return originComparison;
      }

      return a.item.name.localeCompare(b.item.name);
    });

    return sortedData;
  }, [eventFrames, materialItems, filters, isUpdatingMaterial]);


  const handleExportSummaryPdf = () => {
    if (filteredData.length === 0) {
      showToast(t('mcc.no_data_toast'), 'warning');
      return;
    }
    exportMaterialControlSummaryPdf(filteredData, showToast);
  };

  const handleExportDetailedPdf = () => {
    if (filteredData.length === 0) {
      showToast(t('mcc.no_data_toast'), 'warning');
      return;
    }

    // Deduce relevant events from the filtered data that is being displayed
    const relevantEventIds = new Set<string>();
    filteredData.forEach(row => {
      row.breakdown.forEach(bd => {
        relevantEventIds.add(bd.eventFrameId);
      });
    });

    if (relevantEventIds.size === 0) {
      showToast(t('mcc.no_events_toast'), 'warning');
      return;
    }

    const eventsToExport = eventFrames.filter(ef => relevantEventIds.has(ef.id));

    exportMaterialControlDetailedPdf(filteredData, eventsToExport, showToast);
  };

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      showToast(t('mcc.no_data_toast'), 'warning');
      return;
    }
    exportMaterialControlCsv(filteredData, showToast);
  };

  const activeEventFrames = useMemo(() => {
    return eventFrames.filter(ef => ef.isArchived !== true);
  }, [eventFrames]);

  return (
    <div className="space-y-4">
      <MaterialControlFilters
        filters={filters}
        setFilters={setFilters}
        availableOrigins={allOrigins}
        availableCategories={allCategories}
        eventFrames={activeEventFrames}
        dateRange={filters.dateRange}
      />

      <div className="flex justify-end space-x-2">
        <Tooltip text={t('mcc.summary_pdf_tooltip')}>
          <button
            onClick={handleExportSummaryPdf}
            className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            {t('mcc.summary_pdf_button')}
          </button>
        </Tooltip>
        <Tooltip text={t('mcc.detailed_pdf_tooltip')}>
          <button
            onClick={handleExportDetailedPdf}
            className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            {t('mcc.detailed_pdf_button')}
          </button>
        </Tooltip>
        <Tooltip text={t('mcc.csv_tooltip')}>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1 text-sm rounded-md bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            {t('mcc.csv_button')}
          </button>
        </Tooltip>
      </div>

      {isUpdatingMaterial ? (
        <div className="text-center p-8 text-muted-foreground">{t('mcc.updating_data')}</div>
      ) : (
        <MaterialControlTable
          data={filteredData}
        />
      )}
    </div>
  );
};

export default MaterialControlCenter;