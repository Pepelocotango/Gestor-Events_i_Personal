import React from 'react';
import { ConditionalStatus } from '@gep/core';
import Tooltip from '../ui/Tooltip';

interface ConditionalFormControlProps {
  label: string;
  status: ConditionalStatus;
  onStatusChange: (newStatus: ConditionalStatus) => void;
  children: React.ReactNode;
  className?: string;
  tooltipText?: string;
}

const ConditionalFormControl: React.FC<ConditionalFormControlProps> = ({
  label,
  status,
  onStatusChange,
  children,
  className = '',
  tooltipText,
}) => {
  const valueMap = {
    'unset': '--',
    'yes': 'SI',
    'no': 'NO',
  };

  const statusToDisplay = (s: ConditionalStatus): string => valueMap[s] || '--';
  const displayToStatus = (d: string): ConditionalStatus => {
    return (Object.keys(valueMap) as ConditionalStatus[]).find(key => valueMap[key] === d) || 'unset';
  }

  const selectElement = (
    <select
      value={statusToDisplay(status)}
      onChange={(e) => onStatusChange(displayToStatus(e.target.value))}
      className="block w-28 pl-3 pr-10 py-1 text-base bg-input border-border focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm rounded-md"
    >
      <option>--</option>
      <option>SI</option>
      <option>NO</option>
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
      </div>
      {status === 'yes' && (
        <div className="mt-3 ml-1 space-y-3 p-4 rounded-lg bg-muted/50 border border-border dark:bg-transparent dark:border-0 dark:p-0 dark:pl-4 dark:border-l-2 dark:border-primary/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default ConditionalFormControl;
