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
import { Performance, InputListItem, PerformanceTechData, ShowToastFunction, PerformancePdfOptions } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { PlusIcon, EyeIcon, PdfIcon } from '../../constants';
import SortableInputRow from './SortableInputRow';
import PerformancePdfOptions from './PerformancePdfOptions';
import { generatePerformanceInputsPdfObject, exportPerformanceInputsToPdf, exportPerformanceToPdfWithOptions } from '../../utils/pdfGenerator';

interface PerformanceTechFormProps {
  eventFrameId: string;
  performance: Performance;
  eventFrame: any; // EventFrame data
  showToast: ShowToastFunction;
}

const PerformanceTechForm: React.FC<PerformanceTechFormProps> = ({
  eventFrameId,
  performance,
  eventFrame,
  showToast,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();
  const { openModal } = useModalStore();

  // Estat local
  const [techData, setTechData] = useState<PerformanceTechData>(() => ({
    inputList: performance.techData?.inputList || [],
    lightingNotes: performance.techData?.lightingNotes || '',
    videoNotes: performance.techData?.videoNotes || '',
    stageRequirements: performance.techData?.stageRequirements || '',
  }));

  // Refs per dirty checking i sincronització
  const techDataRef = useRef(techData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastIdRef = useRef(performance.id);

  // Opcions d'exportació PDF
  const [pdfOptions, setPdfOptions] = useState<PerformancePdfOptions>({
    includeBasicInfo: true,
    includeInputs: true,
    includeTechnicalNotes: true,
    includeHospitality: false,
    includeGeneralNotes: false,
    showEmptySections: false,
  });

  // Actualitzar ref quan techData canvia
  useEffect(() => {
    techDataRef.current = techData;
  }, [techData]);

  // Marcar com a dirty
  const markAsDirty = () => {
    isDirtyRef.current = true;
  };

  // Auto-save amb timeout
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
        const newInputList = arrayMove(techData.inputList, oldIndex, newIndex);
        setTechData(prev => ({
          ...prev,
          inputList: newInputList,
        }));
        markAsDirty();
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

  const handlePreviewInputs = () => {
    const performanceWithTechData = {
      ...performance,
      techData: techDataRef.current
    };
    const doc = generatePerformanceInputsPdfObject(performanceWithTechData, eventFrame);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
    
    openModal('pdfPreview', {
      pdfUrl,
      titleOverride: t('modals.pdf_preview.title_override', { name: performance.name }),
      onSave: () => handleExportInputs()
    });
  };

  const handleExportInputs = () => {
    const performanceWithTechData = {
      ...performance,
      techData: techDataRef.current
    };
    exportPerformanceInputsToPdf(performanceWithTechData, eventFrame, showToast);
  };

  const handleExportCustomPdf = () => {
    exportPerformanceToPdfWithOptions(performance, eventFrame, pdfOptions, showToast);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* PDF Options */}
        <PerformancePdfOptions
          options={pdfOptions}
          onOptionsChange={setPdfOptions}
          onExport={handleExportCustomPdf}
          disabled={!performance.name}
        />

        {/* Input List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Tooltip text={t('performances.input_list_tooltip')}>
              <h3 className="text-lg font-semibold">{t('performances.input_list_title')}</h3>
            </Tooltip>
            <div className="flex gap-2">
              <Tooltip text={t('performances.preview_inputs_tooltip')}>
                <button
                  onClick={handlePreviewInputs}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  {t('performances.preview_inputs')}
                </button>
              </Tooltip>
              <Tooltip text={t('performances.export_inputs_tooltip')}>
                <button
                  onClick={handleExportInputs}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
                >
                  <PdfIcon className="w-4 h-4" />
                  {t('performances.export_inputs')}
                </button>
              </Tooltip>
              <Tooltip text={t('performances.add_input_tooltip')}>
                <button
                  onClick={addInputItem}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <PlusIcon className="w-4 h-4 inline mr-1" />
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
      </div>
    </DndContext>
  );
};

export default PerformanceTechForm;
