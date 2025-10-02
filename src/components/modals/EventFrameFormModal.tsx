import React, { useState, useEffect, FormEvent } from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { EventFrame, ShowToastFunction, AssignmentStatus } from '../../types';
import { formatDateDMY } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';
import AutosizeTextarea from '../ui/AutosizeTextarea';

interface EventFrameFormModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

export const EventFrameFormModal: React.FC<EventFrameFormModalProps> = ({ onClose, showToast }) => {
  const { addEventFrame, updateEventFrame, showAndHighlightEvent } = useEventDataStore.getState();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const { data, updateModalData, openModal } = useModalStore();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [eventNameDatalistId] = useState(() => `event-name-datalist-${Math.random().toString(36).substring(2, 9)}`);
  const [locationDatalistId] = useState(() => `location-datalist-${Math.random().toString(36).substring(2, 9)}`);

  if (!data) {
    return null; // Should not happen if modal is open
  }

  const isEditing = !!data.eventFrameToEdit;
  const formData = isEditing ? data.eventFrameToEdit! : data;

  useEffect(() => {
    setErrors({});
  }, [isEditing, data.eventFrameToEdit?.id]);

  type EditableEventFrameFields = Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet' | 'googleEventId' | 'googleCalendarId' | 'lastModified' | 'lastSync'>;

  const handleFieldChange = (field: keyof EditableEventFrameFields, value: any) => {
    const newFormData = { ...formData, [field]: value };
    if (isEditing) {
      updateModalData({ eventFrameToEdit: newFormData as EventFrame });
    } else {
      updateModalData({ [field]: value });
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) newErrors.name = "El nom és obligatori.";
    if (!formData.startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!formData.endDate) newErrors.endDate = "La data de fi és obligatòria.";
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = "La data de fi ha de ser posterior o igual a la data d'inici.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const eventData = { name: formData.name!, place: formData.place || '', startDate: formData.startDate!, endDate: formData.endDate!, generalNotes: formData.generalNotes || '' };
    if (isEditing) {
      updateEventFrame({ ...data.eventFrameToEdit, ...eventData } as EventFrame);
      showToast("Marc d'esdeveniment actualitzat.", 'success');
    } else {
      addEventFrame(eventData);
      showToast("Marc d'esdeveniment afegit.", 'success');
    }
    onClose();
  };

   const handleCreateAndAssign = () => {
    if (!validate()) return;
    const peopleGroups = useEventDataStore.getState().peopleGroups;

    if (isEditing) {
      onClose();
      // Since it's already created, we can just open the assignment modal
      openModal('addAssignment', { eventFrame: data.eventFrameToEdit as EventFrame });
    } else {
      const eventData = { name: formData.name!, place: formData.place || '', startDate: formData.startDate!, endDate: formData.endDate!, generalNotes: formData.generalNotes || '' };
      const newEventFrame: EventFrame = addEventFrame(eventData); 
      showToast("Marc d'esdeveniment afegit.", 'success');
      onClose(); 
      openModal('addAssignment', {
        eventFrame: newEventFrame,
        // Pre-fill assignment form as well
        personGroupId: peopleGroups[0]?.id || '',
        startDate: newEventFrame.startDate,
        endDate: newEventFrame.endDate,
        status: AssignmentStatus.Pending,
        notes: '',
      });
    }
  };
  const commonInputClass = "mt-1 block w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
  
  const uniqueEventNames = Array.from(new Set(eventFrames.map(ef => ef.name).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean)));

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-labelledby="event-frame-form-title" id="event-frame-form-modal-actual-form">
      <h2 id="event-frame-form-title" className="sr-only">{isEditing ? 'Formulari Edició Marc Esdeveniment' : 'Formulari Nou Marc Esdeveniment'}</h2>
      <div>
        <label htmlFor="ef-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'Esdeveniment</label>
        <Tooltip text="Nom principal de l'esdeveniment">
          <input type="text" id="ef-name" value={formData.name || ''} onChange={e => handleFieldChange('name', e.target.value)} className={commonInputClass} required aria-required="true" list={eventNameDatalistId}/>
        </Tooltip>
        <datalist id={eventNameDatalistId}>
            {uniqueEventNames.map(n => <option key={n} value={n} />)}
        </datalist>
        {errors.name && <p className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="ef-place" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lloc (Opcional)</label>
        <Tooltip text="Ubicació o lloc de l'esdeveniment">
          <input type="text" id="ef-place" value={formData.place || ''} onChange={e => handleFieldChange('place', e.target.value)} className={commonInputClass} list={locationDatalistId} />
        </Tooltip>
        <datalist id={locationDatalistId}>
            {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label htmlFor="ef-startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data d'Inici</label>
          <Tooltip text="Data d'inici del marc d'esdeveniment">
            <input type="date" id="ef-startDate" value={formData.startDate || ''} onChange={e => handleFieldChange('startDate', e.target.value)} className={commonInputClass} required aria-required="true" placeholder="dd/mm/yyyy" />
          </Tooltip>
          {formData.startDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(formData.startDate)}</p>}
          {errors.startDate && <p className="text-red-500 text-xs mt-1" role="alert">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="ef-endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fi</label>
          <Tooltip text="Data de fi del marc d'esdeveniment">
            <input type="date" id="ef-endDate" value={formData.endDate || ''} onChange={e => handleFieldChange('endDate', e.target.value)} className={commonInputClass} required aria-required="true" placeholder="dd/mm/yyyy" />
          </Tooltip>
          {formData.endDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(formData.endDate)}</p>}
          {errors.endDate && <p className="text-red-500 text-xs mt-1" role="alert">{errors.endDate}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ef-generalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes Generals (Opcional)</label>
        <Tooltip text="Anotacions generals sobre l'esdeveniment">
          <AutosizeTextarea id="ef-generalNotes" value={formData.generalNotes || ''} onChange={e => handleFieldChange('generalNotes', e.target.value)} rows={3} className={`${commonInputClass} resize-none overflow-hidden`} />
        </Tooltip>
      </div>
      <div className="flex justify-between items-center pt-2">
        <div>
          {isEditing && (
            <Tooltip text="Ressaltar aquest marc a la llista principal">
              <button
                type="button"
                onClick={() => {
                  if (data.eventFrameToEdit?.id) {
                    showAndHighlightEvent(data.eventFrameToEdit.id);
                  }
                  // No tanquem el modal per evitar condicions de cursa
                }}
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Mostrar a la llista
              </button>
            </Tooltip>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Tooltip text="Tancar el formulari sense desar">
            <button type="button" onClick={onClose} className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md border border-gray-300 dark:border-gray-500">Cancel·lar</button>
          </Tooltip>
          {!isEditing && (
            <Tooltip text="Crear el marc i obrir directament el formulari d'assignació">
              <button
                type="button"
                onClick={handleCreateAndAssign}
                className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Crear i Assignar
              </button>
            </Tooltip>
          )}
          <Tooltip text={isEditing ? 'Desar els canvis del marc' : 'Crear el nou marc d\'esdeveniment'}>
            <button type="submit" className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">{isEditing ? 'Actualitzar' : 'Crear'}</button>
          </Tooltip>
        </div>
      </div>
    </form>
  );
};

export default EventFrameFormModal;