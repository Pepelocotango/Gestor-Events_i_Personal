import React from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, PerformanceHospitalityData } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useDebouncedSave } from '../../hooks/useDebouncedSave';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';

interface PerformanceHospitalityFormProps {
  eventFrameId: string;
  performance: Performance;
}

const PerformanceHospitalityForm: React.FC<PerformanceHospitalityFormProps> = ({
  eventFrameId,
  performance,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const getInitialHospitalityData = (): PerformanceHospitalityData => {
    return performance.hospitalityData || {
      dressingRooms: '',
      cateringNotes: '',
      dietaryRequirements: '',
      travelLogistics: '',
      parkingNotes: '',
    };
  };

  const { data: hospitalityData, updateField, setData } = useDebouncedSave<PerformanceHospitalityData>({
    initialData: getInitialHospitalityData(),
    onSave: (data) => updatePerformance(eventFrameId, {
      ...performance,
      hospitalityData: data,
    }),
    delay: 2000,
  });

  // Ref per guardar l'ID de l'actuació actual
  const performanceIdRef = React.useRef<string>(performance.id);

  // Sync when performance changes
  React.useEffect(() => {
    // Si l'ID ha canviat (usuari ha saltat a un altre artista)
    if (performanceIdRef.current !== performance.id) {
      performanceIdRef.current = performance.id;
      setData(getInitialHospitalityData());
    }
    // Si l'ID és el mateix, NO cridar a setData si isDirty és true
    // L'estat local ha de manar mentre l'usuari edita
  }, [performance.id, setData]);

  return (
    <div className="space-y-6">
      {/* Dressing Rooms */}
      <div>
        <Tooltip text={t('performances.dressing_rooms_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.dressing_rooms_label')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={hospitalityData.dressingRooms}
          onChange={(e) => updateField('dressingRooms', e.target.value)}
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
          onChange={(e) => updateField('cateringNotes', e.target.value)}
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
          onChange={(e) => updateField('dietaryRequirements', e.target.value)}
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
          onChange={(e) => updateField('travelLogistics', e.target.value)}
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
          onChange={(e) => updateField('parkingNotes', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.parking_placeholder')}
        />
      </div>
    </div>
  );
};

export default PerformanceHospitalityForm;
