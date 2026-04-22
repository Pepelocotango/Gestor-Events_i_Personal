/**
 * =============================================================================
 * SORTABLE INPUT ROW
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de fila reordenable per a llistes d'inputs amb drag & drop.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: SortableInputRow amb inputs reordenables.
 * =============================================================================
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { InputListItem } from '../../types';
import { TrashIcon } from '../../constants';

interface SortableInputRowProps {
  item: InputListItem;
  onChange: (id: string, field: keyof InputListItem, value: any) => void;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

const SortableInputRow: React.FC<SortableInputRowProps> = ({
  item,
  onChange,
  onRemove,
  t,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Colors for patch
  const patchColors = [
    { name: 'transparent', class: 'bg-transparent border border-gray-300' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'yellow', class: 'bg-yellow-400' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'brown', class: 'bg-amber-700' },
  ];

  const currentColorIndex = patchColors.findIndex(color => color.name === item.patchColor);
  const nextColor = patchColors[(currentColorIndex + 1) % patchColors.length];

  const handlePatchColorClick = () => {
    onChange(item.id, 'patchColor', nextColor.name);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-border hover:bg-muted/30 ${
        isDragging ? 'opacity-50 rotate-1 scale-95' : ''
      }`}
    >
      {/* Drag Handle */}
      <td className="w-10 text-center">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded cursor-grab focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={t('performances.drag_tooltip')}
        >
          <GripVertical size={16} />
        </button>
      </td>

      {/* Patch */}
      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePatchColorClick}
            className={`w-6 h-6 rounded-full border-2 border-gray-400 transition-colors ${
              patchColors.find(color => color.name === item.patchColor)?.class || patchColors[0].class
            }`}
            aria-label={t('performances.patch_header')}
          />
          <input
            type="text"
            value={item.patchNumber || ''}
            onChange={(e) => onChange(item.id, 'patchNumber', e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-8 px-1 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="#"
          />
        </div>
      </td>

      {/* Channel */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.channel || ''}
          onChange={(e) => onChange(item.id, 'channel', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-10 px-1 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.channel_placeholder')}
        />
      </td>

      {/* Label */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange(item.id, 'label', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.label_placeholder')}
        />
      </td>

      {/* Mic (Rider) */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.micRider}
          onChange={(e) => onChange(item.id, 'micRider', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.mic_di_placeholder')}
        />
      </td>

      {/* Mic (Contra) */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.micContra}
          onChange={(e) => onChange(item.id, 'micContra', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.mic_di_placeholder')}
        />
      </td>

      {/* Stand */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.stand}
          onChange={(e) => onChange(item.id, 'stand', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.stand_placeholder')}
        />
      </td>

      {/* Notes */}
      <td className="py-2 px-2">
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onChange(item.id, 'notes', e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full px-2 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={t('performances.notes_placeholder')}
        />
      </td>

      {/* Delete Button */}
      <td className="py-2 px-2 text-center">
        <button
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:bg-destructive/10 rounded p-1 focus:outline-none focus:ring-2 focus:ring-destructive"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default SortableInputRow;
