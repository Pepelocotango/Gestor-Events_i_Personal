import { AppData } from '../types';
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
export declare const migrateData: (peopleData?: OldPeopleData, eventData?: OldEventData, assignmentData?: OldAssignmentData) => AppData;
export declare const validateMigratedData: (data: AppData) => {
    isValid: boolean;
    errors: string[];
};
export {};
//# sourceMappingURL=dataMigration.d.ts.map