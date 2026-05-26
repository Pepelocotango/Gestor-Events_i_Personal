/**
 * =============================================================================
 * EVENT FRAME FORM MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal de formulari per afegir/editar esdeveniments.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i components UI.
 * - COMPONENT PRINCIPAL: EventFrameFormModal amb formulari d'esdeveniment.
 * - ESTAT I VALIDACIÓ: Estat de formulari i validació.
 * - HANDLERS: Gestió de canvis i enviament.
 * - RENDERITZAT: Estructura de formulari amb camps.
 * =============================================================================
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    if (!formData.name?.trim()) newErrors.name = t('modals.event_form.name_required');
    if (!formData.startDate) newErrors.startDate = t('modals.event_form.start_date_required');
    if (!formData.endDate) newErrors.endDate = t('modals.event_form.end_date_required');
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = t('modals.event_form.date_order_error');
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
      showToast(t('modals.event_form.updated_toast'), 'success');
    } else {
      addEventFrame(eventData);
      showToast(t('modals.event_form.added_toast'), 'success');
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
      showToast(t('modals.event_form.added_toast'), 'success');
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
  const commonInputClass = "mt-1 block w-full px-2 py-1 bg-input text-foreground border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring sm:text-sm disabled:opacity-50";

  const uniqueEventNames = Array.from(new Set(eventFrames.map(ef => ef.name).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean)));

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-labelledby="event-frame-form-title" id="event-frame-form-modal-actual-form">
      <h2 id="event-frame-form-title" className="sr-only">{isEditing ? t('modals.event_form.title_edit') : t('modals.event_form.title_new')}</h2>
      <div>
        <label htmlFor="ef-name" className="block text-sm font-medium text-foreground">{t('modals.event_form.name_label')}</label>
        <Tooltip text={t('modals.event_form.name_tooltip')}>
          <input type="text" id="ef-name" value={formData.name || ''} onChange={e => handleFieldChange('name', e.target.value)} className={commonInputClass} required aria-required="true" list={eventNameDatalistId} />
        </Tooltip>
        <datalist id={eventNameDatalistId}>
          {uniqueEventNames.map(n => <option key={n} value={n} />)}
        </datalist>
        {errors.name && <p className="text-destructive text-xs mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="ef-place" className="block text-sm font-medium text-foreground">{t('modals.event_form.place_label')}</label>
        <Tooltip text={t('modals.event_form.place_tooltip')}>
          <input type="text" id="ef-place" value={formData.place || ''} onChange={e => handleFieldChange('place', e.target.value)} className={commonInputClass} list={locationDatalistId} />
        </Tooltip>
        <datalist id={locationDatalistId}>
          {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label htmlFor="ef-startDate" className="block text-sm font-medium text-foreground">{t('modals.event_form.start_date_label')}</label>
          <Tooltip text={t('modals.event_form.start_date_tooltip')}>
            <input type="date" id="ef-startDate" value={formData.startDate || ''} onChange={e => handleFieldChange('startDate', e.target.value)} className={commonInputClass} required aria-required="true" placeholder={t('common.date_format_placeholder')} />
          </Tooltip>
          {formData.startDate && <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">{t('modals.event_form.date_selected')}</span> {formatDateDMY(formData.startDate)}</p>}
          {errors.startDate && <p className="text-destructive text-xs mt-1" role="alert">{errors.startDate}</p>}
        </div>
        <div>
          <label htmlFor="ef-endDate" className="block text-sm font-medium text-foreground">{t('modals.event_form.end_date_label')}</label>
          <Tooltip text={t('modals.event_form.end_date_tooltip')}>
            <input type="date" id="ef-endDate" value={formData.endDate || ''} onChange={e => handleFieldChange('endDate', e.target.value)} className={commonInputClass} required aria-required="true" placeholder={t('common.date_format_placeholder')} />
          </Tooltip>
          {formData.endDate && <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">{t('modals.event_form.date_selected')}</span> {formatDateDMY(formData.endDate)}</p>}
          {errors.endDate && <p className="text-destructive text-xs mt-1" role="alert">{errors.endDate}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="ef-generalNotes" className="block text-sm font-medium text-foreground">{t('modals.event_form.notes_label')}</label>
        <Tooltip text={t('modals.event_form.notes_tooltip')}>
          <AutosizeTextarea id="ef-generalNotes" value={formData.generalNotes || ''} onChange={e => handleFieldChange('generalNotes', e.target.value)} rows={3} className={`${commonInputClass} resize-none overflow-hidden`} />
        </Tooltip>
      </div>
      <div className="flex justify-between items-center pt-2">
        <div>
          {isEditing && (
            <Tooltip text={t('modals.event_form.show_in_list_tooltip')}>
              <button
                type="button"
                onClick={() => {
                  if (data.eventFrameToEdit?.id) {
                    showAndHighlightEvent(data.eventFrameToEdit.id);
                  }
                  // No tanquem el modal per evitar condicions de cursa
                }}
                className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                {t('modals.event_form.show_in_list_button')}
              </button>
            </Tooltip>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Tooltip text={t('modals.event_form.cancel_tooltip')}>
            <button type="button" onClick={onClose} className="px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border">{t('common.cancel')}</button>
          </Tooltip>
          {!isEditing && (
            <Tooltip text={t('modals.event_form.create_assign_tooltip')}>
              <button
                type="button"
                onClick={handleCreateAndAssign}
                className="px-3 py-1 text-sm font-medium bg-success text-success-foreground hover:bg-success/90 rounded-md"
              >
                {t('modals.event_form.create_assign_button')}
              </button>
            </Tooltip>
          )}
          <Tooltip text={isEditing ? t('modals.event_form.save_edit_tooltip') : t('modals.event_form.create_new_tooltip')}>
            <button type="submit" className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">{isEditing ? t('modals.event_form.update_button') : t('modals.event_form.create_button')}</button>
          </Tooltip>
        </div>
      </div>
    </form>
  );
};

export default EventFrameFormModal;