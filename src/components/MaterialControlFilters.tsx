import React, { useMemo } from 'react';
import { EventFrame } from '../types';
import { MaterialControlFilters as FiltersState } from '../stores/eventDataStore';
import CollapsibleSection from './ui/CollapsibleSection';

interface MaterialControlFiltersProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  availableOrigins: string[];
  availableCategories: string[];
  eventFrames: EventFrame[];
  dateRange?: { start?: string; end?: string };
}

interface CheckboxListProps {
  title: string;
  field: 'selectedEventIds' | 'selectedOrigins' | 'selectedCategories';
  items: any[];
  displayProp: string;
  idProp: string;
}

const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
const commonCheckboxContainerClass = "max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 dark:bg-gray-900/50 dark:border-gray-600";
const commonLabelClass = "flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1";

const MaterialControlFilters: React.FC<MaterialControlFiltersProps> = ({
  filters,
  setFilters,
  availableOrigins,
  availableCategories,
  eventFrames,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [name]: value },
    }));
  };

  const handleMultiSelectChange = (field: 'selectedEventIds' | 'selectedOrigins' | 'selectedCategories', value: string) => {
    setFilters(prev => {
      const currentSelection = prev[field] || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(item => item !== value)
        : [...currentSelection, value];
      return { ...prev, [field]: newSelection };
    });
  };

  const handleSelectAll = (field: 'selectedEventIds' | 'selectedOrigins' | 'selectedCategories', items: { id: string }[] | string[]) => {
    const allIds = items.map(item => (typeof item === 'string' ? item : item.id));
    setFilters(prev => ({ ...prev, [field]: allIds }));
  };

  const handleSelectNone = (field: 'selectedEventIds' | 'selectedOrigins' | 'selectedCategories') => {
    setFilters(prev => ({ ...prev, [field]: [] }));
  };

  const visibleEvents = useMemo(() => {
    const { start, end } = filters.dateRange || {};
    if (!start && !end) {
      return eventFrames;
    }
    return eventFrames.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const filterStart = start ? new Date(start) : null;
      const filterEnd = end ? new Date(end) : null;

      if (filterStart && !isNaN(filterStart.getTime())) {
          if (eventEnd < filterStart) return false;
      }
      if (filterEnd && !isNaN(filterEnd.getTime())) {
          const inclusiveFilterEnd = new Date(filterEnd);
          inclusiveFilterEnd.setDate(inclusiveFilterEnd.getDate() + 1);
          if (eventStart >= inclusiveFilterEnd) return false;
      }

      return true;
    });
  }, [eventFrames, filters.dateRange]);

  const CheckboxList = ({ title, field, items, displayProp, idProp }: CheckboxListProps) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{title}</label>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => handleSelectAll(field, items)} className="text-xs text-blue-600 hover:underline">Tots</button>
        <button onClick={() => handleSelectNone(field)} className="text-xs text-blue-600 hover:underline">Cap</button>
      </div>
      <div className={commonCheckboxContainerClass}>
        {items.map((item: any) => (
          <label key={item[idProp]} className={commonLabelClass}>
            <input
              type="checkbox"
              checked={filters[field]?.includes(item[idProp])}
              onChange={() => handleMultiSelectChange(field, item[idProp])}
              className="rounded"
            />
            <span>{item[displayProp]}</span>
          </label>
        ))}
      </div>
    </div>
  );


  return (
    <CollapsibleSection title="Filtres" defaultOpen={true}>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Text Search */}
                <div className="lg:col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cerca per text</label>
                    <input
                        type="text"
                        id="search"
                        value={filters.searchText || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                        placeholder="Nom, categoria, origen..."
                        className={commonInputClass}
                    />
                </div>
                {/* Date Range */}
                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rang de Dates</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input
                        type="date"
                        name="start"
                        value={filters.dateRange?.start || ''}
                        onChange={handleDateChange}
                        className={commonInputClass + " mt-0"}
                        />
                        <span>-</span>
                        <input
                        type="date"
                        name="end"
                        value={filters.dateRange?.end || ''}
                        onChange={handleDateChange}
                        className={commonInputClass + " mt-0"}
                        />
                    </div>
                </div>

                {/* Events */}
                <div className="lg:col-span-1">
                    <CheckboxList
                        title="Esdeveniments"
                        field="selectedEventIds"
                        items={visibleEvents}
                        displayProp="name"
                        idProp="id"
                    />
                </div>

                {/* Origins */}
                <div className="lg:col-span-1">
                    <CheckboxList
                        title="Orígens"
                        field="selectedOrigins"
                        items={availableOrigins.map(o => ({ id: o, name: o }))}
                        displayProp="name"
                        idProp="id"
                    />
                </div>

                {/* Categories */}
                <div className="lg:col-span-1">
                    <CheckboxList
                        title="Categories"
                        field="selectedCategories"
                        items={availableCategories.map(c => ({ id: c, name: c }))}
                        displayProp="name"
                        idProp="id"
                    />
                </div>
            </div>
        </div>
    </CollapsibleSection>
  );
};

export default MaterialControlFilters;
