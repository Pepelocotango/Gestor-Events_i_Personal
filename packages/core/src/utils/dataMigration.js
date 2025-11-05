import { AssignmentStatus } from '../types';
import { formatDateDMY } from './dateFormat';
export const migrateData = (peopleData, eventData, assignmentData) => {
    const peopleGroups = (peopleData?.people || []).map(p => ({
        id: p.id.toString(),
        name: p.name,
        role: p.role || '',
        tel1: p.tel1 || '',
        tel2: p.tel2 || '',
        email: p.email || '',
        web: p.web || '',
        notes: p.notes || ''
    }));
    const eventFrames = (eventData?.eventFrames || []).map(e => {
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
        };
    });
    const assignments = (assignmentData?.assignments || []).map(a => ({
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
const convertOldStatus = (status) => {
    switch (status) {
        case 'Sí':
            return AssignmentStatus.Yes;
        case 'No':
            return AssignmentStatus.No;
        default:
            return AssignmentStatus.Pending;
    }
};
export const validateMigratedData = (data) => {
    const errors = [];
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
//# sourceMappingURL=dataMigration.js.map