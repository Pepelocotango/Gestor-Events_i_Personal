/**
 * =============================================================================
 * CONDITIONAL FORM CONTROL
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de control de formulari condicional amb estats yes/no/unset.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: ConditionalFormControl amb estat i contingut condicional.
 * =============================================================================
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConditionalStatus } from '../../types';
import Tooltip from '../ui/Tooltip';
import { ChevronDownIcon, ChevronUpIcon } from '../../constants';

interface ConditionalFormControlProps {
  label: string;
  status: ConditionalStatus;
  onStatusChange: (newStatus: ConditionalStatus) => void;
  children: React.ReactNode;
  className?: string;
  tooltipText?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

const ConditionalFormControl: React.FC<ConditionalFormControlProps> = ({
  label,
  status,
  onStatusChange,
  children,
  className = '',
  tooltipText,
  isCollapsible = false,
  defaultExpanded = true,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const selectElement = (
    <select
      value={status}
      onChange={(e) => onStatusChange(e.target.value as ConditionalStatus)}
      className="block w-28 pl-3 pr-10 py-1 text-base bg-input border-border focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm rounded-md"
    >
      <option value="unset">{t('common.status.pending')}</option>
      <option value="yes">{t('common.status.yes')}</option>
      <option value="no">{t('common.status.no')}</option>
    </select>
  );

  return (
    <div className={`mb-3 col-span-full border-t border-border pt-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="block text-md font-semibold text-foreground">{label}</label>
        {tooltipText ? (
          <Tooltip text={tooltipText}>
            {selectElement}
          </Tooltip>
        ) : (
          selectElement
        )}
        {status === 'yes' && isCollapsible && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors ml-auto"
          >
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        )}
      </div>
      {status === 'yes' && (!isCollapsible || isExpanded) && (
        <div className="mt-3 ml-1 space-y-3 p-4 rounded-lg bg-muted/50 border border-border dark:bg-transparent dark:border-0 dark:p-0 dark:pl-4 dark:border-l-2 dark:border-primary/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default React.memo(ConditionalFormControl);

