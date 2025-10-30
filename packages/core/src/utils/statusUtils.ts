import { Assignment, AssignmentStatus } from '../types';
import { formatDateRangeDMY } from './dateFormat';

export const getStatusSummaryText = (assignment: Assignment): string => {
  if (assignment.status !== AssignmentStatus.Mixed || !assignment.dailyStatuses) {
    return `(${assignment.status})`;
  }

  const datesByStatus: { [key in AssignmentStatus]?: string[] } = {};

  Object.entries(assignment.dailyStatuses).forEach(([date, status]) => {
    if (!datesByStatus[status as AssignmentStatus]) {
      datesByStatus[status as AssignmentStatus] = [];
    }
    datesByStatus[status as AssignmentStatus]!.push(date);
  });
  
  const parts = [] as string[];
  if (datesByStatus[AssignmentStatus.Yes]?.length) {
    parts.push(`Sí [${formatDateRangeDMY(datesByStatus[AssignmentStatus.Yes]!.join(','))}]`);
  }
  if (datesByStatus[AssignmentStatus.No]?.length) {
    parts.push(`No [${formatDateRangeDMY(datesByStatus[AssignmentStatus.No]!.join(','))}]`);
  }
  if (datesByStatus[AssignmentStatus.Pending]?.length) {
    parts.push(`Pendent [${formatDateRangeDMY(datesByStatus[AssignmentStatus.Pending]!.join(','))}]`);
  }

  if (parts.length === 0) {
     return `(${AssignmentStatus.Mixed})`;
  }

  return `(Mixt: ${parts.join(' ')})`;
};
