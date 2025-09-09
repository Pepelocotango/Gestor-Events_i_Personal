import React, { useState, useEffect, FormEvent } from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { EventFrame, Assignment, AssignmentStatus, ShowToastFunction } from '../../types';
import { ASSIGNMENT_STATUS_OPTIONS } from '../../constants';
import { formatDateDMY } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';

interface AssignmentFormProps {
  onClose: () => void;
  showToast: ShowToastFunction;
  eventFrame: EventFrame;
  assignmentToEdit?: Assignment;
  setExpandedEventFrameId?: (id: string) => void;
}

export const AssignmentFormModal: React.FC<AssignmentFormProps> = React.memo(({ onClose, eventFrame, assignmentToEdit, showToast, setExpandedEventFrameId }) => {
  const { addAssignment, updateAssignment } = useEventDataStore.getState();
  const peopleGroups = useEventDataStore(state => state.peopleGroups);

  const { setFormData, openModal } = useModalStore.getState();
  const formData = useModalStore(state => state.formData);
  const { personGroupId, startDate, endDate, status, notes } = formData as Partial<Assignment>;
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isEditingMixed, setIsEditingMixed] = useState(false);

  useEffect(() => {
    if (assignmentToEdit) {
      if (assignmentToEdit.status === AssignmentStatus.Mixed) {
        setIsEditingMixed(true);
        // Ensure status in formData is a valid selectable value, not 'Mixed'
        setFormData(prev => ({ ...prev, status: AssignmentStatus.Pending }));
      } else {
        setIsEditingMixed(false);
      }
    }
    setErrors({});
  }, [assignmentToEdit]);

  const validate = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!personGroupId) newErrors.personGroupId = "Cal seleccionar una persona o grup.";
    const currentStartDate = startDate || eventFrame.startDate;
    const currentEndDate = endDate || eventFrame.endDate;
    if (!currentStartDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!currentEndDate) newErrors.endDate = "La data de fi és obligatòria.";
    if (new Date(currentStartDate) > new Date(currentEndDate)) {
      newErrors.endDate = "La data de fi ha de ser posterior o igual a la data d'inici.";
    }
    if (new Date(currentStartDate) < new Date(eventFrame.startDate) || new Date(currentEndDate) > new Date(eventFrame.endDate)) {
      newErrors.datesRange = `Les dates han d'estar dins del rang del marc (${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSubmit = (force = false) => {
    if (!validate()) return;

    const handleResult = (result: { success: boolean; message?: string; warningMessage?: string }, isUpdate: boolean) => {
      if (result.success) {
        if (result.warningMessage && result.warningMessage.startsWith('DUPLICATE_CONFLICT:')) {
          openModal('confirmDuplicate', {
            message: result.warningMessage.replace('DUPLICATE_CONFLICT:', ''),
            onConfirm: () => performSubmit(true),
          });
        } else {
          if (result.warningMessage) showToast(result.warningMessage, 'warning');
          showToast(isUpdate ? "Assignació actualitzada." : "Assignació afegida.", 'success');
          if (!isUpdate && setExpandedEventFrameId) setExpandedEventFrameId(eventFrame.id);
          onClose();
        }
      } else if (result.message) {
        showToast(`Error: ${result.message}`, 'error');
      }
    };

    if (assignmentToEdit) {
      const updatedData: Assignment = {
        ...assignmentToEdit,
        personGroupId: personGroupId!,
        startDate: startDate!,
        endDate: endDate!,
        notes: notes!,
        status: isEditingMixed ? AssignmentStatus.Mixed : status!,
        dailyStatuses: isEditingMixed ? assignmentToEdit.dailyStatuses : undefined
      };
      
      if (isEditingMixed && status !== AssignmentStatus.Pending) {
        updatedData.status = status!;
        updatedData.dailyStatuses = undefined;
      }
      
      const result = updateAssignment(updatedData, force);
      handleResult(result, true);

    } else {
      const assignmentData = { personGroupId: personGroupId!, startDate: startDate!, endDate: endDate!, status: status!, notes: notes! };
      const result = addAssignment(eventFrame.id, assignmentData, force);
      handleResult(result, false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSubmit(false);
  };

  const handleInputChange = (field: keyof Assignment, value: any) => {
    setFormData(prev => {
        if (prev[field] === value) return prev; // Avoid unnecessary updates
        return { ...prev, [field]: value };
    });
};

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="assignment-form-title">
      <h2 id="assignment-form-title" className="sr-only">{assignmentToEdit ? 'Formulari Edició Assignació' : 'Formulari Nova Assignació'} per {eventFrame.name}</h2>
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
            value={personGroupId || ''}
            onChange={e => handleInputChange('personGroupId', e.target.value)}
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
              value={startDate || ''}
              onChange={e => handleInputChange('startDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {startDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(startDate)}</p>}
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="as-endDate" className="block text-sm font-medium">Data de Fi</label>
          <Tooltip text="Data de fi de l'assignació">
            <input
              type="date"
              id="as-endDate"
              value={endDate || ''}
              onChange={e => handleInputChange('endDate', e.target.value)}
              className={commonInputClass}
              required
            />
          </Tooltip>
          {endDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(endDate)}</p>}
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>
      {errors.datesRange && <p className="text-red-500 text-xs text-center -mt-2">{errors.datesRange}</p>}
      <div>
        <label htmlFor="as-status" className="block text-sm font-medium">Estat</label>
        <Tooltip text="Estat general de l'assignació">
          <select id="as-status" value={status || AssignmentStatus.Pending} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as AssignmentStatus }))} className={commonInputClass}>
            {ASSIGNMENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Tooltip>
      </div>
      <div>
        <label htmlFor="as-notes" className="block text-sm font-medium">Notes (Opcional)</label>
        <textarea id="as-notes" value={notes || ''} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} className={commonInputClass}></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Tooltip text="Tancar el formulari sense desar canvis">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300">Cancel·lar</button>
        </Tooltip>
        <Tooltip text={assignmentToEdit ? 'Desar els canvis de l\'assignació' : 'Crear la nova assignació'}>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md" disabled={peopleGroups.length === 0 && !assignmentToEdit}>{assignmentToEdit ? 'Actualitzar' : 'Crear'}</button>
        </Tooltip>
      </div>
    </form>
  );
});

// Add a custom comparison function to prevent re-renders unless props change significantly
function areEqual(prevProps: AssignmentFormProps, nextProps: AssignmentFormProps) {
    return (
        prevProps.onClose === nextProps.onClose &&
        prevProps.eventFrame.id === nextProps.eventFrame.id &&
        prevProps.assignmentToEdit?.id === nextProps.assignmentToEdit?.id &&
        prevProps.showToast === nextProps.showToast &&
        prevProps.setExpandedEventFrameId === nextProps.setExpandedEventFrameId
    );
}

export default React.memo(AssignmentFormModal, areEqual);