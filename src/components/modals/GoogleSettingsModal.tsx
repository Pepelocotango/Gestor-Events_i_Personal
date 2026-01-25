import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShowToastFunction, GoogleCalendar, ManagedAppCalendar } from '@/types';
import Tooltip from '../ui/Tooltip';
import { useEventDataStore } from '@/stores/eventDataStore';
import { useModalStore } from '@/stores/modalStore';
import {
  useGoogleConfigStore,
  fetchAndLoadConfig,
  saveConfig,
  deleteCalendar,
  disconnectGoogle,
} from '@/stores/googleConfigStore';
import logger from '@/utils/logger';

interface GoogleSettingsModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const GoogleSettingsModal: React.FC<GoogleSettingsModalProps> = ({ onClose, showToast }) => {
  const { t } = useTranslation();
  const executeSync = useEventDataStore(state => state.executeSync);
  const isEventDataSyncing = useEventDataStore(state => state.isSyncing);
  const openModal = useModalStore(state => state.openModal);

  const externalCalendars = useGoogleConfigStore(state => state.externalCalendars);
  const selectedIds = useGoogleConfigStore(state => state.selectedIds);
  const managedCalendars = useGoogleConfigStore(state => state.managedCalendars);
  const activeCalendarId = useGoogleConfigStore(state => state.activeCalendarId);
  const loading = useGoogleConfigStore(state => state.loading);
  const error = useGoogleConfigStore(state => state.error);

  useEffect(() => {
    logger.info('[GoogleSettingsModal] Muntat. Carregant la configuració de Google...');
    fetchAndLoadConfig();
  }, []);

  logger.info('[GoogleSettingsModal Render]', { loading, error });

  const handleCreateNewCalendar = () => {
    openModal('createAppCalendar');
  };

  const handleSaveAndClose = async () => {
    const result = await saveConfig();
    showToast(result.message, result.type);
    if (result.success) {
      onClose();
    }
  };

  const isSyncing = isEventDataSyncing || loading;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">{t('modals.google_settings.title')}</h3>
        <div className="mt-2 text-sm space-y-2 p-3 bg-warning/10 border-l-4 border-warning">
          <h4 className="font-semibold text-warning-foreground">{t('modals.google_settings.warning_title')}</h4>
          <p>{t('modals.google_settings.warning_intro')}</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>{t('modals.google_settings.warning_sync_label')}</strong> {t('modals.google_settings.warning_sync_text')}</li>
            <li><strong>{t('modals.google_settings.warning_view_label')}</strong> {t('modals.google_settings.warning_view_text')}</li>
          </ul>
          <p className="font-semibold pt-2">{t('modals.google_settings.requirement_title')}</p>
          <p>{t('modals.google_settings.requirement_text')}</p>
        </div>
      </div>

      <div className="p-4 border border-border rounded-md space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-card-foreground">{t('modals.google_settings.managed_calendars_title')}</h4>
          <Tooltip text={t('modals.google_settings.create_new_tooltip')}>
            <button onClick={handleCreateNewCalendar} className="px-3 py-1 text-sm font-medium text-success-foreground bg-success hover:bg-success/90 rounded-md">
              {t('modals.google_settings.create_new_button')}
            </button>
          </Tooltip>
        </div>

        {loading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}
        {!loading && managedCalendars.length > 0 && (
          <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {managedCalendars.map((cal: ManagedAppCalendar) => (
              <li key={cal.id} className="p-2 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-grow">
                    <Tooltip text={t('modals.google_settings.active_radio_tooltip')}>
                      <input
                        type="radio"
                        id={`cal-${cal.id}`}
                        name="activeCalendar"
                        checked={cal.id === activeCalendarId}
                        onChange={() => useGoogleConfigStore.getState().setActiveCalendarId(cal.id)}
                        className="h-4 w-4 text-primary focus:ring-ring border-border"
                      />
                    </Tooltip>
                    <div className="ml-3">
                      <label htmlFor={`cal-${cal.id}`} className="block text-sm font-medium text-card-foreground cursor-pointer">
                        {cal.name}
                        {cal.id === activeCalendarId && <span className="ml-2 text-xs font-bold text-primary">{t('modals.google_settings.active_label')}</span>}
                      </label>
                      <span className="text-xs text-muted-foreground">{t('modals.google_settings.suffix_label')} {cal.suffix || t('modals.google_settings.none_label')}</span>
                    </div>
                  </div>
                  <Tooltip text={t('modals.google_settings.delete_calendar_tooltip', { name: cal.name })}>
                    <button
                      onClick={() => deleteCalendar(cal)}
                      className="ml-4 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded"
                    >
                      {t('modals.google_settings.delete_button')}
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-2 pl-7">
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-xs">
                      ID
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={cal.id}
                      className="flex-1 min-w-0 block w-full px-2 py-1 rounded-none bg-secondary border-border text-xs"
                    />
                    <Tooltip text={t('modals.google_settings.copy_id_tooltip')}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(cal.id);
                          showToast(t('modals.google_settings.id_copied_toast'), 'success');
                        }}
                        className="inline-flex items-center px-3 py-1 border border-l-0 border-border rounded-r-md bg-secondary text-xs hover:bg-accent"
                      >
                        {t('modals.google_settings.copy_button')}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && managedCalendars.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>{t('modals.google_settings.no_managed_calendars')}</p>
            <p>{t('modals.google_settings.no_managed_click_create')}</p>
          </div>
        )}
      </div>

      <div className="p-4 border border-border rounded-md min-h-[150px]">
        <h4 className="font-semibold mb-2 text-card-foreground">{t('modals.google_settings.other_calendars_title')}</h4>
        {loading && <p className="text-center text-muted-foreground">{t('modals.google_settings.loading_calendars')}</p>}
        {error && <p className="text-center text-destructive">{typeof error === 'string' ? error : (error as Error)?.message || t('modals.google_settings.unknown_error')}</p>}
        {!loading && !error && externalCalendars.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {externalCalendars.map((cal: GoogleCalendar) => (
              <li key={cal.id} className="flex items-center">
                <Tooltip text={t('modals.google_settings.toggle_calendar_tooltip', { name: cal.summary })}>
                  <input
                    type="checkbox"
                    id={cal.id}
                    checked={selectedIds.includes(cal.id)}
                    onChange={() => useGoogleConfigStore.getState().toggleExternalCalendar(cal.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    style={{ accentColor: cal.backgroundColor }}
                  />
                </Tooltip>
                <label htmlFor={cal.id} className="ml-3 block text-sm font-medium text-muted-foreground">
                  {cal.summary}
                  {cal.primary && ` ${t('modals.google_settings.primary_label')}`}
                </label>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && externalCalendars.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">{t('modals.google_settings.no_other_calendars')}</p>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Tooltip text={managedCalendars.length === 0 ? t('modals.google_settings.disconnect_no_account') : t('modals.google_settings.disconnect_tooltip')}>
          <button
            onClick={disconnectGoogle}
            className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md disabled:opacity-50"
            disabled={managedCalendars.length === 0 || isSyncing}
          >
            {t('modals.google_settings.disconnect_button')}
          </button>
        </Tooltip>
        <div className="flex items-center space-x-2">
          <Tooltip text={!activeCalendarId ? t('modals.google_settings.sync_no_active_tooltip') : t('modals.google_settings.sync_now_tooltip')}>
            <button
              onClick={() => {
                if (activeCalendarId) {
                  executeSync(activeCalendarId);
                  onClose();
                } else {
                  showToast(t('modals.google_settings.select_active_warning'), 'warning');
                }
              }}
              disabled={!activeCalendarId || isSyncing}
              className="px-4 py-2 text-sm font-medium text-warning-foreground bg-warning hover:bg-warning/90 rounded-md disabled:opacity-50"
            >
              {isSyncing ? t('modals.google_settings.syncing_label') : t('modals.google_settings.sync_button')}
            </button>
          </Tooltip>
          <Tooltip text={t('modals.google_settings.save_close_tooltip')}>
            <button onClick={handleSaveAndClose} disabled={isSyncing} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50">
              {t('modals.google_settings.save_close_button')}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default GoogleSettingsModal;