import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const getInitialTechData = useCallback((): PerformanceTechData => {
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
  }, [performance.techData]);

  const [techData, setTechData] = useState<PerformanceTechData>(getInitialTechData());
  const techDataRef = useRef(techData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref per trackejar l'ID
  const lastIdRef = useRef<string>(performance.id);

  // Sincronitzar techDataRef amb techData
  useEffect(() => {
    techDataRef.current = techData;
  }, [techData]);

  // Guarda de seguretat: useEffect de sincronització
  useEffect(() => {
    // CAS A: Canvi d'artista
    if (performance.id !== lastIdRef.current) {
      lastIdRef.current = performance.id;
      setTechData(getInitialTechData());
      return;
    }

    // CAS B: Mateix artista, formulari dirty - NO actualitzar
    if (isDirtyRef.current) {
      return;
    }

    // CAS C: Mateix artista, no dirty, dades diferents - SÍ actualitzar
    if (JSON.stringify(techData) !== JSON.stringify(getInitialTechData())) {
      setTechData(getInitialTechData());
    }
  }, [performance.id, performance.techData, getInitialTechData, techData]);

  const markAsDirty = () => {
    isDirtyRef.current = true;
  };

  const saveData = useCallback(() => {
    if (isDirtyRef.current) {
      updatePerformance(eventFrameId, {
        ...performance,
        techData: techDataRef.current,
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
  }, [techData, saveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) saveData();
    };
  }, [saveData]);

  const handleFieldChange = (field: keyof PerformanceTechData, value: any) => {
    setTechData(prev => ({ ...prev, [field]: value }));
    markAsDirty();
  };

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
        const newInputList = arrayMove(techDataRef.current.inputList, oldIndex, newIndex);
        setTechData(prev => ({
          ...prev,
          inputList: newInputList,
        }));
      }
    }
  };

  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    setTechData(prev => ({
      ...prev,
      inputList: prev.inputList.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    markAsDirty();
  };

  const addInputItem = () => {
    const lastItem = techDataRef.current.inputList[techDataRef.current.inputList.length - 1];
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
    
    setTechData(prev => ({
      ...prev,
      inputList: [...prev.inputList, newItem],
    }));
    markAsDirty();
  };

  const removeInputItem = (id: string) => {
    setTechData(prev => ({
      ...prev,
      inputList: prev.inputList.filter(item => item.id !== id),
    }));
    markAsDirty();
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
      </div>
    </DndContext>
  );
};

export default PerformanceTechForm;
