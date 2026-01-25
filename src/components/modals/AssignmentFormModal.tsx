import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../../stores/eventDataStore';
import { Assignment, AssignmentStatus, ShowToastFunction } from '../../types';
import { ASSIGNMENT_STATUS_OPTIONS } from '../../constants';
import { formatDateDMY } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { useModalStore } from '../../stores/modalStore';

interface AssignmentFormModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
  setExpandedEventFrameId?: (id: string) => void;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({ onClose, showToast, setExpandedEventFrameId }) => {
  const { t } = useTranslation();
  const { addAssignment, updateAssignment } = useEventDataStore.getState();
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const { data, updateModalData, openModal } = useModalStore();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!data || !data.eventFrame) {
    console.error("AssignmentFormModal rendered without necessary eventFrame data from modal store.");
    return null;
  }

  const isEditing = !!data.assignmentToEdit;

  // Define a comprehensive type for the form's data state
  type FormData = Partial<Omit<Assignment, 'id' | 'eventFrameId'>> & {
    personGroupId?: string;
    startDate?: string;
    endDate?: string;
    status?: AssignmentStatus;
    notes?: string;
    role?: string;
  };

  const formData: FormData = isEditing ? data.assignmentToEdit! : data;
  const eventFrame = data.eventFrame!;

  const [isEditingMixed, setIsEditingMixed] = useState(isEditing && formData.status === AssignmentStatus.Mixed);

  useEffect(() => {
    // This effect now only resets errors when the modal context changes.
    setErrors({});
  }, [isEditing, data.assignmentToEdit?.id, data.eventFrame?.id]);

  type EditableAssignmentFields = Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>;

  const handleFieldChange = (field: keyof EditableAssignmentFields, value: any) => {
    const newFormData = { ...formData, [field]: value };

    if (field === 'status' && isEditingMixed) {
      setIsEditingMixed(false);
    }

    if (isEditing) {
      updateModalData({ assignmentToEdit: newFormData as Assignment });
    } else {
      updateModalData({ [field]: value });
    }
  };

  const handlePersonChange = (personGroupId: string) => {
    handleFieldChange('personGroupId', personGroupId);
    const selectedPerson = peopleGroups.find(p => p.id === personGroupId);
    if (selectedPerson?.role && !formData.role) {
      handleFieldChange('role', selectedPerson.role);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.personGroupId) newErrors.personGroupId = t('modals.assignment_form.person_required');
    if (!formData.startDate) newErrors.startDate = t('modals.assignment_form.start_date_required');
    if (!formData.endDate) newErrors.endDate = t('modals.assignment_form.end_date_required');

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = t('modals.event_form.date_order_error');
      }
      if (new Date(formData.startDate) < new Date(eventFrame.startDate) || new Date(formData.endDate) > new Date(eventFrame.endDate)) {
        newErrors.datesRange = t('modals.assignment_form.date_range_error', { start: formatDateDMY(eventFrame.startDate), end: formatDateDMY(eventFrame.endDate) });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSubmit = (force = false) => {
    if (!validate()) return;

    const handleResult = (result: { success: boolean; message?: string; warningMessage?: string }) => {
      if (result.success) {
        if (result.warningMessage && result.warningMessage.startsWith('DUPLICATE_CONFLICT:')) {
          openModal('confirmDuplicate', {
            message: result.warningMessage.replace('DUPLICATE_CONFLICT:', ''),
            onConfirm: () => performSubmit(true),
          });
        } else {
          if (result.warningMessage) showToast(result.warningMessage, 'warning');
          showToast(isEditing ? t('modals.assignment_form.updated_toast') : t('modals.assignment_form.added_toast'), 'success');
          if (!isEditing && setExpandedEventFrameId) setExpandedEventFrameId(eventFrame.id);
          onClose();
        }
      } else if (result.message) {
        showToast(`${t('modals.assignment_form.error_prefix')}${result.message}`, 'error');
      }
    };

    if (isEditing) {
      let updatedData: Assignment = { ...formData } as Assignment;

      if (isEditingMixed && formData.status !== AssignmentStatus.Pending) {
        updatedData.status = formData.status!;
        updatedData.dailyStatuses = undefined;
      } else if (isEditingMixed) {
        updatedData.status = AssignmentStatus.Mixed;
      }

      const result = updateAssignment(updatedData, force);
      handleResult(result);
    } else {
      const assignmentData = {
        personGroupId: formData.personGroupId!,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        status: formData.status!,
        notes: formData.notes!,
        role: formData.role,
      };
      const result = addAssignment(eventFrame.id, assignmentData, force);
      handleResult(result);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSubmit(false);
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm disabled:opacity-50";

  const statusValue = isEditingMixed ? AssignmentStatus.Pending : formData.status;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="assignment-form-title">
      <h2 id="assignment-form-title" className="sr-only">
        {isEditing ? t('modals.assignment_form.title_edit') : t('modals.assignment_form.title_new')} {t('modals.assignment_form.title_suffix', { name: eventFrame.name })}
      </h2>
      {isEditingMixed && (
        <div className="p-3 bg-info/10 border-l-4 border-info rounded">
          <p className="text-sm text-info-foreground">
            {t('modals.assignment_form.mixed_status_warning')}
          </p>
        </div>
      )}
      <div>
        <label htmlFor="as-person" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.person_label')}</label>
        <Tooltip text={t('modals.assignment_form.person_tooltip')}>
          <select
            id="as-person"
            value={formData.personGroupId || ''}
            onChange={e => handlePersonChange(e.target.value)}
            className={commonInputClass}
            required
            disabled={peopleGroups.length === 0}
          >
            {peopleGroups.length === 0 ? <option value="" disabled>{t('modals.assignment_form.no_people_option')}</option> :
              <>
                <option value="" disabled>{t('modals.assignment_form.select_person_placeholder')}</option>
                {peopleGroups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </>
            }
          </select>
        </Tooltip>
        {errors.personGroupId && <p className="text-destructive text-xs mt-1">{errors.personGroupId}</p>}
      </div>
      <div>
        <label htmlFor="as-role" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.role_label')}</label>
        <Tooltip text={t('modals.assignment_form.role_tooltip')}>
          <input
            type="text"
            id="as-role"
            value={formData.role || ''}
            onChange={e => handleFieldChange('role', e.target.value)}
            className={commonInputClass}
            placeholder={t('modals.assignment_form.role_placeholder')}
          />
        </Tooltip>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="as-startDate" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.start_date_label')}</label>
          <Tooltip text={t('modals.assignment_form.start_date_tooltip')}>
            <input
              type="date"
              id="as-startDate"
              value={formData.startDate || ''}
              onChange={e => handleFieldChange('startDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {formData.startDate && <p className="text-xs text-primary mt-1"><span className="font-semibold">{t('modals.event_form.date_selected')}</span> {formatDateDMY(formData.startDate)}</p>}
          {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="as-endDate" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.end_date_label')}</label>
          <Tooltip text={t('modals.assignment_form.end_date_tooltip')}>
            <input
              type="date"
              id="as-endDate"
              value={formData.endDate || ''}
              onChange={e => handleFieldChange('endDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {formData.endDate && <p className="text-xs text-primary mt-1"><span className="font-semibold">{t('modals.event_form.date_selected')}</span> {formatDateDMY(formData.endDate)}</p>}
          {errors.endDate && <p className="text-destructive text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>
      {errors.datesRange && <p className="text-destructive text-xs text-center -mt-2">{errors.datesRange}</p>}
      <div>
        <label htmlFor="as-status" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.status_label')}</label>
        <Tooltip text={t('modals.assignment_form.status_tooltip')}>
          <select
            id="as-status"
            value={statusValue || ''}
            onChange={e => handleFieldChange('status', e.target.value as AssignmentStatus)}
            className={commonInputClass}
          >
            {ASSIGNMENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
          </select>
        </Tooltip>
      </div>
      <div>
        <label htmlFor="as-notes" className="block text-sm font-medium text-muted-foreground">{t('modals.assignment_form.notes_label')}</label>
        <AutosizeTextarea
          id="as-notes"
          value={formData.notes || ''}
          onChange={e => handleFieldChange('notes', e.target.value)}
          rows={3}
          className={`${commonInputClass} resize-none overflow-hidden`}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Tooltip text={t('modals.assignment_form.cancel_tooltip')}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80">{t('common.cancel')}</button>
        </Tooltip>
        <Tooltip text={isEditing ? t('modals.assignment_form.save_edit_tooltip') : t('modals.assignment_form.create_new_tooltip')}>
          <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={peopleGroups.length === 0 && !isEditing}>{isEditing ? t('common.save') : t('modals.event_form.create_button')}</button>
        </Tooltip>
      </div>
    </form>
  );
};

export default AssignmentFormModal;