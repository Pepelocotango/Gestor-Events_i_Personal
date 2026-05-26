/**
 * =============================================================================
 * PERFORMANCE LIST
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de llista d'actuacions amb drag & drop per reordenar.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, dnd-kit i components.
 * - COMPONENT PRINCIPAL: PerformanceList amb llista reordenable.
 * - ESTAT I HANDLERS: Estat de drag & drop i funcions de gestió.
 * - RENDERITZAT: Estructura de llista amb SortablePerformance.
 * =============================================================================
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Performance } from '../../types';
import Tooltip from '../ui/Tooltip';
import { useEventDataStore } from '../../stores/eventDataStore';
import { PlusIcon } from '../../constants';
import SortablePerformance from './SortablePerformance';
import { GripVertical } from 'lucide-react'; // <-- Afegim la icona per l'overlay

interface PerformanceListProps {
  eventFrameId: string;
  performances: Performance[];
  selectedPerformanceId: string | null;
  onSelectPerformance: (performanceId: string | null) => void;
  onAddPerformance: () => void;
  onDeletePerformance: (performanceId: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const PerformanceList: React.FC<PerformanceListProps> = ({
  eventFrameId,
  performances,
  selectedPerformanceId,
  onSelectPerformance,
  onAddPerformance,
  onDeletePerformance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { reorderPerformances } = useEventDataStore();

  // NOU: Estat per saber quina targeta estem arrossegant
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // NOU: Quan comencem a arrossegar, guardem l'ID
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  },[]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); // Netejem l'estat en acabar

    if (over && active.id !== over.id) {
      const oldIndex = performances.findIndex((p) => p.id === active.id);
      const newIndex = performances.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPerformances = [...performances];
        const [reorderedItem] = newPerformances.splice(oldIndex, 1);
        newPerformances.splice(newIndex, 0, reorderedItem);

        reorderPerformances(eventFrameId, newPerformances);
        showToast(t('performances.reorder_success'), 'success');
      }
    }
  },[performances, eventFrameId, reorderPerformances, showToast, t]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  },[]);

  const handleDeletePerformance = useCallback((performanceId: string) => {
    const performance = performances.find(p => p.id === performanceId);
    if (performance) {
      onDeletePerformance(performanceId);
      if (selectedPerformanceId === performanceId) {
        onSelectPerformance(null);
      }
      showToast(t('performances.delete_success', { name: performance.name }), 'success');
    }
  },[performances, selectedPerformanceId, onDeletePerformance, onSelectPerformance, showToast, t]);

  // NOU: Busquem les dades de l'actuació que s'està arrossegant per a l'Overlay
  const activePerformance = useMemo(() => 
    performances.find(p => p.id === activeId)
  , [activeId, performances]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <h3 className="text-lg font-semibold shrink-0">{t('performances.list_title')}</h3>
        <div className="flex gap-2 w-full justify-end">
          <Tooltip text={t('performances.add_tooltip')}>
            <button
              onClick={onAddPerformance}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-success text-success-foreground hover:bg-success/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {t('performances.add_button')}
            </button>
          </Tooltip>
        </div>
      </div>

      {performances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p className="text-sm">{t('performances.no_performances')}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={performances.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {performances.map((performance) => (
                <SortablePerformance
                  key={performance.id}
                  performance={performance}
                  isSelected={selectedPerformanceId === performance.id}
                  onSelect={() => onSelectPerformance(performance.id)}
                  onDelete={() => handleDeletePerformance(performance.id)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Aquest és el "fantasma" en miniatura que arrossegues amb el ratolí */}
          <DragOverlay>
            {activePerformance ? (
              <div className="px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-2xl flex items-center gap-3 opacity-95 scale-105 cursor-grabbing rotate-2 border border-primary/50 w-max max-w-[280px]">
                <GripVertical size={18} className="opacity-70 shrink-0" />
                <span className="font-bold truncate">{activePerformance.name || t('performances.unnamed')}</span>
              </div>
            ) : null}
          </DragOverlay>

        </DndContext>
      )}
    </div>
  );
};

export default PerformanceList;