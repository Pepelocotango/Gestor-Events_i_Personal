import React, { useState, useMemo } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { selectMaterialControlData, selectAvailableOrigins, MaterialControlFilters as FiltersState } from '../stores/eventDataStore';
import { ShowToastFunction } from '../types';
import { exportMaterialControlSummaryPdf, exportMaterialControlDetailedPdf } from '../utils/pdfGenerator';
import { exportMaterialControlCsv } from '../utils/csvUtils';
import MaterialControlFilters from './MaterialControlFilters';
import MaterialControlTable from './MaterialControlTable';


interface MaterialControlCenterProps {
  showToast: ShowToastFunction;
}

const MaterialControlCenter: React.FC<MaterialControlCenterProps> = ({ showToast }) => {
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
        // Retorna un estat de càrrega o les dades anteriors mentre s'actualitza
        return []; // o un estat de càrrega més explícit
    }
    return selectMaterialControlData({ eventFrames, materialItems } as any, filters);
  }, [eventFrames, materialItems, filters, isUpdatingMaterial]);

  const handleExportSummaryPdf = () => {
    if (filteredData.length === 0) {
        showToast('No hi ha dades per exportar.', 'warning');
        return;
    }
    exportMaterialControlSummaryPdf(filteredData, showToast);
  };

  const handleExportDetailedPdf = () => {
     if (filteredData.length === 0) {
        showToast('No hi ha dades per exportar.', 'warning');
        return;
    }
    const relevantEventIds = new Set(filters.selectedEventIds);
    const eventsToExport = relevantEventIds.size > 0
        ? eventFrames.filter(ef => relevantEventIds.has(ef.id))
        : eventFrames; // o potser tots els esdeveniments rellevants de `filteredData`?

    exportMaterialControlDetailedPdf(filteredData, eventsToExport, showToast);
  };

  const handleExportCsv = () => {
     if (filteredData.length === 0) {
        showToast('No hi ha dades per exportar.', 'warning');
        return;
    }
    exportMaterialControlCsv(filteredData, showToast);
  };

  return (
    <div className="space-y-4">
      <MaterialControlFilters
        filters={filters}
        setFilters={setFilters}
        availableOrigins={allOrigins}
        availableCategories={allCategories}
        eventFrames={eventFrames}
        dateRange={filters.dateRange}
      />

      <div className="flex justify-end space-x-2">
        <button
          onClick={handleExportSummaryPdf}
          className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
          disabled={filteredData.length === 0}
        >
          PDF Resum
        </button>
        <button
          onClick={handleExportDetailedPdf}
          className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
          disabled={filteredData.length === 0}
        >
          PDF Detallat
        </button>
        <button
          onClick={handleExportCsv}
          className="px-3 py-1 text-sm rounded-md bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
          disabled={filteredData.length === 0}
        >
          CSV
        </button>
      </div>

      {isUpdatingMaterial ? (
          <div className="text-center p-8">Actualitzant dades de material...</div>
      ) : (
          <MaterialControlTable
            data={filteredData}
          />
      )}
    </div>
  );
};

export default MaterialControlCenter;
