import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
      </div>
      {status === 'yes' && (
        <div className="mt-3 ml-1 space-y-3 p-4 rounded-lg bg-muted/50 border border-border dark:bg-transparent dark:border-0 dark:p-0 dark:pl-4 dark:border-l-2 dark:border-primary/50">
          {children}
        </div>
      )}
    </div>
  );
};

export default React.memo(ConditionalFormControl);

