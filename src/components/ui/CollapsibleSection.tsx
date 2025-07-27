import React, { useState, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../../constants';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false, 
  id,
  headerClassName = '',
  contentClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const buttonId = id ? `${id}-button` : undefined;
  const contentId = id ? `${id}-content` : undefined;

  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);

  return (
    <div className="mb-2 bg-white dark:bg-gray-800 shadow rounded-lg">
      <button 
        id={buttonId} 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full flex justify-between items-center p-3 text-left font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t-lg ${headerClassName}`} 
        aria-expanded={isOpen} 
        aria-controls={contentId}
      >
        <div className="flex items-center gap-2">
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      {isOpen && <div id={contentId} className={`p-4 border-t border-gray-200 dark:border-gray-700 ${contentClassName}`}>{children}</div>}
    </div>
  );
};

export default CollapsibleSection;