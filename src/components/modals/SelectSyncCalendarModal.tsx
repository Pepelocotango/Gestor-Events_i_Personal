/**
 * =============================================================================
 * SELECT SYNC CALENDAR MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal per seleccionar un calendari per a la sincronització.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: SelectSyncCalendarModal amb selecció de calendari.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ManagedAppCalendar } from '@/types';
import Tooltip from '../ui/Tooltip';

interface SelectSyncCalendarModalProps {
  onClose: () => void;
  onConfirm: (targetCalendarId: string) => void;
  managedCalendars: ManagedAppCalendar[];
  activeCalendarId: string | null;
}

const SelectSyncCalendarModal: React.FC<SelectSyncCalendarModalProps> = ({
  onClose,
  onConfirm,
  managedCalendars,
  activeCalendarId,
}) => {
  const { t } = useTranslation();
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(activeCalendarId);

  useEffect(() => {
    // Pre-select the active calendar, or the first one if no active one is set.
    if (activeCalendarId && managedCalendars.some(c => c.id === activeCalendarId)) {
      setSelectedCalendarId(activeCalendarId);
    } else if (managedCalendars.length > 0) {
      setSelectedCalendarId(managedCalendars[0].id);
    } else {
      setSelectedCalendarId(null);
    }
  }, [activeCalendarId, managedCalendars]);

  const handleSync = () => {
    if (selectedCalendarId) {
      onConfirm(selectedCalendarId);
    }
  };

  const selectedCalendar = managedCalendars.find(c => c.id === selectedCalendarId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">{t('modals.select_sync.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('modals.select_sync.description')}
        </p>
      </div>

      {managedCalendars.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
          {managedCalendars.map(cal => (
            <div key={cal.id} className="flex items-center p-2 rounded-md border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
              <Tooltip text={t('modals.select_sync.radio_tooltip', { name: cal.name })}>
                <input
                  type="radio"
                  id={`sync-cal-${cal.id}`}
                  name="syncCalendar"
                  value={cal.id}
                  checked={cal.id === selectedCalendarId}
                  onChange={() => setSelectedCalendarId(cal.id)}
                  className="h-4 w-4 accent-primary focus:ring-ring border-border"
                />
              </Tooltip>
              <label htmlFor={`sync-cal-${cal.id}`} className="ml-3 block text-sm font-medium text-foreground">
                {cal.name}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-6 bg-muted/50 rounded-md">
          <p>{t('modals.select_sync.no_calendars_found')}</p>
          <p className="mt-1">{t('modals.select_sync.go_to_settings')}</p>
        </div>
      )}

      <div className="flex justify-end items-center pt-4 border-t border-border space-x-2">
        <Tooltip text={t('modals.select_sync.cancel_tooltip')}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {t('common.cancel')}
          </button>
        </Tooltip>
        <Tooltip text={!selectedCalendarId ? t('modals.select_sync.no_calendar_selected_tooltip') : t('modals.select_sync.sync_tooltip', { name: selectedCalendar?.name })}>
          <button
            onClick={handleSync}
            disabled={!selectedCalendarId}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedCalendar ? t('modals.select_sync.sync_button', { name: selectedCalendar.name }) : t('modals.select_sync.select_placeholder')}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default SelectSyncCalendarModal;
