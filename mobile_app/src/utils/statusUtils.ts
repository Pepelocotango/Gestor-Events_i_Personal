import { AssignmentStatus } from '../types';

export const getStatusColor = (status: AssignmentStatus) => {
  switch (status) {
    case AssignmentStatus.Yes: return '#4CAF50'; // Green
    case AssignmentStatus.Pending: return '#FFC107'; // Amber
    case AssignmentStatus.No: return '#F44336'; // Red
    case AssignmentStatus.Mixed: return '#2196F3'; // Blue
    default: return '#333'; // Default dark grey
  }
};

export const getTranslatedStatus = (status: AssignmentStatus, t: any) => {
  switch (status) {
    case AssignmentStatus.Yes: return t('common.status.yes');
    case AssignmentStatus.No: return t('common.status.no');
    case AssignmentStatus.Pending: return t('common.status.pending');
    case AssignmentStatus.Mixed: return t('common.status.mixed');
    default: return status;
  }
};
