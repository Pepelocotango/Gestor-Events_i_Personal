import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, InputListItem, PerformanceTechData } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { PlusIcon, TrashIcon } from '../../constants';

interface PerformanceTechFormProps {
  eventFrameId: string;
  performance: Performance;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const PerformanceTechForm: React.FC<PerformanceTechFormProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const getInitialTechData = (): PerformanceTechData => {
    return performance.techData || {
      inputList: [],
      lightingNotes: '',
      videoNotes: '',
      stageRequirements: '',
    };
  };

  const [techData, setTechData] = useState<PerformanceTechData>(getInitialTechData());
  const techDataRef = useRef(techData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveData = (showMessage = false) => {
    if (isDirtyRef.current) {
      updatePerformance(eventFrameId, {
        ...performance,
        techData,
      });
      isDirtyRef.current = false;
      if (showMessage) {
        showToast(t('performances.save_success'), 'success');
      }
    }
  };

  useEffect(() => {
    techDataRef.current = techData;
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveData(), 2000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [techData]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) saveData();
    };
  }, []);

  useEffect(() => {
    const newData = getInitialTechData();
    setTechData(newData);
    isDirtyRef.current = false;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [performance]);

  const handleFieldChange = (field: keyof PerformanceTechData, value: any) => {
    setTechData(prev => ({ ...prev, [field]: value }));
    isDirtyRef.current = true;
  };

  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    setTechData(prev => ({
      ...prev,
      inputList: prev.inputList.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    isDirtyRef.current = true;
  };

  const addInputItem = () => {
    const newItem: InputListItem = {
      id: Date.now().toString(),
      label: '',
      micDi: '',
      notes: '',
    };
    setTechData(prev => ({
      ...prev,
      inputList: [...prev.inputList, newItem],
    }));
    isDirtyRef.current = true;
  };

  const removeInputItem = (id: string) => {
    setTechData(prev => ({
      ...prev,
      inputList: prev.inputList.filter(item => item.id !== id),
    }));
    isDirtyRef.current = true;
  };

  return (
    <div className="space-y-6">
      {/* Input List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <Tooltip text={t('performances.input_list_tooltip')}>
            <h3 className="text-lg font-semibold">{t('performances.input_list_title')}</h3>
          </Tooltip>
          <button
            onClick={addInputItem}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            {t('performances.add_input')}
          </button>
        </div>

        {techData.inputList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <p className="text-sm">{t('performances.no_inputs')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground w-16">
                    {t('performances.channel_header')}
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    {t('performances.label_header')}
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    {t('performances.mic_di_header')}
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                    {t('performances.notes_header')}
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {techData.inputList.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.channel || ''}
                        onChange={(e) => handleInputChange(item.id, 'channel', e.target.value)}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={t('performances.channel_placeholder')}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleInputChange(item.id, 'label', e.target.value)}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={t('performances.label_placeholder')}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.micDi}
                        onChange={(e) => handleInputChange(item.id, 'micDi', e.target.value)}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={t('performances.mic_di_placeholder')}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={t('performances.notes_placeholder')}
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeInputItem(item.id)}
                        className="text-destructive hover:bg-destructive/10 rounded p-1 focus:outline-none focus:ring-2 focus:ring-destructive"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes de Llums */}
      <div>
        <Tooltip text={t('performances.lighting_notes_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.lighting_notes')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={techData.lightingNotes}
          onChange={(e) => handleFieldChange('lightingNotes', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.lighting_notes_placeholder')}
        />
      </div>

      {/* Notes de Vídeo */}
      <div>
        <Tooltip text={t('performances.video_notes_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.video_notes')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={techData.videoNotes}
          onChange={(e) => handleFieldChange('videoNotes', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.video_notes_placeholder')}
        />
      </div>

      {/* Necessitats d'Escenari */}
      <div>
        <Tooltip text={t('performances.stage_requirements_tooltip')}>
          <label className="block text-sm font-medium mb-2">
            {t('performances.stage_requirements')}
          </label>
        </Tooltip>
        <AutosizeTextarea
          value={techData.stageRequirements}
          onChange={(e) => handleFieldChange('stageRequirements', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.stage_requirements_placeholder')}
        />
      </div>
    </div>
  );
};

export default PerformanceTechForm;
