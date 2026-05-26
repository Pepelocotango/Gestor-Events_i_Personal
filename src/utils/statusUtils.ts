/**
 * =============================================================================
 * STATUS UTILS
 * =============================================================================
 * DESCRIPCIÓ:
 * Utilitats per formatar i mostrar estats d'assignació, incloent estats mixts.
 *
 * ÍNDEX:
 * - FUNCIÓ D'ESTAT: getStatusSummaryText per generar text descriptiu d'estats.
 * =============================================================================
 */

import { Assignment, AssignmentStatus } from '../types';
import { formatDateRanges } from './dateRangeFormatter';

/**
 * Genera un text descriptiu per a l'estat d'una assignació.
 * Si l'estat és Mixt, agrupa les dates per estat i mostra els rangs.
 * @param assignment - L'objecte de l'assignació.
 * @param t - Funció de traducció opcional.
 * @returns Una cadena de text com "(Sí)" o "(Mixt: Sí [14/05-15/05] No [16/05])".
 */
export const getStatusSummaryText = (assignment: Assignment, t?: (key: string) => string): string => {
  const translate = (key: string, fallback: string) => t ? t(key) : fallback;

  if (assignment.status !== AssignmentStatus.Mixed || !assignment.dailyStatuses) {
    const statusKey = `status.${Object.keys(AssignmentStatus).find(k => (AssignmentStatus as any)[k] === assignment.status)?.toLowerCase()}`;
    return `(${translate(statusKey, assignment.status)})`;
  }

  const datesByStatus: { [key in AssignmentStatus]?: string[] } = {};

  Object.entries(assignment.dailyStatuses).forEach(([date, status]) => {
    if (!datesByStatus[status]) {
      datesByStatus[status] = [];
    }
    datesByStatus[status]!.push(date);
  });

  const parts = [];
  if (datesByStatus[AssignmentStatus.Yes]?.length) {
    parts.push(`${translate('status.yes', 'Sí')} [${formatDateRanges(datesByStatus[AssignmentStatus.Yes])}]`);
  }
  if (datesByStatus[AssignmentStatus.No]?.length) {
    parts.push(`${translate('status.no', 'No')} [${formatDateRanges(datesByStatus[AssignmentStatus.No])}]`);
  }
  if (datesByStatus[AssignmentStatus.Pending]?.length) {
    parts.push(`${translate('status.pending', 'Pendent')} [${formatDateRanges(datesByStatus[AssignmentStatus.Pending])}]`);
  }

  if (parts.length === 0) {
    return `(${translate('status.mixed', AssignmentStatus.Mixed)})`; // Fallback per si no hi ha estats diaris
  }

  return `(${translate('status.mixed', 'Mixt')}: ${parts.join(' ')})`;
};
