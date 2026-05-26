/**
 * =============================================================================
 * CREATE CALENDAR MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal per crear un nou calendari a Google Calendar.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: CreateCalendarModal amb formulari de creació.
 * =============================================================================
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShowToastFunction } from '@/types';
import { createNewCalendar } from '@/stores/googleConfigStore';
import Tooltip from '../ui/Tooltip';

interface CreateCalendarModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({ onClose, showToast }) => {
  const { t } = useTranslation();
  const [suffix, setSuffix] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!suffix.trim()) {
      showToast(t('modals.create_calendar.empty_suffix_warning'), 'warning');
      return;
    }
    setIsCreating(true);
    try {
      const result = await createNewCalendar(suffix.trim());
      if (result) {
        showToast(result.message, result.type);
        if (result.success) {
          onClose();
        }
      }
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">{t('modals.create_calendar.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('modals.create_calendar.description')}
        </p>
      </div>

      <div>
        <label htmlFor="calendar-suffix" className="block text-sm font-medium text-muted-foreground">
          {t('modals.create_calendar.suffix_label')}
        </label>
        <Tooltip text={t('modals.create_calendar.suffix_tooltip')}>
          <input
            type="text"
            id="calendar-suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm"
            placeholder={t('modals.create_calendar.placeholder')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
          />
        </Tooltip>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-border">
        <Tooltip text={t('modals.create_calendar.cancel_tooltip')}>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        </Tooltip>
        <Tooltip text={t('modals.create_calendar.submit_tooltip')}>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? t('modals.create_calendar.creating_label') : t('modals.create_calendar.submit_button')}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default CreateCalendarModal;
