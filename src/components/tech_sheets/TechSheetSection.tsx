import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from '../../constants';
import Tooltip from '../ui/Tooltip';


interface TechSheetSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
  layout?: 'single-column' | 'grid-2' | 'grid-3' | 'grid-4';
  isPrintHidden?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const TechSheetSection: React.FC<TechSheetSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  headerActions,
  layout = 'grid-3',
  isPrintHidden = false,
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const { t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(prev => !prev);
    }
  };

  let gridClasses = 'p-2 grid gap-4 ';
  switch (layout) {
    case 'single-column':
      gridClasses += 'grid-cols-1';
      break;
    case 'grid-2':
      gridClasses += 'grid-cols-1 md:grid-cols-2';
      break;
    case 'grid-3':
      gridClasses += 'grid-cols-1 md:grid-cols-3';
      break;
    case 'grid-4':
      gridClasses += 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      break;
    default:
      gridClasses += 'grid-cols-1 md:grid-cols-3';
  }

  const containerClasses = `mb-2 border border-border rounded-lg ${isPrintHidden ? 'no-print' : ''}`;

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between bg-muted/50 rounded-t-lg">
        <Tooltip text={isOpen ? t('common.collapse_section', { name: title }) : t('common.expand_section', { name: title })}>
          <button
            type="button"
            onClick={handleToggle}
            className="flex-1 flex justify-between items-center p-2 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-ring"
            aria-expanded={isOpen}
          >
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-muted-foreground" /> : <ChevronDownIcon className="w-5 h-5 text-muted-foreground" />}
          </button>
        </Tooltip>
        {headerActions && <div className="pr-3">{headerActions}</div>}
      </div>
      {isOpen && (
        <div className={gridClasses}>
          {children}
        </div>
      )}
    </div>
  );
};

export default TechSheetSection;
