import i18next from 'i18next';
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

export const validateData = (data: AppData): ValidationResult => {
  const errors: ValidationError[] = [];
  const eventFrameIds = new Set(data.eventFrames.map(ef => ef.id));
  const personGroupIds = new Set(data.peopleGroups.map(pg => pg.id));

  (data.assignments || []).forEach(assignment => {
    if (!eventFrameIds.has(assignment.eventFrameId)) {
      errors.push({
        type: 'broken_assignment_reference',
        message: i18next.t('common.data_integrity.error_event_not_found', { id: assignment.id, targetId: assignment.eventFrameId }),
        assignmentId: assignment.id,
        eventFrameId: assignment.eventFrameId,
        personGroupId: assignment.personGroupId,
      });
    }
    if (!personGroupIds.has(assignment.personGroupId)) {
      errors.push({
        type: 'broken_assignment_reference',
        message: i18next.t('common.data_integrity.error_person_not_found', { id: assignment.id, targetId: assignment.personGroupId }),
        assignmentId: assignment.id,
        eventFrameId: assignment.eventFrameId,
        personGroupId: assignment.personGroupId,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export interface RepairResult {
  repairedData: AppData;
  fixes: string[];
}

export const repairData = (data: AppData, errors: ValidationError[]): RepairResult => {
  const repairedData = { ...data };
  const fixes: string[] = [];
  const assignmentsToRemove = new Set<string>();

  errors.forEach(error => {
    if (error.type === 'broken_assignment_reference') {
      if (!assignmentsToRemove.has(error.assignmentId)) {
        assignmentsToRemove.add(error.assignmentId);
        fixes.push(i18next.t('common.data_integrity.fix_removed_assignment', { id: error.assignmentId }));
      }
    }
  });

  if (assignmentsToRemove.size > 0) {
    repairedData.assignments = (repairedData.assignments || []).filter(
      assignment => !assignmentsToRemove.has(assignment.id)
    );
  }

  return {
    repairedData,
    fixes,
  };
};
