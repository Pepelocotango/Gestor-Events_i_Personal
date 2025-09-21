import { EventFrame, PersonGroup, Assignment, ShowToastFunction, MaterialControlRow } from '../types';
import { getStatusSummaryText } from './statusUtils';

export const escapeCsvCell = (cellData: string | number | boolean | undefined | null): string => {
  if (cellData === undefined || cellData === null) return '';
  const stringData = String(cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

export const exportEventListToCsv = async (
  eventFrames: EventFrame[],
  peopleGroups: PersonGroup[],
  showToast: ShowToastFunction
) => {
  try {
    const headers = [
      'Nom Esdeveniment',
      'Lloc',
      'Data Inici Esdeveniment',
      'Data Fi Esdeveniment',
      'Personal Assignat',
      'Data Inici Assignació',
      'Data Fi Assignació',
      'Estat Assignació',
      'Notes Assignació',
      'Notes Generals Esdeveniment'
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

    const fileName = `Llista_Esdeveniments_${new Date().toISOString().slice(0, 10)}.csv`;

    if (window.electronAPI?.showSaveDialog) {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Desar CSV',
        defaultPath: fileName,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        data: csvContent,
      });
      if (result.success) {
        showToast('CSV desat amb èxit!', 'success');
      } else if (!result.canceled) {
        showToast(`Error en desar el CSV: ${result.message}`, 'error');
      }
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
  showToast: ShowToastFunction
) => {
  try {
    const headers = ['Nom', 'Categoria', 'Origen', 'Demanada', 'Estoc', 'Balanç', 'Notes'];

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
