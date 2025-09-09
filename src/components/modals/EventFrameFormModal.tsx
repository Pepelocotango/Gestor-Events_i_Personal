import React, { useState, FormEvent } from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { EventFrame, ShowToastFunction } from '../../types';
import { formatDateDMY } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';

interface EventFrameFormProps {
  onClose: () => void;
  showToast: ShowToastFunction;
  eventFrameToEdit?: Partial<EventFrame>;
  initialData?: any;
}

export const EventFrameFormModal: React.FC<EventFrameFormProps> = ({ onClose, eventFrameToEdit, showToast }) => {
  const { addEventFrame, updateEventFrame } = useEventDataStore.getState();
  const eventFrames = useEventDataStore(state => state.eventFrames);

  const { setFormData, openModal } = useModalStore.getState();
  const { name, place, startDate, endDate, generalNotes, errors = {} } = useModalStore(state => state.formData) as Partial<EventFrame> & { errors?: {[key: string]: string} };

  const [eventNameDatalistId] = useState(() => `event-name-datalist-${Math.random().toString(36).substring(2,9)}`);
  const [locationDatalistId] = useState(() => `location-datalist-${Math.random().toString(36).substring(2,9)}`);

  const validate = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!(name || '').trim()) newErrors.name = "El nom és obligatori.";
    if (!startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!endDate) newErrors.endDate = "La data de fi és obligatòria.";
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = "La data de fi ha de ser posterior o igual a la data d'inici.";
    }
    setFormData(prev => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const eventData = { name: name!, place: place || '', startDate: startDate!, endDate: endDate!, generalNotes: generalNotes || '' };
    if (eventFrameToEdit && eventFrameToEdit.id) { 
      updateEventFrame({ ...eventFrameToEdit, ...eventData } as EventFrame); 
      showToast("Marc d'esdeveniment actualitzat.", 'success');
    } else {
      addEventFrame(eventData);
      showToast("Marc d'esdeveniment afegit.", 'success');
    }
    onClose();
  };

   const handleCreateAndAssign = () => {
    if (!validate()) return;

    if (eventFrameToEdit && eventFrameToEdit.id) {
      onClose();
      openModal('addAssignment', { eventFrame: eventFrameToEdit as EventFrame });
    } else {
      const eventData = { name: name!, place: place || '', startDate: startDate!, endDate: endDate!, generalNotes: generalNotes || '' };
      const newEventFrame: EventFrame = addEventFrame(eventData); 
      showToast("Marc d'esdeveniment afegit.", 'success');
      onClose(); 
      openModal('addAssignment', { eventFrame: newEventFrame }); 
    }
  };
  const commonInputClass = "mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
  
  const uniqueEventNames = Array.from(new Set(eventFrames.map(ef => ef.name).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean)));

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-labelledby="event-frame-form-title" id="event-frame-form-modal-actual-form">
      <h2 id="event-frame-form-title" className="sr-only">{eventFrameToEdit && eventFrameToEdit.id ? 'Formulari Edició Marc Esdeveniment' : 'Formulari Nou Marc Esdeveniment'}</h2>
      <div>
        <label htmlFor="ef-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'Esdeveniment</label>
        <Tooltip text="Nom principal de l'esdeveniment">
          <input type="text" id="ef-name" value={name || ''} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className={commonInputClass} required aria-required="true" list={eventNameDatalistId}/>
        </Tooltip>
        <datalist id={eventNameDatalistId}>
            {uniqueEventNames.map(n => <option key={n} value={n} />)}
        </datalist>
        {errors.name && <p className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="ef-place" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lloc (Opcional)</label>
        <Tooltip text="Ubicació o lloc de l'esdeveniment">
          <input type="text" id="ef-place" value={place || ''} onChange={e => setFormData(prev => ({ ...prev, place: e.target.value }))} className={commonInputClass} list={locationDatalistId} />
        </Tooltip>
        <datalist id={locationDatalistId}>
            {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label htmlFor="ef-startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data d'Inici</label>
          <Tooltip text="Data d'inici del marc d'esdeveniment">
            <input type="date" id="ef-startDate" value={startDate || ''} onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className={commonInputClass} required aria-required="true" placeholder="dd/mm/yyyy" />
          </Tooltip>
          {startDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(startDate)}</p>}
          {errors.startDate && <p className="text-red-500 text-xs mt-1" role="alert">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="ef-endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fi</label>
          <Tooltip text="Data de fi del marc d'esdeveniment">
            <input type="date" id="ef-endDate" value={endDate || ''} onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className={commonInputClass} required aria-required="true" placeholder="dd/mm/yyyy" />
          </Tooltip>
          {endDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-1"><span className="font-semibold">Data seleccionada:</span> {formatDateDMY(endDate)}</p>}
          {errors.endDate && <p className="text-red-500 text-xs mt-1" role="alert">{errors.endDate}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ef-generalNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes Generals (Opcional)</label>
        <Tooltip text="Anotacions generals sobre l'esdeveniment">
          <textarea id="ef-generalNotes" value={generalNotes || ''} onChange={e => setFormData(prev => ({ ...prev, generalNotes: e.target.value }))} rows={3} className={commonInputClass}></textarea>
        </Tooltip>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Tooltip text="Tancar el formulari sense desar">
          <button type="button" onClick={onClose} className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md border border-gray-300 dark:border-gray-500">Cancel·lar</button>
        </Tooltip>
        {!eventFrameToEdit?.id && (
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
        <Tooltip text={eventFrameToEdit && eventFrameToEdit.id ? 'Desar els canvis del marc' : 'Crear el nou marc d\'esdeveniment'}>
          <button type="submit" className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">{eventFrameToEdit && eventFrameToEdit.id ? 'Actualitzar' : 'Crear'}</button>
        </Tooltip>
      </div>
    </form>
  );
};

export default EventFrameFormModal;