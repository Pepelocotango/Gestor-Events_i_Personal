import React, { useState, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../../constants';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isExpanded?: boolean; // Prop per controlar l'estat des de fora
  onToggle?: () => void; // Callback per notificar el canvi d'estat
  id?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  isExpanded,
  onToggle,
  id,
  headerClassName = '',
  contentClassName = ''
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Determina si el component està obert. Prioritza el prop extern si existeix.
  const isOpen = isExpanded !== undefined ? isExpanded : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(prev => !prev);
    }
  };

  const buttonId = id ? `${id}-button` : undefined;
  const contentId = id ? `${id}-content` : undefined;

  // Sincronitza l'estat intern si el prop extern canvia (només per al cas no controlat)
  useEffect(() => {
    if (isExpanded === undefined) {
      setInternalIsOpen(defaultOpen);
    }
  }, [defaultOpen, isExpanded]);

  return (
    <div className="mb-2 bg-white dark:bg-gray-800 shadow rounded-lg">
      <div
        id={buttonId}
        onClick={handleToggle}
        className={`w-full flex justify-between items-center p-3 text-left font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t-lg cursor-pointer ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={contentId}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>
      {isOpen && <div id={contentId} className={`p-4 border-t border-gray-200 dark:border-gray-700 ${contentClassName}`}>{children}</div>}
    </div>
  );
};

export default CollapsibleSection;