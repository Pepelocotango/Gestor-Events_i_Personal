import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { formatTimeHHMM } from '../../utils/dateFormat';
import Tooltip from '../ui/Tooltip';

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

  const getInitialPerformanceData = useCallback((): Performance => {
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
  }, [performance.id, performance.name, performance.type, performance.contactName, performance.contactPhone, performance.contactEmail, performance.notes, performance.status, performance.duration, performance.color, performance.arrivalTime, performance.soundCheckTime, performance.showTime, performance.departureTime]);

  const [formData, setFormData] = useState<Performance>(getInitialPerformanceData());
  const formDataRef = useRef(formData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const PERFORMANCE_TYPES: Array<{key: string; label: string}> = [
    { key: 'music', label: t('performances.types.music') },
    { key: 'theater', label: t('performances.types.theater') },
    { key: 'dance', label: t('performances.types.dance') },
    { key: 'conference', label: t('performances.types.conference') },
    { key: 'presentation', label: t('performances.types.presentation') },
    { key: 'workshop', label: t('performances.types.workshop') },
    { key: 'other', label: t('performances.types.other') }
  ];

  // Ref per trackejar l'ID
  const lastIdRef = useRef<string>(performance.id);

  // Sincronitzar formDataRef amb formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Guarda de seguretat: useEffect de sincronització
  useEffect(() => {
    // CAS A: Canvi d'artista
    if (performance.id !== lastIdRef.current) {
      lastIdRef.current = performance.id;
      setFormData(getInitialPerformanceData());
      return;
    }

    // CAS B: Mateix artista, formulari dirty - NO actualitzar
    if (isDirtyRef.current) {
      return;
    }

    // CAS C: Mateix artista, no dirty, dades diferents - SÍ actualitzar
    if (JSON.stringify(formData) !== JSON.stringify(getInitialPerformanceData())) {
      setFormData(getInitialPerformanceData());
    }
  }, [performance.id, performance, getInitialPerformanceData, formData]);

  const markAsDirty = () => {
    isDirtyRef.current = true;
  };

  const saveData = useCallback((isManualSave = false) => {
    if (isDirtyRef.current) {
      updatePerformance(eventFrameId, formDataRef.current);
      if (isManualSave) {
        showToast(t('performances.save_success'), 'success');
      }
      isDirtyRef.current = false;
    }
  }, [updatePerformance, eventFrameId, showToast, t]);

  // Auto-save
  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveData(), 2000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [formData, saveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) saveData();
    };
  }, [saveData]);

  const handleFieldChange = (field: keyof Performance, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markAsDirty();
  };

  const handleBlur = () => {
    saveData(true);
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
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={handleBlur}
              className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              placeholder={t('performances.name_placeholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tooltip text={t('performances.type_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.type')}
                </label>
              </Tooltip>
              <select
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              >
                <option value="">{t('performances.select_type')}</option>
                {PERFORMANCE_TYPES.map(type => (
                  <option key={type.key} value={type.key}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Tooltip text={t('performances.performance_status_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.performance_status')}
                </label>
              </Tooltip>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              >
                <option value="pending">{t('performances.status.pending')}</option>
                <option value="confirmed">{t('performances.status.confirmed')}</option>
                <option value="cancelled">{t('performances.status.cancelled')}</option>
              </select>
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
              <input
                type="time"
                value={formatTimeHHMM(formData.arrivalTime || '')}
                onChange={(e) => handleFieldChange('arrivalTime', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              />
            </div>

            <div>
              <Tooltip text={t('performances.sound_check_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.sound_check_time')}
                </label>
              </Tooltip>
              <input
                type="time"
                value={formatTimeHHMM(formData.soundCheckTime || '')}
                onChange={(e) => handleFieldChange('soundCheckTime', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              />
            </div>

            <div>
              <Tooltip text={t('performances.show_time_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.show_time')}
                </label>
              </Tooltip>
              <input
                type="time"
                value={formatTimeHHMM(formData.showTime || '')}
                onChange={(e) => handleFieldChange('showTime', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              />
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
                onBlur={handleBlur}
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
              onBlur={handleBlur}
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
          <div>
            <Tooltip text={t('performances.contact_name_tooltip')}>
              <label className="block text-sm font-medium mb-2">
                {t('performances.contact_name')}
              </label>
            </Tooltip>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleFieldChange('contactName', e.target.value)}
              onBlur={handleBlur}
              className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
              placeholder={t('performances.contact_name_placeholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tooltip text={t('performances.contact_phone_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.contact_phone')}
                </label>
              </Tooltip>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                placeholder={t('performances.contact_phone_placeholder')}
              />
            </div>

            <div>
              <Tooltip text={t('performances.contact_email_tooltip')}>
                <label className="block text-sm font-medium mb-2">
                  {t('performances.contact_email')}
                </label>
              </Tooltip>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                onBlur={handleBlur}
                className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary"
                placeholder={t('performances.contact_email_placeholder')}
              />
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
            onBlur={handleBlur}
            rows={4}
            className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-vertical"
            placeholder={t('performances.notes_placeholder')}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceBasicForm;
