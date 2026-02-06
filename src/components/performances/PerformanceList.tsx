import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface PerformanceListProps {
  eventFrameId: string;
  performances: Performance[];
  selectedPerformanceId: string | null;
  onSelectPerformance: (performanceId: string | null) => void;
  onAddPerformance: () => void;
  onDeletePerformance: (performanceId: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

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
  }, [performances, eventFrameId, reorderPerformances, showToast, t]);

  const handleDeletePerformance = useCallback((performanceId: string) => {
    const performance = performances.find(p => p.id === performanceId);
    if (performance) {
      onDeletePerformance(performanceId);
      if (selectedPerformanceId === performanceId) {
        onSelectPerformance(null);
      }
      showToast(t('performances.delete_success', { name: performance.name }), 'success');
    }
  }, [performances, selectedPerformanceId, onDeletePerformance, onSelectPerformance, showToast, t]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('performances.list_title')}</h3>
        <Tooltip text={t('performances.add_tooltip')}>
          <button
            onClick={onAddPerformance}
            className="w-full px-4 py-2 rounded-md text-sm font-semibold bg-success text-success-foreground hover:bg-success/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <PlusIcon className="w-4 h-4 inline mr-2" />
            {t('performances.add_button')}
          </button>
        </Tooltip>
      </div>

      {performances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p className="text-sm">{t('performances.no_performances')}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
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
        </DndContext>
      )}
    </div>
  );
};

export default PerformanceList;
