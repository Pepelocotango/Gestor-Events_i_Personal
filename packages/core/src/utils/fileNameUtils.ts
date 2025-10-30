import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame } from '../types';
import { formatDateDMY } from './dateFormat';

// Tipus per a l'objecte de filtres, extret de l'estat de Zustand
type ActiveFilters = {
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
 * @param filters - L'objecte que conté tots els filtres actius.
 * @param data - El conjunt de dades (EventFrame[]) que s'exportarà.
 * @returns Un string que descriu el contingut basat en els filtres.
 */
const generateSmartDescriptor = (filters: ActiveFilters, data: EventFrame[]): string => {
  const { peopleGroups, eventFrames } = useEventDataStore.getState();

  // Prioritat Alta: Filtres més restrictius i comuns
  if (filters.filterUIEventFrame) {
    const eventName = eventFrames.find(ef => ef.id === filters.filterUIEventFrame)?.name;
    return `Esdeveniment_${eventName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Desconegut'}`;
  }

  if (filters.localFilterUIPerson) {
    const personName = peopleGroups.find(p => p.id === filters.localFilterUIPerson)?.name;
    return `Persona_${personName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Desconegut'}`;
  }

  if (filters.filterDate) {
    return `Data_${formatDateDMY(filters.filterDate)}`;
  }

  // Comportament sense filtres prioritaris: Descriure el rang de dates
  const isAnyFilterActive = filters.filterText || filters.filterStatus || filters.filterPlace;
  if (!isAnyFilterActive) {
    return formatDateRangeFromData(data);
  }

  // Si hi ha filtres secundaris però no primaris, retorna un descriptor genèric
  return `Seleccio_Filtrada`;
};

/**
 * Funció principal per a construir el nom complet del fitxer d'exportació.
 * @param prefix - El prefix del fitxer (p. ex., 'Llista_Esdeveniments', 'Resum_Per_Persona').
 * @param filters - L'objecte amb l'estat dels filtres actius.
 * @param data - Les dades que s'exportaran, per a determinar el rang de dates si no hi ha filtres.
 * @param extension - L'extensió del fitxer (p. ex., 'pdf', 'csv').
 * @returns El nom de fitxer complet i sanejat.
 */
export const generateFileName = (
  prefix: string,
  filters: ActiveFilters,
  data: EventFrame[],
  extension: 'pdf' | 'csv'
): string => {
  const descriptor = generateSmartDescriptor(filters, data);

  // Comprova si s'han aplicat filtres secundaris (menys específics)
  const hasSecondaryFilters = !!(filters.filterText || filters.filterPlace || filters.filterStatus);
  const secondaryIndicator = (filters.filterUIEventFrame || filters.localFilterUIPerson || filters.filterDate) && hasSecondaryFilters
    ? '_+Filtres'
    : '';

  const finalDescriptor = `${descriptor}${secondaryIndicator}`;

  // Neteja final per a assegurar un nom de fitxer vàlid
  const saneDescriptor = finalDescriptor.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `${prefix}_${saneDescriptor}.${extension}`;
};

/**
 * Genera el nom de fitxer per a la Fitxa de Bolo.
 * Aquest format és especial i no depèn dels filtres generals.
 * @param eventName - El nom de l'esdeveniment.
 * @param eventDateOrRange - La data o rang de dates de l'esdeveniment.
 * @returns El nom de fitxer formatejat.
 */
export const generateTechSheetFileName = (eventName: string, eventDateOrRange: string): string => {
    const saneEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const saneDate = eventDateOrRange.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `Fitxa_Bolo_${saneEventName}_${saneDate}.pdf`;
};
