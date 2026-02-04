import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Performance } from '../../types';
import Tooltip from '../ui/Tooltip';
import { TrashIcon } from '../../constants';

interface SortablePerformanceProps {
  performance: Performance;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const SortablePerformance: React.FC<SortablePerformanceProps> = ({
  performance,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: performance.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('performances.status.confirmed');
      case 'cancelled':
        return t('performances.status.cancelled');
      default:
        return t('performances.status.pending');
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`
          relative p-4 border rounded-lg cursor-pointer transition-all
          ${isSelected 
            ? 'border-primary bg-primary/5 shadow-sm' 
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
        `}
        onClick={onSelect}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -left-6 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md cursor-grab focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t('performances.drag_tooltip')}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </button>

        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium truncate">
                {performance.name || t('performances.unnamed')}
              </h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(performance.status)}`}>
                {getStatusText(performance.status)}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {performance.type && (
                <span>{performance.type}</span>
              )}
              {performance.showTime && (
                <span>{t('performances.show_time')}: {performance.showTime}</span>
              )}
              {performance.contactName && (
                <span>{t('performances.contact')}: {performance.contactName}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Tooltip text={t('performances.delete_tooltip')}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortablePerformance;
