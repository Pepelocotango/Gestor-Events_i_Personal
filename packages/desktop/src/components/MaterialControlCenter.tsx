import React, { useState, useMemo } from 'react';
import { useEventDataStore, selectMaterialControlData, selectAvailableOrigins, MaterialControlFilters as FiltersState, ShowToastFunction, exportMaterialControlSummaryPdf, exportMaterialControlDetailedPdf, exportMaterialControlCsv } from '@gep/core';
import MaterialControlFilters from './MaterialControlFilters';
import MaterialControlTable from './MaterialControlTable';
import Tooltip from './ui/Tooltip';
import { saveFileWithDialog } from '../utils/fileSaver';

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


  const handleExportSummaryPdf = async () => {
    if (filteredData.length === 0) {
        showToast('No hi ha dades per exportar.', 'warning');
        return;
    }
    try {
      const { pdfDoc, fileName } = exportMaterialControlSummaryPdf(filteredData);
      const pdfData = pdfDoc.output('arraybuffer');

      await saveFileWithDialog(
        {
          title: 'Desar Resum de Control de Material en PDF',
          defaultPath: fileName,
          filters: [{ name: 'Documents PDF', extensions: ['pdf'] }],
          data: pdfData,
        },
        showToast
      );
    } catch (error) {
      showToast(`Error en exportar a PDF: ${(error as Error).message}`, 'error');
    }
  };

  const handleExportDetailedPdf = async () => {
    if (filteredData.length === 0) {
      showToast('No hi ha dades per exportar.', 'warning');
      return;
    }

    const relevantEventIds = new Set<string>();
    filteredData.forEach(row => {
      row.breakdown.forEach(bd => {
        relevantEventIds.add(bd.eventFrameId);
      });
    });

    if (relevantEventIds.size === 0) {
      showToast('No hi ha cap esdeveniment associat a les dades filtrades per exportar.', 'warning');
      return;
    }

    const eventsToExport = eventFrames.filter(ef => relevantEventIds.has(ef.id));

    try {
      const { pdfDoc, fileName } = exportMaterialControlDetailedPdf(filteredData, eventsToExport);
      const pdfData = pdfDoc.output('arraybuffer');

      await saveFileWithDialog(
        {
          title: 'Desar Detall de Control de Material en PDF',
          defaultPath: fileName,
          filters: [{ name: 'Documents PDF', extensions: ['pdf'] }],
          data: pdfData,
        },
        showToast
      );
    } catch (error) {
      showToast(`Error en exportar a PDF: ${(error as Error).message}`, 'error');
    }
  };

  const handleExportCsv = async () => {
     if (filteredData.length === 0) {
        showToast('No hi ha dades per exportar.', 'warning');
        return;
    }
    try {
      const { csvContent, fileName } = exportMaterialControlCsv(filteredData);

      await saveFileWithDialog(
        {
          title: 'Desar Control de Material en CSV',
          defaultPath: fileName,
          filters: [{ name: 'CSV', extensions: ['csv'] }],
          data: csvContent,
        },
        showToast
      );
    } catch (error) {
      showToast(`Error en exportar a CSV: ${(error as Error).message}`, 'error');
    }
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
        <Tooltip text="Exporta un resum del control de material en format PDF.">
          <button
            onClick={handleExportSummaryPdf}
            className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            PDF Resum
          </button>
        </Tooltip>
        <Tooltip text="Exporta un informe detallat del control de material, incloent el desglossament per esdeveniment, en format PDF.">
          <button
            onClick={handleExportDetailedPdf}
            className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            PDF Detallat
          </button>
        </Tooltip>
        <Tooltip text="Exporta les dades del control de material en format CSV, compatible amb fulls de càlcul.">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1 text-sm rounded-md bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
            disabled={filteredData.length === 0}
          >
            CSV
          </button>
        </Tooltip>
      </div>

      {isUpdatingMaterial ? (
          <div className="text-center p-8 text-muted-foreground">Actualitzant dades de material...</div>
      ) : (
          <MaterialControlTable
            data={filteredData}
          />
      )}
    </div>
  );
};

export default MaterialControlCenter;
