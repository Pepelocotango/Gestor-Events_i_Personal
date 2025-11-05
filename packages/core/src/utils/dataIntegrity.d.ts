import { AppData } from '../types';
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    type: 'broken_assignment_reference';
    message: string;
    assignmentId: string;
    eventFrameId: string;
    personGroupId: string;
}
export declare const validateData: (data: AppData) => ValidationResult;
export interface RepairResult {
    repairedData: AppData;
    fixes: string[];
}
export declare const repairData: (data: AppData, errors: ValidationError[]) => RepairResult;
//# sourceMappingURL=dataIntegrity.d.ts.map