import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableProviderProps {
  id: string;
  children: React.ReactNode;
}

const SortableProvider: React.FC<SortableProviderProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative', // Ensure the parent is a positioning context for the handle
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* The children are the draggable cards themselves */}
      {React.cloneElement(children as React.ReactElement, {
        // Pass down a drag handle
        dragHandle: (
          <button
            {...attributes}
            {...listeners}
            className="absolute top-1/2 -left-6 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-grab focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Reordenar proveïdor"
          >
            <GripVertical size={24} />
          </button>
        ),
      })}
    </div>
  );
};

export default SortableProvider;