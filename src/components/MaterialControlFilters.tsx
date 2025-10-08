import React, { useMemo } from 'react';
import { EventFrame } from '../types';
import { MaterialControlFilters as FiltersState } from '../stores/eventDataStore';
import CollapsibleSection from './ui/CollapsibleSection';
import Tooltip from './ui/Tooltip';

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

const commonInputClass = "mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm";
const commonCheckboxContainerClass = "max-h-40 overflow-y-auto p-2 border border-input rounded-md bg-muted/50";
const commonLabelClass = "flex items-center space-x-2 cursor-pointer hover:bg-accent rounded p-1";

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
      <label className="block text-sm font-medium text-muted-foreground">{title}</label>
      <div className="flex items-center gap-2 mt-1">
        <Tooltip text={`Selecciona tots els ${title.toLowerCase()}.`}>
            <button onClick={() => handleSelectAll(field, items)} className="text-xs text-primary hover:underline">Tots</button>
        </Tooltip>
        <Tooltip text={`Deselecciona tots els ${title.toLowerCase()}.`}>
            <button onClick={() => handleSelectNone(field)} className="text-xs text-primary hover:underline">Cap</button>
        </Tooltip>
      </div>
      <div className={commonCheckboxContainerClass}>
        {items.map((item: any) => (
          <label key={item[idProp]} className={commonLabelClass}>
            <input
              type="checkbox"
              checked={filters[field]?.includes(item[idProp])}
              onChange={() => handleMultiSelectChange(field, item[idProp])}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-foreground">{item[displayProp]}</span>
          </label>
        ))}
      </div>
    </div>
  );


  return (
    <CollapsibleSection title="Filtres" defaultOpen={true}>
        <div className="p-4 bg-card text-card-foreground rounded-b-lg border-t border-border space-y-4">
            {/* Fila 1: Cerca i Rang de dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Text Search */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-muted-foreground">Cerca per text</label>
                    <Tooltip text="Filtra la taula per qualsevol text present a les files (nom, categoria, origen, etc.).">
                        <input
                            type="text"
                            id="search"
                            value={filters.searchText || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                            placeholder="Nom, categoria, origen..."
                            className={commonInputClass}
                        />
                    </Tooltip>
                </div>
                {/* Date Range */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Rang de Dates</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <Tooltip text="Filtra els esdeveniments per data d'inici.">
                            <input
                                type="date"
                                name="start"
                                value={filters.dateRange?.start || ''}
                                onChange={handleDateChange}
                                className={commonInputClass + " mt-0"}
                            />
                        </Tooltip>
                        <span>-</span>
                        <Tooltip text="Filtra els esdeveniments per data de finalització.">
                            <input
                                type="date"
                                name="end"
                                value={filters.dateRange?.end || ''}
                                onChange={handleDateChange}
                                className={commonInputClass + " mt-0"}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Fila 2: Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Events */}
                <div>
                    <CheckboxList
                        title="Esdeveniments"
                        field="selectedEventIds"
                        items={visibleEvents}
                        displayProp="name"
                        idProp="id"
                    />
                </div>

                {/* Origins */}
                <div>
                    <CheckboxList
                        title="Orígens"
                        field="selectedOrigins"
                        items={availableOrigins.map(o => ({ id: o, name: o }))}
                        displayProp="name"
                        idProp="id"
                    />
                </div>

                {/* Categories */}
                <div>
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
