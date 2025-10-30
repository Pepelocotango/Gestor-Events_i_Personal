import { EventFrame } from '../types';
import { formatDateDMY } from './dateFormat';

// Tipus per a l'objecte de filtres, extret de l'estat de Zustand
export type ActiveFilters = {
  filterText?: string | null;
  filterStatus?: string | null;
  filterDate?: string | null;
  localFilterUIPerson?: string | null;
  filterPlace?: string | null;
  filterUIEventFrame?: string | null;
};

// Funció auxiliar per a formatar un rang de dates a partir de les dades
const formatDateRangeFromData = (data: EventFrame[]): string => {
  if (!data || data.length === 0) {
    return 'Sense_Dates';
  }

  const sortedFrames = [...data].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const startDate = sortedFrames[0].startDate;
  const endDate = [...data].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0].endDate;

  if (startDate === endDate) {
    return formatDateDMY(startDate);
  }

  return `De_${formatDateDMY(startDate)}_a_${formatDateDMY(endDate)}`;
};

/**
 * Genera un descriptor intel·ligent per al nom del fitxer basat en els filtres actius.
 */
const generateSmartDescriptor = (filters: ActiveFilters, data: EventFrame[]): string => {
  // Use the provided data (event frames) rather than reaching into a global store.
  if (filters.filterUIEventFrame) {
    const eventName = data.find((ef: EventFrame) => ef.id === filters.filterUIEventFrame)?.name;
    return `Esdeveniment_${eventName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Desconegut'}`;
  }

  if (filters.localFilterUIPerson) {
    // We don't have direct access to peopleGroups in this helper (no global store here).
    // Try to infer a name from the provided event frames (search assignments), else fall back to the id.
    let inferredName: string | undefined;
    for (const ef of data) {
      const assignment = ef.assignments.find((a: any) => a.personGroupId === filters.localFilterUIPerson);
      if (assignment) {
        inferredName = assignment.personGroupId; // fallback to id if no mapping available
        break;
      }
    }
    const personLabel = inferredName || filters.localFilterUIPerson;
    return `Persona_${personLabel?.toString().replace(/[^a-zA-Z0-9]/g, '-') || 'Desconegut'}`;
  }

  if (filters.filterDate) {
    return `Data_${formatDateDMY(filters.filterDate)}`;
  }

  const isAnyFilterActive = filters.filterText || filters.filterStatus || filters.filterPlace;
  if (!isAnyFilterActive) {
    return formatDateRangeFromData(data);
  }

  return `Seleccio_Filtrada`;
};

export const generateFileName = (
  prefix: string,
  filters: ActiveFilters,
  data: EventFrame[],
  extension: 'pdf' | 'csv'
): string => {
  const descriptor = generateSmartDescriptor(filters, data);

  const hasSecondaryFilters = !!(filters.filterText || filters.filterPlace || filters.filterStatus);
  const secondaryIndicator = (filters.filterUIEventFrame || filters.localFilterUIPerson || filters.filterDate) && hasSecondaryFilters
    ? '_+Filtres'
    : '';

  const finalDescriptor = `${descriptor}${secondaryIndicator}`;

  const saneDescriptor = finalDescriptor.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `${prefix}_${saneDescriptor}.${extension}`;
};

export const generateTechSheetFileName = (eventName: string, eventDateOrRange: string): string => {
    const saneEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const saneDate = eventDateOrRange.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Fitxa_Bolo_${saneEventName}_${saneDate}.pdf`;
};
