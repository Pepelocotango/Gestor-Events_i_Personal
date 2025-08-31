import React from 'react';

interface ConditionalFormControlProps {
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const ConditionalFormControl: React.FC<ConditionalFormControlProps> = ({
  label,
  enabled,
  onToggle,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-3 col-span-full border-t border-gray-200 dark:border-gray-700 pt-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="block text-md font-semibold text-gray-800 dark:text-gray-200">{label}</label>
        <select
          value={enabled ? 'SI' : 'NO'}
          onChange={(e) => onToggle(e.target.value === 'SI')}
          className="block w-28 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option>NO</option>
          <option>SI</option>
        </select>
      </div>
      {enabled && (
        <div className="mt-3 pl-4 border-l-2 border-indigo-500/30 dark:border-indigo-700/50 ml-1 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default ConditionalFormControl;
