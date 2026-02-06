import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, PerformanceHospitalityData, ShowToastFunction } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { EyeIcon, PdfIcon } from '../../constants';
import { generatePerformanceHospitalityPdfObject, exportPerformanceHospitalityToPdf } from '../../utils/pdfGenerator';

interface PerformanceHospitalityFormProps {
  eventFrameId: string;
  performance: Performance;
  eventFrame: any; // EventFrame data
  showToast: ShowToastFunction;
}

const PerformanceHospitalityForm: React.FC<PerformanceHospitalityFormProps> = ({
  eventFrameId,
  performance,
  eventFrame,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();
  const openModal = useModalStore(state => state.openModal);

  const getInitialHospitalityData = useCallback((): PerformanceHospitalityData => {
    return performance.hospitalityData || {
      dressingRooms: '',
      cateringNotes: '',
      dietaryRequirements: '',
      travelLogistics: '',
      parkingNotes: '',
    };
  }, [performance.hospitalityData]);

  const [hospitalityData, setHospitalityData] = useState<PerformanceHospitalityData>(getInitialHospitalityData());
  const hospitalityDataRef = useRef(hospitalityData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref per trackejar l'ID
  const lastIdRef = useRef<string>(performance.id);

  // Sincronitzar hospitalityDataRef amb hospitalityData
  useEffect(() => {
    hospitalityDataRef.current = hospitalityData;
  }, [hospitalityData]);

  // Guarda de seguretat: useEffect de sincronització
  useEffect(() => {
    // CAS A: Canvi d'artista
    if (performance.id !== lastIdRef.current) {
      lastIdRef.current = performance.id;
      setHospitalityData(getInitialHospitalityData());
      return;
    }

    // CAS B: Mateix artista, formulari dirty - NO actualitzar
    if (isDirtyRef.current) {
      return;
    }

    // CAS C: Mateix artista, no dirty, dades diferents - SÍ actualitzar
    if (JSON.stringify(hospitalityData) !== JSON.stringify(getInitialHospitalityData())) {
      setHospitalityData(getInitialHospitalityData());
    }
  }, [performance.id, performance.hospitalityData, getInitialHospitalityData, hospitalityData]);

  const markAsDirty = () => {
    isDirtyRef.current = true;
  };

  const saveData = useCallback(() => {
    if (isDirtyRef.current) {
      updatePerformance(eventFrameId, {
        ...performance,
        hospitalityData: hospitalityDataRef.current,
      });
      isDirtyRef.current = false;
    }
  }, [updatePerformance, eventFrameId, performance]);

  // Auto-save
  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveData(), 2000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hospitalityData, saveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) saveData();
    };
  }, [saveData]);

  const handleFieldChange = (field: keyof PerformanceHospitalityData, value: any) => {
    setHospitalityData(prev => ({ ...prev, [field]: value }));
    markAsDirty();
  };

  const handlePreviewHospitality = () => {
    const performanceWithHospitalityData = {
      ...performance,
      hospitalityData: hospitalityDataRef.current
    };
    const doc = generatePerformanceHospitalityPdfObject(performanceWithHospitalityData, eventFrame);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
    
    openModal('pdfPreview', {
      pdfUrl,
      titleOverride: t('modals.pdf_preview.title_override', { name: performance.name }),
      onSave: () => handleExportHospitality()
    });
  };

  const handleExportHospitality = () => {
    const performanceWithHospitalityData = {
      ...performance,
      hospitalityData: hospitalityDataRef.current
    };
    exportPerformanceHospitalityToPdf(performanceWithHospitalityData, eventFrame, showToast);
  };

  return (
    <div className="space-y-6">
      {/* Botons d'acció */}
      <div className="flex justify-end gap-2 mb-6">
        <Tooltip text={t('performances.preview_hospitality_tooltip')}>
          <button
            onClick={handlePreviewHospitality}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
          >
            <EyeIcon className="w-4 h-4" />
            {t('performances.preview_hospitality')}
          </button>
        </Tooltip>
        <Tooltip text={t('performances.export_hospitality_tooltip')}>
          <button
            onClick={handleExportHospitality}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
          >
            <PdfIcon className="w-4 h-4" />
            {t('performances.export_hospitality')}
          </button>
        </Tooltip>
      </div>

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
    </div>
  );
};

export default PerformanceHospitalityForm;
