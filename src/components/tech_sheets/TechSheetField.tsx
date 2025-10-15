import React, { memo, useRef } from 'react';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';

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
  rows = 1, // Default to 1 row for autosize to work correctly from a minimal height
  required = false,
  suggestions,
  disabled = false,
  readOnly = false,
  infoText,
  className = '',
  tooltipText,
}) => {
  const baseClasses = "mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-muted/50";

  const finalClassName = `${baseClasses} ${className}`.trim();

  const datalistId = suggestions ? `${id}-suggestions` : undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fieldContent = (
    <div className="flex-grow">
      {as === 'textarea' ? (
        <AutosizeTextarea
          ref={textareaRef}
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
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex items-center gap-2">
        {tooltipText ? (
          <Tooltip text={tooltipText}>
            {fieldContent}
          </Tooltip>
        ) : (
          fieldContent
        )}
        {infoText && <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{infoText}</span>}
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