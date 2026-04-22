/**
 * =============================================================================
 * PERFORMANCE HOSPITALITY FORM
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de formulari per editar la informació d'hospitalitat d'una actuació.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i hooks.
 * - COMPONENT PRINCIPAL: PerformanceHospitalityForm amb camps d'hospitalitat.
 * - ESTAT I HANDLERS: Gestió d'estat amb useBufferedSave.
 * - RENDERITZAT: Estructura de formulari amb camps d'hospitalitat.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, PerformanceHospitalityData, ShowToastFunction } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { useBufferedSave } from '../../hooks/useBufferedSave';

interface PerformanceHospitalityFormProps {
  eventFrameId: string;
  performance: Performance;
  showToast: ShowToastFunction;
}

const PerformanceHospitalityForm: React.FC<PerformanceHospitalityFormProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const initialHospitalityData = useMemo((): PerformanceHospitalityData => {
    return performance.hospitalityData || {
      dressingRooms: '',
      cateringNotes: '',
      dietaryRequirements: '',
      travelLogistics: '',
      parkingNotes: '',
    };
  }, [performance.hospitalityData]);

  const {
    localData: hospitalityData,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialHospitalityData, (data, isManual) => {
    updatePerformance(eventFrameId, {
      ...performance,
      hospitalityData: data,
    });
    if (isManual) {
      showToast(t('performances.save_success'), 'success');
    }
  });


  const handleFieldChange = (field: keyof PerformanceHospitalityData, value: any) => {
    updateLocal({ [field]: value });
  };


  return (
    <div className="space-y-6">

      {/* Botons d'acció */}

      {/* Dressing Rooms */}
      <div>
        <Tooltip text={t('performances.dressing_rooms_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.dressing_rooms_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.dressingRooms}
          onChange={(e) => handleFieldChange('dressingRooms', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.dressing_rooms_placeholder')}
        />
      </div>

      {/* Catering */}
      <div>
        <Tooltip text={t('performances.catering_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.catering_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.cateringNotes}
          onChange={(e) => handleFieldChange('cateringNotes', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.catering_placeholder')}
        />
      </div>

      {/* Dietary Requirements */}
      <div>
        <Tooltip text={t('performances.dietary_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.dietary_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.dietaryRequirements}
          onChange={(e) => handleFieldChange('dietaryRequirements', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.dietary_placeholder')}
        />
      </div>

      {/* Travel Logistics */}
      <div>
        <Tooltip text={t('performances.travel_logistics_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.travel_logistics_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.travelLogistics}
          onChange={(e) => handleFieldChange('travelLogistics', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.travel_logistics_placeholder')}
        />
      </div>

      {/* Parking */}
      <div>
        <Tooltip text={t('performances.parking_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.parking_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.parkingNotes}
          onChange={(e) => handleFieldChange('parkingNotes', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.parking_placeholder')}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-border">
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
      </div>
    </div>
  );
};

export default PerformanceHospitalityForm;
