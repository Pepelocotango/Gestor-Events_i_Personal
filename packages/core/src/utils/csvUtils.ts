import { EventFrame, PersonGroup, Assignment, MaterialControlRow } from '../types';
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

export const exportEventListToCsv = (
  eventFrames: EventFrame[],
  peopleGroups: PersonGroup[],
  activeFilters: ActiveFilters
) => {
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

  const fileName = generateFileName('Llista_Esdeveniments', activeFilters, eventFrames, 'csv');

  return { csvContent: "\uFEFF" + csvContent, fileName };
};

export const exportMaterialControlCsv = (
  data: MaterialControlRow[]
) => {
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

  return { csvContent, fileName };
};
