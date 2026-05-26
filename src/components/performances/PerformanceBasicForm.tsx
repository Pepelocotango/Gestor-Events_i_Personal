/**
 * =============================================================================
 * PERFORMANCE BASIC FORM
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de formulari per editar la informació bàsica d'una actuació.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i hooks.
 * - COMPONENT PRINCIPAL: PerformanceBasicForm amb camps bàsics.
 * - ESTAT I HANDLERS: Gestió d'estat amb useBufferedSave.
 * - RENDERITZAT: Estructura de formulari amb camps bàsics.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { formatTimeHHMM } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';
import { useBufferedSave } from '../../hooks/useBufferedSave';

interface PerformanceBasicFormProps {
  eventFrameId: string;
  performance: Performance;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const PerformanceBasicForm: React.FC<PerformanceBasicFormProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const initialPerformanceData = useMemo((): Performance => {
    return {
      id: performance.id,
      name: performance.name || '',
      type: performance.type || '',
      contactName: performance.contactName || '',
      contactPhone: performance.contactPhone || '',
      contactEmail: performance.contactEmail || '',
      notes: performance.notes || '',
      status: performance.status || 'pending',
      duration: performance.duration || '',
      color: performance.color,
      arrivalTime: performance.arrivalTime,
      soundCheckTime: performance.soundCheckTime,
      showTime: performance.showTime,
      departureTime: performance.departureTime,
    };
  }, [performance]);

  const {
    localData: formData,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialPerformanceData, (data, isManual) => {
    updatePerformance(eventFrameId, data);
    if (isManual) {
      showToast(t('performances.save_success'), 'success');
    }
  });

  const PERFORMANCE_TYPES: Array<{key: string; label: string}> = [
    { key: 'music', label: t('performances.types.music') },
    { key: 'theater', label: t('performances.types.theater') },
    { key: 'dance', label: t('performances.types.dance') },
    { key: 'conference', label: t('performances.types.conference') },
    { key: 'presentation', label: t('performances.types.presentation') },
    { key: 'workshop', label: t('performances.types.workshop') },
    { key: 'other', label: t('performances.types.other') }
  ];

  const handleFieldChange = (field: keyof Performance, value: any) => {
    updateLocal({ [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Identity Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">
          {t('performances.identity_title')}
        </h3>
        <div className="space-y-4">
          <div>
            <Tooltip text={t('performances.name_tooltip')}>
              <label className="block text-sm font-medium mb-2">
                {t('performances.name')} *
              </label>
            </Tooltip>
            <Tooltip text={t('performances.name_tooltip')}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                placeholder={t('performances.name_placeholder')}
              />
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tooltip text={t('performances.type_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.type')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.type_tooltip')}>
                <select
                  value={formData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                >
                  <option value="">{t('performances.select_type')}</option>
                  {PERFORMANCE_TYPES.map(type => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </Tooltip>
            </div>

            <div>
              <Tooltip text={t('performances.performance_status_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.performance_status')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.performance_status_tooltip')}>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                >
                  <option value="pending">{t('performances.status.pending')}</option>
                  <option value="confirmed">{t('performances.status.confirmed')}</option>
                  <option value="cancelled">{t('performances.status.cancelled')}</option>
                </select>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">
          {t('performances.schedule_title')}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tooltip text={t('performances.arrival_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.arrival_time')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.arrival_time_tooltip')}>
                <input
                  type="time"
                  value={formatTimeHHMM(formData.arrivalTime || '')}
                  onChange={(e) => handleFieldChange('arrivalTime', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                />
              </Tooltip>
            </div>

            <div>
              <Tooltip text={t('performances.sound_check_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.sound_check_time')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.sound_check_time_tooltip')}>
                <input
                  type="time"
                  value={formatTimeHHMM(formData.soundCheckTime || '')}
                  onChange={(e) => handleFieldChange('soundCheckTime', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                />
              </Tooltip>
            </div>

            <div>
              <Tooltip text={t('performances.show_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.show_time')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.show_time_tooltip')}>
                <input
                  type="time"
                  value={formatTimeHHMM(formData.showTime || '')}
                  onChange={(e) => handleFieldChange('showTime', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                />
              </Tooltip>
            </div>

            <div>
              <Tooltip text={t('performances.departure_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.departure_time')}
                </label>
              </Tooltip>
              <input
                type="time"
                value={formatTimeHHMM(formData.departureTime || '')}
                onChange={(e) => handleFieldChange('departureTime', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              />
            </div>
          </div>

          <div>
            <Tooltip text={t('performances.duration_tooltip')}>
              <label className="block text-sm font-medium mb-2">
                {t('performances.duration')}
              </label>
            </Tooltip>
            <input
              type="text"
              value={formData.duration || ''}
              onChange={(e) => handleFieldChange('duration', e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              placeholder={t('performances.duration_placeholder')}
            />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">
          {t('performances.contact_title')}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tooltip text={t('performances.contact_name_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.contact_name')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.contact_name_tooltip')}>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleFieldChange('contactName', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                  placeholder={t('performances.contact_name_placeholder')}
                />
              </Tooltip>
            </div>

            <div>
              <Tooltip text={t('performances.contact_phone_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.contact_phone')}
                </label>
              </Tooltip>
              <Tooltip text={t('performances.contact_phone_tooltip')}>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                  placeholder={t('performances.contact_phone_placeholder')}
                />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">
          {t('performances.notes_title')}
        </h3>
        <div>
          <Tooltip text={t('performances.notes_tooltip')}>
            <label className="block text-sm font-medium mb-2">
              {t('performances.notes')}
            </label>
          </Tooltip>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-vertical"
            placeholder={t('performances.notes_placeholder')}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-border">
        <Tooltip text={isDirty ? t('performances.save_tooltip') : t('performances.saved_tooltip')}>
          <button
            onClick={saveNow}
            disabled={!isDirty}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-secondary text-secondary-foreground/50 cursor-not-allowed'
            }`}
          >
            {isDirty ? t('performances.save_changes') : (
              <>
                <span className="text-lg">✓</span>
                {t('performances.saved')}
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default PerformanceBasicForm;
