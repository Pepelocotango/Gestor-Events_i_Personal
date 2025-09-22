import React, { useState, useMemo } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { selectMaterialControlData, selectAvailableOrigins, MaterialControlFilters as FiltersState } from '../stores/eventDataStore';
import { ShowToastFunction } from '../types';
import { exportMaterialControlSummaryPdf, exportMaterialControlDetailedPdf } from '../utils/pdfGenerator';
import { exportMaterialControlCsv } from '../utils/csvUtils';
import MaterialControlFilters from './MaterialControlFilters';
import MaterialControlTable from './MaterialControlTable';

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'name' | 'category' | 'origin';

interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}

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

  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([
    { key: 'name', direction: 'ascending' },
  ]);

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

    const sortedData = [...data].sort((a, b) => {
      for (const config of sortConfigs) {
        let aValue: string | number;
        let bValue: string | number;

        switch (config.key) {
          case 'name':
            aValue = a.item.name;
            bValue = b.item.name;
            break;
          case 'category':
            aValue = a.item.category;
            bValue = b.item.category;
            break;
          case 'origin':
            aValue = a.item.location;
            bValue = b.item.location;
            break;
          default:
            aValue = a.item.name;
            bValue = b.item.name;
        }

        if (aValue < bValue) {
          return config.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return config.direction === 'ascending' ? 1 : -1;
        }
      }
      return 0;
    });

    return sortedData;
  }, [eventFrames, materialItems, filters, isUpdatingMaterial, sortConfigs]);

  const requestSort = (key: SortableKeys) => {
    setSortConfigs(prevConfigs => {
      const existingConfigIndex = prevConfigs.findIndex(c => c.key === key);

      if (key === 'name') {
        // Si es clica "Nom", sempre es converteix en l'únic criteri
        const direction = (prevConfigs[0]?.key === 'name' && prevConfigs[0]?.direction === 'ascending') ? 'descending' : 'ascending';
        return [{ key: 'name', direction }];
      }

      let newConfigs = [...prevConfigs];

      if (existingConfigIndex === 0) {
        // Si es clica el criteri principal, només canvia la direcció
        newConfigs[0].direction = newConfigs[0].direction === 'ascending' ? 'descending' : 'ascending';
      } else {
        let newConfig: SortConfig = { key, direction: 'ascending' };
        if (existingConfigIndex > 0) {
          // Si ja existeix, el movem al principi
          newConfig = { ...newConfigs[existingConfigIndex], direction: 'ascending' };
          newConfigs.splice(existingConfigIndex, 1);
        }
        // El nou criteri es posa al principi
        newConfigs.unshift(newConfig);
      }

      // Assegurem que "name" sempre hi sigui com a últim desempat
      const hasNameSort = newConfigs.some(c => c.key === 'name');
      if (!hasNameSort) {
        newConfigs.push({ key: 'name', direction: 'ascending' });
      }

      // Limitem a un màxim de 2 criteris principals + el de nom
      return newConfigs.filter(c => c.key === key || c.key === prevConfigs[0]?.key || c.key === 'name').slice(0, 3);
    });
  };

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
            requestSort={requestSort}
            sortConfigs={sortConfigs}
          />
      )}
    </div>
  );
};

export default MaterialControlCenter;
