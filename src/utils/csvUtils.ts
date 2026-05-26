/**
 * =============================================================================
 * CSV UTILS
 * =============================================================================
 * DESCRIPCIÓ:
 * Funcions per a l'exportació de dades a format CSV (esdeveniments, material, performances).
 *
 * ÍNDEX:
 * - IMPORTS I TIPUS: Llibreries i definicions de tipus per a l'exportació CSV.
 * - FUNCIONS D'EXPORTACIÓ CSV: exportPerformanceRiderToCsv, exportEventListToCsv, exportMaterialControlCsv.
 * =============================================================================
 */

import { EventFrame, PersonGroup, Assignment, ShowToastFunction, MaterialControlRow, Performance } from '../types';
import { TFunction } from 'i18next';
import { getStatusSummaryText } from './statusUtils';
import { generateFileName } from './fileNameUtils';

// Define ActiveFilters type locally for this module
type ActiveFilters = {
  filterText?: string | null;
  filterStatus?: string | null;
  filterDate?: string | null;
  localFilterUIPerson?: string | null;
  filterPlace?: string | null;
  filterUIEventFrame?: string | null;
};

export const escapeCsvCell = (cellData: string | number | boolean | undefined | null): string => {
  if (cellData === undefined || cellData === null) return '';
  const stringData = String(cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

export const exportPerformanceRiderToCsv = async (
  performance: Performance,
  showToast: ShowToastFunction,
  t: TFunction
) => {
  try {
    const techData = performance.techData;
    if (!techData) {
      showToast('No hi ha dades tècniques per exportar.', 'info');
      return;
    }

    const csvRows: string[] = [];

    // --- SECCIÓ INPUTS ---
    if (techData.inputList && techData.inputList.length > 0) {
      csvRows.push(escapeCsvCell('--- INPUT LIST ---'));
      csvRows.push([
        t('pdf.patch'),
        t('pdf.channel'),
        t('pdf.label'),
        t('pdf.mic_rider'),
        t('pdf.mic_contra'),
        t('pdf.stand'),
        t('pdf.notes'),
        'Exclusive'
      ].join(','));

      techData.inputList.forEach(input => {
        csvRows.push([
          escapeCsvCell(input.patchNumber),
          escapeCsvCell(input.channel),
          escapeCsvCell(input.label),
          escapeCsvCell(input.micRider),
          escapeCsvCell(input.micContra),
          escapeCsvCell(input.stand),
          escapeCsvCell(input.extres || input.notes),
          escapeCsvCell(input.exclusive ? 'YES' : 'NO')
        ].join(','));
      });
      csvRows.push(''); // Línia buida separadora
    }

    // --- SECCIÓ MONITORS ---
    if (techData.monitorList && techData.monitorList.length > 0) {
      csvRows.push(escapeCsvCell('--- MONITOR LIST ---'));
      csvRows.push([
        t('pdf.patch'),
        t('pdf.output_channel'),
        t('pdf.label'),
        t('pdf.monitor_rider'),
        t('pdf.monitor_contra'),
        t('pdf.monitor_stand'),
        t('pdf.notes'),
        'Exclusive'
      ].join(','));

      techData.monitorList.forEach(monitor => {
        csvRows.push([
          escapeCsvCell(monitor.patchNumber),
          escapeCsvCell(monitor.outputChannel),
          escapeCsvCell(monitor.label),
          escapeCsvCell(monitor.mixRider),
          escapeCsvCell(monitor.mixContra),
          escapeCsvCell(monitor.mixStand),
          escapeCsvCell(monitor.notes),
          escapeCsvCell(monitor.exclusive ? 'YES' : 'NO')
        ].join(','));
      });
      csvRows.push('');
    }

    // --- CABLEJAT I SPARE ---
    if ((techData.cableList && techData.cableList.length > 0) || (techData.spareList && techData.spareList.length > 0)) {
      csvRows.push(escapeCsvCell('--- ADDITIONAL MATERIAL ---'));
      csvRows.push([t('pdf.qty'), t('pdf.material'), t('pdf.notes'), 'Type'].join(','));
      
      techData.cableList?.forEach(item => {
        csvRows.push([escapeCsvCell(item.qty), escapeCsvCell(item.itemName), escapeCsvCell(item.notes), 'Cable'].join(','));
      });
      techData.spareList?.forEach(item => {
        csvRows.push([escapeCsvCell(item.qty), escapeCsvCell(item.itemName), escapeCsvCell(item.notes), 'Spare'].join(','));
      });
    }

    const csvContent = csvRows.join('\n');
    const fileName = `${performance.name.replace(/[^a-zA-Z0-9]/g, '_')}_Rider.csv`;

    if (window.electronAPI?.showSaveDialog) {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Desar CSV',
        defaultPath: fileName,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        data: "\uFEFF" + csvContent,
        isDocumentSave: false,
      });
      if (result.success) {
        showToast('CSV desat amb èxit!', 'success');
      } else if (!result.canceled) {
        showToast(`Error en desar el CSV: ${result.message}`, 'error');
      }
    } else {
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Rider exportat a CSV amb èxit!', 'success');
    }
  } catch (error) {
    showToast(`Error generant CSV: ${(error as Error).message}`, 'error');
  }
};

export const exportEventListToCsv = async (
  eventFrames: EventFrame[],
  peopleGroups: PersonGroup[],
  showToast: ShowToastFunction,
  activeFilters: ActiveFilters,
  t: TFunction
) => {
  try {
    const headers = [
      t('csv.header_event_name'),
      t('csv.header_place'),
      t('csv.header_event_start_date'),
      t('csv.header_event_end_date'),
      t('csv.header_assigned_person'),
      t('csv.header_assignment_start_date'),
      t('csv.header_assignment_end_date'),
      t('csv.header_assignment_status'),
      t('csv.header_assignment_notes'),
      t('csv.header_event_notes')
    ];

    const rows = eventFrames.flatMap(ef => {
      if (ef.assignments.length === 0) {
        return [[
          escapeCsvCell(ef.name),
          escapeCsvCell(ef.place),
          escapeCsvCell(ef.startDate),
          escapeCsvCell(ef.endDate),
          escapeCsvCell(''), // No assigned person
          escapeCsvCell(''), // No assignment start date
          escapeCsvCell(''), // No assignment end date
          escapeCsvCell(''), // No assignment status
          escapeCsvCell(''), // No assignment notes
          escapeCsvCell(ef.generalNotes),
        ]];
      }
      return ef.assignments.map((a: Assignment) => {
        const person = peopleGroups.find(p => p.id === a.personGroupId);
        return [
          escapeCsvCell(ef.name),
          escapeCsvCell(ef.place),
          escapeCsvCell(ef.startDate),
          escapeCsvCell(ef.endDate),
          escapeCsvCell(person ? person.name : 'N/A'),
          escapeCsvCell(a.startDate),
          escapeCsvCell(a.endDate),
          escapeCsvCell(getStatusSummaryText(a)),
          escapeCsvCell(a.notes),
          escapeCsvCell(ef.generalNotes),
        ];
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = generateFileName('Llista_Esdeveniments', activeFilters, eventFrames, 'csv');

    if (window.electronAPI?.showSaveDialog) {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Desar CSV',
        defaultPath: fileName,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        data: "\uFEFF" + csvContent,
        isDocumentSave: false, // Indica al backend que això NO és un desat de document
      });
      if (result.success) {
        showToast('CSV desat amb èxit!', 'success');
      } else if (!result.canceled) {
        showToast(`Error en desar el CSV: ${result.message}`, 'error');
      }
    } else {
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Llista exportada a CSV amb èxit!', 'success');
    }
  } catch (error) {
    showToast(`Error generant CSV: ${(error as Error).message}`, 'error');
  }
};

export const exportMaterialControlCsv = async (
  data: MaterialControlRow[],
  showToast: ShowToastFunction,
  t: TFunction
) => {
  try {
    const headers = [
      t('mcc.header_name'),
      t('mcc.header_category'),
      t('mcc.header_origin'),
      t('mcc.header_demanded'),
      t('mcc.header_stock'),
      t('mcc.header_balance'),
      t('mcc.header_notes')
    ];

    const rows = data.map(row => [
      escapeCsvCell(row.item.name),
      escapeCsvCell(row.item.category),
      escapeCsvCell(row.item.location),
      escapeCsvCell(row.totalDemand),
      escapeCsvCell(row.item.stock),
      escapeCsvCell(row.balance),
      escapeCsvCell(row.item.notes),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `Control_Material_${new Date().toISOString().slice(0, 10)}.csv`;

    if (window.electronAPI?.showSaveDialog) {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Desar CSV',
        defaultPath: fileName,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        data: csvContent,
        isDocumentSave: false, // Indica al backend que això NO és un desat de document
      });
      if (result.success) {
        showToast('CSV desat amb èxit!', 'success');
      } else if (!result.canceled) {
        showToast(`Error en desar el CSV: ${result.message}`, 'error');
      }
    } else {
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Dades exportades a CSV amb èxit!', 'success');
    }
  } catch (error) {
    showToast(`Error generant CSV: ${(error as Error).message}`, 'error');
  }
};
