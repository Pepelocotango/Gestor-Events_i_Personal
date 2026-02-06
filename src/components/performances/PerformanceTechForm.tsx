import React from 'react';
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
import { Performance, InputListItem, PerformanceTechData } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useDebouncedSave } from '../../hooks/useDebouncedSave';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { PlusIcon } from '../../constants';
import SortableInputRow from './SortableInputRow';

interface PerformanceTechFormProps {
  eventFrameId: string;
  performance: Performance;
}

const PerformanceTechForm: React.FC<PerformanceTechFormProps> = ({
  eventFrameId,
  performance,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const getInitialTechData = (): PerformanceTechData => {
    const techData = performance.techData || {
      inputList: [],
      lightingNotes: '',
      videoNotes: '',
      stageRequirements: '',
    };

    // Migració de dades: micDi -> micRider
    const migratedInputList = techData.inputList.map(item => ({
      ...item,
      micRider: item.micRider || (item as any).micDi || '',
      micContra: item.micContra || '',
      stand: item.stand || '',
      patchColor: item.patchColor || 'transparent',
      patchNumber: item.patchNumber || '',
    }));

    return {
      ...techData,
      inputList: migratedInputList,
    };
  };

  const { data: techData, updateField, setData } = useDebouncedSave<PerformanceTechData>({
    initialData: getInitialTechData(),
    onSave: (data) => updatePerformance(eventFrameId, {
      ...performance,
      techData: data,
    }),
    delay: 2000,
  });

  // Sync when performance changes
  React.useEffect(() => {
    setData(getInitialTechData());
  }, [performance, setData]);

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
        setData(prev => ({
          ...prev,
          inputList: newInputList,
        }));
      }
    }
  };

  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    setData(prev => ({
      ...prev,
      inputList: prev.inputList.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addInputItem = () => {
    const lastItem = techData.inputList[techData.inputList.length - 1];
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
    
    setData(prev => ({
      ...prev,
      inputList: [...prev.inputList, newItem],
    }));
  };

  const removeInputItem = (id: string) => {
    setData(prev => ({
      ...prev,
      inputList: prev.inputList.filter(item => item.id !== id),
    }));
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={techData.inputList}
                  strategy={verticalListSortingStrategy}
                >
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
                </SortableContext>
              </DndContext>
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
          onChange={(e) => updateField('lightingNotes', e.target.value)}
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
          onChange={(e) => updateField('videoNotes', e.target.value)}
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
          onChange={(e) => updateField('stageRequirements', e.target.value)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary resize-none min-h-[80px]"
          placeholder={t('performances.stage_requirements_placeholder')}
        />
      </div>
    </div>
  );
};

export default PerformanceTechForm;
