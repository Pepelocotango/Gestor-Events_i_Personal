import { EventFrame } from '../types';
type ActiveFilters = {
    filterText?: string | null;
    filterStatus?: string | null;
    filterDate?: string | null;
    localFilterUIPerson?: string | null;
    filterPlace?: string | null;
    filterUIEventFrame?: string | null;
};
/**
 * Funció principal per a construir el nom complet del fitxer d'exportació.
 * @param prefix - El prefix del fitxer (p. ex., 'Llista_Esdeveniments', 'Resum_Per_Persona').
 * @param filters - L'objecte amb l'estat dels filtres actius.
 * @param data - Les dades que s'exportaran, per a determinar el rang de dates si no hi ha filtres.
 * @param extension - L'extensió del fitxer (p. ex., 'pdf', 'csv').
 * @returns El nom de fitxer complet i sanejat.
 */
export declare const generateFileName: (prefix: string, filters: ActiveFilters, data: EventFrame[], extension: "pdf" | "csv") => string;
/**
 * Genera el nom de fitxer per a la Fitxa de Bolo.
 * Aquest format és especial i no depèn dels filtres generals.
 * @param eventName - El nom de l'esdeveniment.
 * @param eventDateOrRange - La data o rang de dates de l'esdeveniment.
 * @returns El nom de fitxer formatejat.
 */
export declare const generateTechSheetFileName: (eventName: string, eventDateOrRange: string) => string;
export {};
//# sourceMappingURL=fileNameUtils.d.ts.map