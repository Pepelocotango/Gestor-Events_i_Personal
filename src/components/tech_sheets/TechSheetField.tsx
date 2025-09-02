import React, { memo } from 'react';
import Tooltip from '../ui/Tooltip';

interface TechSheetFieldProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  required?: boolean;
  suggestions?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  infoText?: string;
  className?: string;
  tooltipText?: string;
}

const TechSheetField: React.FC<TechSheetFieldProps> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder = '',
  as = 'input',
  rows = 3,
  required = false,
  suggestions,
  disabled = false,
  readOnly = false,
  infoText,
  className = '',
  tooltipText,
}) => {
  const baseClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const disabledClasses = "disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed";
  const readOnlyClasses = "read-only:bg-gray-100 dark:read-only:bg-gray-500";

  const finalClassName = `${baseClasses} ${disabledClasses} ${readOnlyClasses} ${className}`.trim();

  const datalistId = suggestions ? `${id}-suggestions` : undefined;

  const fieldContent = (
    <div className="flex-grow">
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          className={finalClassName}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={finalClassName}
          required={required}
          list={datalistId}
          disabled={disabled}
          readOnly={readOnly}
        />
      )}
    </div>
  );

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {tooltipText ? (
          <Tooltip text={tooltipText}>
            {fieldContent}
          </Tooltip>
        ) : (
          fieldContent
        )}
        {infoText && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">{infoText}</span>}
      </div>
      
      {suggestions && (
        <datalist id={datalistId}>
          {suggestions.map((suggestion, index) => (
            <option key={index} value={suggestion} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default memo(TechSheetField);