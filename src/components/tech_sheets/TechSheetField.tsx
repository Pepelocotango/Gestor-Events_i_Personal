import React from 'react';

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
  suggestions?: string[]; // <<< PROPIETAT AFEGIDA
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
  suggestions, // <<< VALOR EXTREIT
}) => {
  const commonClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const datalistId = suggestions ? `${id}-suggestions` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          className={commonClasses}
          required={required}
        />
      ) : (
        <>
          <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={commonClasses}
            required={required}
            list={datalistId} // <<< LÍNIA AFEGIDA
          />
          {suggestions && ( // <<< BLOC AFEGIT
            <datalist id={datalistId}>
              {suggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          )}
        </>
      )}
    </div>
  );
};

export default TechSheetField;