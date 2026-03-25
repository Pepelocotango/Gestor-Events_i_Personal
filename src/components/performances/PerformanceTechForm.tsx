import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Performance, InputListItem, PerformanceTechData, ShowToastFunction } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { PlusIcon } from '../../constants';
import SortableInputRow from './SortableInputRow';
import { useBufferedSave } from '../../hooks/useBufferedSave';

interface PerformanceTechFormProps {
  eventFrameId: string;
  performance: Performance;
  showToast: ShowToastFunction;
}

const PerformanceTechForm: React.FC<PerformanceTechFormProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const initialTechData = useMemo((): PerformanceTechData => ({
    inputList: performance.techData?.inputList || [],
    lightingNotes: performance.techData?.lightingNotes || '',
    videoNotes: performance.techData?.videoNotes || '',
    stageRequirements: performance.techData?.stageRequirements || '',
  }), [performance.techData]);

  const {
    localData: techData,
    localDataRef: techDataRef,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialTechData, (data, isManual) => {
    updatePerformance(eventFrameId, { ...performance, techData: data });
    if (isManual) {
      showToast(t('performances.save_success'), 'success');
    }
  });


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = techData.inputList.findIndex((item) => item.id === active.id);
      const newIndex = techData.inputList.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newInputList = arrayMove(techData.inputList, oldIndex, newIndex);
        updateLocal({ inputList: newInputList });
      }
    }
  };

  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    updateLocal({
      // Utilitza techDataRef.current en lloc de techData
      inputList: techDataRef.current.inputList.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const addInputItem = () => {
    // Utilitza techDataRef.current
    const currentList = techDataRef.current.inputList;
    const lastItem = currentList[currentList.length - 1];
    let newChannel = '';
    
    if (lastItem?.channel) {
      const lastChannel = parseInt(lastItem.channel);
      if (!isNaN(lastChannel)) {
        newChannel = (lastChannel + 1).toString();
      }
    }

    const newItem: InputListItem = {
      id: Date.now().toString(),
      channel: newChannel,
      patchColor: 'transparent',
      patchNumber: '',
      label: '',
      micRider: '',
      micContra: '',
      stand: '',
      notes: '',
    };
    
    updateLocal({
      inputList: [...currentList, newItem], // Utilitza currentList
    });
  };

  const removeInputItem = (id: string) => {
    updateLocal({
      // Utilitza techDataRef.current
      inputList: techDataRef.current.inputList.filter(item => item.id !== id),
    });
  };

  const handleFieldChange = (field: keyof PerformanceTechData, value: any) => {
    updateLocal({ [field]: value });
  };


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">

        {/* Input List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Tooltip text={t('performances.input_list_tooltip')}>
              <h3 className="text-lg font-semibold">{t('performances.input_list_title')}</h3>
            </Tooltip>
            <div className="flex gap-2">
              <Tooltip text={t('performances.add_input_tooltip')}>
                <button
                  onClick={addInputItem}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('performances.add_input')}
                </button>
              </Tooltip>
            </div>
          </div>

          {techData.inputList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <p className="text-sm">{t('performances.no_inputs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <SortableContext
                items={techData.inputList}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-10"></th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.patch_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.channel_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.label_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.mic_rider_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.mic_contra_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.stand_header')}
                      </th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-muted-foreground">
                        {t('performances.notes_header')}
                      </th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {techData.inputList.map((item) => (
                      <SortableInputRow
                        key={item.id}
                        item={item}
                        onChange={handleInputChange}
                        onRemove={removeInputItem}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
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

        {/* Video Notes */}
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
    </DndContext>
  );
};

export default PerformanceTechForm;
