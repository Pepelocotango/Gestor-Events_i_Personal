import React, { useState, useEffect, FormEvent } from 'react';
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
  const { addAssignment, updateAssignment } = useEventDataStore.getState();
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const { data, updateModalData, openModal } = useModalStore();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!data || !data.eventFrame) {
    console.error("AssignmentFormModal rendered without necessary eventFrame data from modal store.");
    return null;
  }

  const isEditing = !!data.assignmentToEdit;
  const formData = isEditing ? data.assignmentToEdit! : data;
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

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.personGroupId) newErrors.personGroupId = "Cal seleccionar una persona o grup.";
    if (!formData.startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!formData.endDate) newErrors.endDate = "La data de fi és obligatòria.";

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "La data de fi ha de ser posterior o igual a la data d'inici.";
      }
      if (new Date(formData.startDate) < new Date(eventFrame.startDate) || new Date(formData.endDate) > new Date(eventFrame.endDate)) {
        newErrors.datesRange = `Les dates han d'estar dins del rang del marc (${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}).`;
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
          showToast(isEditing ? "Assignació actualitzada." : "Assignació afegida.", 'success');
          if (!isEditing && setExpandedEventFrameId) setExpandedEventFrameId(eventFrame.id);
          onClose();
        }
      } else if (result.message) {
        showToast(`Error: ${result.message}`, 'error');
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
          notes: formData.notes!
      };
      const result = addAssignment(eventFrame.id, assignmentData, force);
      handleResult(result);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSubmit(false);
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";

  const statusValue = isEditingMixed ? AssignmentStatus.Pending : formData.status;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="assignment-form-title">
      <h2 id="assignment-form-title" className="sr-only">{isEditing ? 'Formulari Edició Assignació' : 'Formulari Nova Assignació'} per {eventFrame.name}</h2>
      {isEditingMixed && (
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 dark:border-blue-400 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Aquesta assignació té estats diaris personalitzats. Canviar l'estat aquí sobreescriurà tots els estats diaris amb el nou valor seleccionat.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="as-person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona/Grup</label>
        <Tooltip text="Seleccionar la persona o grup a assignar">
          <select
            id="as-person"
            value={formData.personGroupId || ''}
            onChange={e => handleFieldChange('personGroupId', e.target.value)}
            className={commonInputClass}
            required
            disabled={peopleGroups.length === 0}
          >
            {peopleGroups.length === 0 ? <option value="" disabled>No hi ha persones/grups</option> :
              <>
                <option value="" disabled>Selecciona una persona o grup</option>
                {peopleGroups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </>
            }
          </select>
        </Tooltip>
        {errors.personGroupId && <p className="text-red-500 text-xs mt-1">{errors.personGroupId}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="as-startDate" className="block text-sm font-medium">Data d'Inici</label>
          <Tooltip text="Data d'inici de l'assignació">
            <input
              type="date"
              id="as-startDate"
              value={formData.startDate || ''}
              onChange={e => handleFieldChange('startDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {formData.startDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(formData.startDate)}</p>}
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="as-endDate" className="block text-sm font-medium">Data de Fi</label>
          <Tooltip text="Data de fi de l'assignació">
            <input
              type="date"
              id="as-endDate"
              value={formData.endDate || ''}
              onChange={e => handleFieldChange('endDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {formData.endDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(formData.endDate)}</p>}
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>
      {errors.datesRange && <p className="text-red-500 text-xs text-center -mt-2">{errors.datesRange}</p>}
      <div>
        <label htmlFor="as-status" className="block text-sm font-medium">Estat</label>
        <Tooltip text="Estat general de l'assignació">
          <select
            id="as-status"
            value={statusValue || ''}
            onChange={e => handleFieldChange('status', e.target.value as AssignmentStatus)}
            className={commonInputClass}
          >
            {ASSIGNMENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Tooltip>
      </div>
      <div>
        <label htmlFor="as-notes" className="block text-sm font-medium">Notes (Opcional)</label>
        <AutosizeTextarea
            id="as-notes"
            value={formData.notes || ''}
            onChange={e => handleFieldChange('notes', e.target.value)}
            rows={3}
            className={`${commonInputClass} resize-none overflow-hidden`}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Tooltip text="Tancar el formulari sense desar canvis">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300">Cancel·lar</button>
        </Tooltip>
        <Tooltip text={isEditing ? 'Desar els canvis de l\'assignació' : 'Crear la nova assignació'}>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md" disabled={peopleGroups.length === 0 && !isEditing}>{isEditing ? 'Actualitzar' : 'Crear'}</button>
        </Tooltip>
      </div>
    </form>
  );
};

export default AssignmentFormModal;