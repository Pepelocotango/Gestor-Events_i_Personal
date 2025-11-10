import { AppData, PersonGroup, EventFrameForExport, Assignment, AssignmentStatus } from '../types';

interface OldPeopleData {
  people: {
    id: number;
    name: string;
    role?: string;
    tel1?: string;
    tel2?: string;
    email?: string;
    web?: string;
    notes?: string;
  }[];
}

interface OldEventData {
  eventFrames: {
    id: number;
    eventName: string;
    location?: string;
    generalStartDate: string;
    generalEndDate: string | null;
    notesGeneral?: string;
    isPersonnelComplete?: boolean;
  }[];
}

interface OldAssignmentData {
  assignments: {
    id: number;
    eventFrameId: number;
    personId: number;
    assignmentStartDate: string;
    assignmentEndDate: string | null;
    status?: 'Sí' | 'No' | 'Pendent';
    notesAssignment?: string;
  }[];
}

import { formatDateDMY } from './dateFormat';

export const migrateData = (
  peopleData?: OldPeopleData,
  eventData?: OldEventData,
  assignmentData?: OldAssignmentData
): AppData => {
  const peopleGroups: PersonGroup[] = (peopleData?.people || []).map(p => ({
    id: p.id.toString(),
    name: p.name,
    role: p.role || '',
    tel1: p.tel1 || '',
    tel2: p.tel2 || '',
    email: p.email || '',
    web: p.web || '',
    notes: p.notes || ''
  }));

  const eventFrames: EventFrameForExport[] = (eventData?.eventFrames || []).map(e => {
    const eventFrame = {
      id: e.id.toString(),
      name: e.eventName,
      place: e.location || '',
      startDate: e.generalStartDate,
      endDate: e.generalEndDate || e.generalStartDate,
      generalNotes: e.notesGeneral || '',
      personnelComplete: e.isPersonnelComplete || false,
    };
    return {
      ...eventFrame,
      techSheet: {
        eventName: eventFrame.name,
        location: eventFrame.place || '',
        date: formatDateDMY(eventFrame.startDate),
        showTime: '',
        showDuration: '',
        technicalProviders: [],
        lightingNeeds: [],
        soundNeeds: [],
        videoNeeds: [],
        machineryNeeds: [],
      }
    }
  });

  const assignments: Assignment[] = (assignmentData?.assignments || []).map(a => ({
    id: a.id.toString(),
    eventFrameId: a.eventFrameId.toString(),
    personGroupId: a.personId.toString(),
    startDate: a.assignmentStartDate,
    endDate: a.assignmentEndDate || a.assignmentStartDate,
    status: convertOldStatus(a.status),
    notes: a.notesAssignment || ''
  }));

  return {
    peopleGroups,
    eventFrames,
    assignments,
    materialItems: []
  };
};

const convertOldStatus = (status?: string): AssignmentStatus => {
  switch (status) {
    case 'Sí':
      return AssignmentStatus.Yes;
    case 'No':
      return AssignmentStatus.No;
    default:
      return AssignmentStatus.Pending;
  }
};

export const validateMigratedData = (data: AppData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.peopleGroups || !Array.isArray(data.peopleGroups)) {
    errors.push("El format de les dades de persones és invàlid.");
  }

  if (!data.eventFrames || !Array.isArray(data.eventFrames)) {
    errors.push("El format de les dades d'esdeveniments és invàlid.");
  }

  if (!data.assignments || !Array.isArray(data.assignments)) {
    errors.push("El format de les dades d'assignacions és invàlid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
