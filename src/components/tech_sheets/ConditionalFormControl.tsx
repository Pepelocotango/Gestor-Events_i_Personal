import React from 'react';
import { ConditionalStatus } from '../../types';
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
      className="block w-28 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      <option>--</option>
      <option>SI</option>
      <option>NO</option>
    </select>
  );

  return (
    <div className={`mb-3 col-span-full border-t border-gray-200 dark:border-gray-700 pt-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="block text-md font-semibold text-gray-800 dark:text-gray-200">{label}</label>
        {tooltipText ? (
          <Tooltip text={tooltipText}>
            {selectElement}
          </Tooltip>
        ) : (
          selectElement
        )}
      </div>
      {status === 'yes' && (
        <div className="mt-3 ml-1 space-y-3 p-4 rounded-lg bg-gray-100 border border-gray-300 dark:bg-transparent dark:border-0 dark:p-0 dark:pl-4 dark:border-l-2 dark:border-indigo-700/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default ConditionalFormControl;
