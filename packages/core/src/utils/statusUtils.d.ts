import { Assignment } from '../types';
/**
 * Genera un text descriptiu per a l'estat d'una assignació.
 * Si l'estat és Mixt, agrupa les dates per estat i mostra els rangs.
 * @param assignment - L'objecte de l'assignació.
 * @returns Una cadena de text com "(Sí)" o "(Mixt: Sí [14/05-15/05] No [16/05])".
 */
export declare const getStatusSummaryText: (assignment: Assignment) => string;
//# sourceMappingURL=statusUtils.d.ts.map