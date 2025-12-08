import { EventFrame, Assignment, AssignmentStatus, PersonGroup } from '../types';

// --- Funcions d'ajuda per a dates ---

const formatSimpleDMY = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatRangeDMY = (start: string, end: string): string => {
  return `${formatSimpleDMY(start)} - ${formatSimpleDMY(end)}`;
};

const areDatesConsecutive = (dateStr1: string, dateStr2: string): boolean => {
  const d1 = new Date(dateStr1);
  d1.setUTCHours(0, 0, 0, 0);
  d1.setDate(d1.getDate() + 1);
  return d1.toISOString().split('T')[0] === dateStr2;
}

const formatSimpleDM = (dateStr: string): string => {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
};

export const formatDateRanges = (dates: string[]): string => {
  if (!dates || dates.length === 0) {
    return '';
  }
  const sortedDates = [...dates].sort();
  
  const ranges: string[] = [];
  let i = 0;
  while (i < sortedDates.length) {
    let rangeStart = sortedDates[i];
    let rangeEnd = sortedDates[i];
    let j = i;

    while (j + 1 < sortedDates.length && areDatesConsecutive(sortedDates[j], sortedDates[j + 1])) {
      rangeEnd = sortedDates[j + 1];
      j++;
    }

    if (rangeStart === rangeEnd) {
      ranges.push(formatSimpleDM(rangeStart));
    } else {
      ranges.push(`${formatSimpleDM(rangeStart)}-${formatSimpleDM(rangeEnd)}`);
    }
    
    i = j + 1;
  }
  
  return ranges.join(', ');
};

// --- Funció per obtenir el resum de l'estat ---

const getStatusSummaryText = (assignment: Assignment): string => {
  if (assignment.status !== AssignmentStatus.Mixed || !assignment.dailyStatuses) {
    return `(${assignment.status})`;
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
    parts.push(`Sí [${formatDateRanges(datesByStatus[AssignmentStatus.Yes])}]`);
  }
  if (datesByStatus[AssignmentStatus.No]?.length) {
    parts.push(`No [${formatDateRanges(datesByStatus[AssignmentStatus.No])}]`);
  }
  if (datesByStatus[AssignmentStatus.Pending]?.length) {
    parts.push(`Pendent [${formatDateRanges(datesByStatus[AssignmentStatus.Pending])}]`);
  }

  if (parts.length === 0) {
     return `(${AssignmentStatus.Mixed})`;
  }

  return `(Mixt: ${parts.join(' ')})`;
};

// --- Funció principal de format ---

export const formatEventFrameForGoogleCalendar = (eventFrame: EventFrame, peopleGroups: PersonGroup[]): string => {
  const descriptionParts: string[] = [];

  // Lloc i Dates
  if (eventFrame.place) {
    descriptionParts.push(`Lloc: ${eventFrame.place}`);
  }
  const dateRange = eventFrame.startDate === eventFrame.endDate
    ? formatSimpleDMY(eventFrame.startDate)
    : formatRangeDMY(eventFrame.startDate, eventFrame.endDate);
  descriptionParts.push(`Dates: ${dateRange}`);

  // Separador
  descriptionParts.push('---');

  // Notes Generals
  if (eventFrame.generalNotes) {
    descriptionParts.push('NOTES GENERALS:');
    descriptionParts.push(eventFrame.generalNotes);
    descriptionParts.push('---');
  }

  // Assignacions
  descriptionParts.push(`ASSIGNACIONS (${eventFrame.assignments.length}):`);
  if (eventFrame.assignments.length > 0) {
    const sortedAssignments = [...eventFrame.assignments].sort((a, b) => {
      const personA = peopleGroups.find(p => p.id === a.personGroupId)?.name || '';
      const personB = peopleGroups.find(p => p.id === b.personGroupId)?.name || '';
      return personA.localeCompare(personB);
    });

    sortedAssignments.forEach(assign => {
      const person = peopleGroups.find(p => p.id === assign.personGroupId);
      const assignDateRange = assign.startDate === assign.endDate
        ? formatSimpleDMY(assign.startDate)
        : formatRangeDMY(assign.startDate, assign.endDate);
      
      let assignmentLine = `- ${person?.name || 'N/A'}: ${assignDateRange} ${getStatusSummaryText(assign)}`;
      if (assign.notes) {
        assignmentLine += `\n  Nota: ${assign.notes}`;
      }
      descriptionParts.push(assignmentLine);
    });
  } else {
    descriptionParts.push('No hi ha assignacions per aquest esdeveniment.');
  }

  return descriptionParts.join('\n');
};
