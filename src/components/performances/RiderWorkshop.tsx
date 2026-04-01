import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Music, 
  Trash2, 
  Filter,
  Package,
  GripVertical,
  Plus,
  Copy,
  LayoutGridIcon,
  ChartBarIcon,
  MousePointerClick
} from 'lucide-react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { notificationService } from '../../utils/notificationService';
import Tooltip from '../ui/Tooltip';
import { 
  InputListItem, 
  MaterialItem,
  PerformanceTechData,
  Performance,
  MonitorListItem
} from '../../types';
import { useBufferedSave } from '../../hooks/useBufferedSave';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub-components ---

interface InventoryItemProps {
  item: MaterialItem;
  availability: { available: number; total: number };
  eventFrame: any;
  techData: PerformanceTechData;
  performance?: Performance;
  onClick: (item: MaterialItem) => void;
  isSelectionActive: boolean;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, availability, eventFrame, techData, performance, onClick, isSelectionActive }) => {
  const isOutOfStock = availability.available <= 0;
  const isNegativeStock = availability.available < 0;

  // Calcular totes les assignacions d'aquest material
  interface MaterialAssignment {
    eventName: string;
    performanceName: string;
    quantity: number;
  }

  const getAssignments = (): MaterialAssignment[] => {
    const assignments: MaterialAssignment[] =[];
    
    techData.inputList
      .filter((input: InputListItem) => input.micContraId === item.id || input.standId === item.id)
      .forEach(() => {
        assignments.push({
          eventName: eventFrame.name || 'Esdeveniment',
          performanceName: performance?.name || 'Actuació actual',
          quantity: 1
        });
      });

    (techData.monitorList || [])
      .filter((monitor: MonitorListItem) => monitor.mixContraId === item.id || monitor.mixStandId === item.id)
      .forEach(() => {
        assignments.push({
          eventName: eventFrame.name || 'Esdeveniment',
          performanceName: performance?.name || 'Actuació actual',
          quantity: 1
        });
      });

    eventFrame.performances?.forEach((perf: Performance) => {
      if (perf.id !== performance?.id) { 
        perf.techData?.inputList?.forEach((input: InputListItem) => {
          if (input.micContraId === item.id || input.standId === item.id) {
            assignments.push({
              eventName: eventFrame.name || 'Esdeveniment',
              performanceName: perf.name,
              quantity: 1
            });
          }
        });
        perf.techData?.monitorList?.forEach((monitor: MonitorListItem) => {
          if (monitor.mixContraId === item.id || monitor.mixStandId === item.id) {
            assignments.push({
              eventName: eventFrame.name || 'Esdeveniment',
              performanceName: perf.name,
              quantity: 1
            });
          }
        });
      }
    });

    if (eventFrame.techSheet) {
      const needsKeys =['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment'];
      needsKeys.forEach(key => {
        const section = eventFrame.techSheet[key];
        if (section && section.status === 'yes' && Array.isArray(section.data?.needs)) {
          section.data.needs.forEach((need: any) => {
            if (need.materialItemId === item.id) {
              assignments.push({
                eventName: eventFrame.name || 'Esdeveniment',
                performanceName: 'Fitxa Tècnica',
                quantity: Number(need.quantity) || 1
              });
            }
          });
        }
      });
    }

    return assignments;
  };

  const assignments = getAssignments();

  // Comprovar si aquest material està assignat al rider actual
  const isCurrentlyAssigned = techData.inputList.some(
    (input: InputListItem) => input.micContraId === item.id || input.standId === item.id
  ) || (techData.monitorList || []).some(
    (monitor: MonitorListItem) => monitor.mixContraId === item.id || monitor.mixStandId === item.id
  );

  return (
    <div
      onClick={() => onClick(item)}
      className={`p-2 mb-2 rounded border transition-all ${
        isSelectionActive ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:border-primary' : 'cursor-default opacity-80'
      } ${
        isCurrentlyAssigned ? 'ring-2 ring-success/50 bg-success/5 border-success/30 shadow-sm' :
        isNegativeStock ? 'bg-destructive/20 border-destructive/50 animate-pulse' : 
        isOutOfStock ? 'bg-muted/50 border-border grayscale text-muted-foreground' : 
        'bg-card border-border shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center text-sm">
        <span className={`font-medium truncate mr-2 ${
          isNegativeStock ? 'text-destructive font-bold' : ''
        }`}>{item.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          isNegativeStock ? 'bg-destructive text-destructive-foreground animate-pulse' : 
          isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}>
          {availability.available}/{item.stock}
        </span>
      </div>
      {item.location && <div className="text-[10px] text-muted-foreground truncate">{item.location}</div>}
      {assignments.length > 0 && (
        <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
          {assignments.map((assignment, idx) => (
            <div key={idx} className="truncate">
              {assignment.eventName}: {assignment.performanceName}: {assignment.quantity}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Fila de la Taula ---

interface WorkshopRowProps {
  item: InputListItem;
  onChange: (id: string, field: keyof InputListItem, value: any) => void;
  onRemove: (id: string) => void;
  activeCell: { id: string; field: 'micContra' | 'stand' } | null;
  onCellFocus: (id: string, field: 'micContra' | 'stand') => void;
}

const WorkshopRow: React.FC<WorkshopRowProps> = ({ item, onChange, onRemove, activeCell, onCellFocus }) => {
  const { t } = useTranslation();
  const { getMaterialAvailability, eventFrames } = useEventDataStore();
  const { eventFrameId } = useParams<{ eventFrameId: string }>();
  
  const eventFrame = useMemo(() => eventFrameId ? eventFrames.find(ef => ef.id === eventFrameId) : null, [eventFrameId, eventFrames]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const checkAvailability = (materialId?: string) => {
    if (!materialId || !eventFrame) return { isError: false, available: 0 };
    const avail = getMaterialAvailability(materialId, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
    return { isError: avail.available < 0, available: avail.available };
  };

  const micStatus = checkAvailability(item.micContraId);
  const standStatus = checkAvailability(item.standId);

  const patchColors =[
    { name: 'transparent', class: 'bg-transparent border border-gray-300' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'yellow', class: 'bg-yellow-400' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'brown', class: 'bg-amber-700' },
  ];

  const currentColorIndex = patchColors.findIndex(color => color.name === item.patchColor);
  const nextColor = patchColors[(currentColorIndex + 1) % patchColors.length];

  const isMicActive = activeCell?.id === item.id && activeCell?.field === 'micContra';
  const isStandActive = activeCell?.id === item.id && activeCell?.field === 'stand';

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-muted/30 transition-colors ${isDragging ? 'bg-accent/50 shadow-lg' : ''}`}
    >
      <td className="w-10 text-center border-r border-border/50">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-2">
          <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
        </div>
      </td>
      
      <td className="py-1 px-1 w-24">
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => onChange(item.id, 'patchColor', nextColor.name)}
            className={`w-5 h-5 rounded-full border border-border shadow-sm shrink-0 ${
              patchColors.find(c => c.name === item.patchColor)?.class || 'bg-transparent'
            }`}
          />
          <input
            type="text"
            value={item.patchNumber || ''}
            onChange={(e) => onChange(item.id, 'patchNumber', e.target.value)}
            className="w-10 px-1 py-1 bg-muted/50 border border-border rounded text-xs text-center focus:ring-1 focus:ring-primary font-bold"
            placeholder="#"
          />
        </div>
      </td>

      <td className="py-1 px-1 w-16">
        <input
          type="text"
          value={item.channel || ''}
          onChange={(e) => onChange(item.id, 'channel', e.target.value)}
          className="w-full px-1 py-1 bg-transparent border-none text-sm font-mono text-center focus:ring-1 focus:ring-primary font-bold"
          placeholder="CH"
        />
      </td>

      <td className="py-1 px-1 min-w-[150px]">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange(item.id, 'label', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:ring-1 focus:ring-primary font-bold"
          placeholder={t('performances.label_placeholder')}
        />
      </td>

      <td className="py-1 px-1 text-muted-foreground italic min-w-[150px]">
        <input
          type="text"
          value={item.micRider}
          onChange={(e) => onChange(item.id, 'micRider', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm italic focus:ring-1 focus:ring-primary"
          placeholder={t('performances.mic_di_placeholder')}
        />
      </td>

      <td className={`py-1 px-1 min-w-[160px] transition-colors ${micStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <div className={`relative flex items-center rounded border ${isMicActive ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-transparent'}`}>
          <input
            type="text"
            value={item.micContra}
            onChange={(e) => onChange(item.id, 'micContra', e.target.value)}
            onFocus={() => onCellFocus(item.id, 'micContra')}
            className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
            placeholder="Clic per assignar..."
          />
          {micStatus.isError && (
            <Tooltip text="Sense estoc disponible!">
              <div className="absolute right-2 text-destructive pointer-events-none">
                <Package className="w-4 h-4 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>
      </td>

      <td className={`py-1 px-1 min-w-[160px] transition-colors ${standStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <div className={`relative flex items-center rounded border ${isStandActive ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-transparent'}`}>
          <input
            type="text"
            value={item.stand}
            onChange={(e) => onChange(item.id, 'stand', e.target.value)}
            onFocus={() => onCellFocus(item.id, 'stand')}
            className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
            placeholder="Clic per assignar..."
          />
          {standStatus.isError && (
            <Tooltip text="Sense estoc disponible!">
              <div className="absolute right-2 text-destructive pointer-events-none">
                <Package className="w-4 h-4 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>
      </td>

      <td className="py-1 px-1">
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onChange(item.id, 'notes', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm text-muted-foreground focus:ring-1 focus:ring-primary"
          placeholder="..."
        />
      </td>

      <td className="py-1 px-1 text-center w-10 border-l border-border/50">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// --- Fila de Monitor/Auxiliar ---

interface MonitorRowProps {
  item: MonitorListItem;
  onChange: (id: string, field: keyof MonitorListItem, value: any) => void;
  onRemove: (id: string) => void;
  activeCell: { id: string; field: 'mixContra' | 'mixStand' } | null;
  onCellFocus: (id: string, field: 'mixContra' | 'mixStand') => void;
}

const MonitorRow: React.FC<MonitorRowProps> = ({ item, onChange, onRemove, activeCell, onCellFocus }) => {
  const { getMaterialAvailability, eventFrames } = useEventDataStore();
  const { eventFrameId } = useParams<{ eventFrameId: string }>();
  
  const eventFrame = useMemo(() => eventFrameId ? eventFrames.find(ef => ef.id === eventFrameId) : null, [eventFrameId, eventFrames]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const checkAvailability = (materialId?: string) => {
    if (!materialId || !eventFrame) return { isError: false, available: 0 };
    const avail = getMaterialAvailability(materialId, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
    return { isError: avail.available < 0, available: avail.available };
  };

  const mixContraStatus = checkAvailability(item.mixContraId);
  const mixStandStatus = checkAvailability(item.mixStandId);

  const isMixContraActive = activeCell?.id === item.id && activeCell?.field === 'mixContra';
  const isMixStandActive = activeCell?.id === item.id && activeCell?.field === 'mixStand';

  const patchColors =[
    { name: 'transparent', class: 'bg-transparent border border-gray-300' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'yellow', class: 'bg-yellow-400' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'brown', class: 'bg-amber-700' },
  ];

  const currentColorIndex = patchColors.findIndex(color => color.name === item.patchColor);
  const nextColor = patchColors[(currentColorIndex + 1) % patchColors.length];

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-muted/30 transition-colors ${isDragging ? 'bg-accent/50 shadow-lg' : ''}`}
    >
      <td className="w-10 text-center border-r border-border/50">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2">
          <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
        </div>
      </td>
      
      <td className="py-1 px-1 w-24">
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => onChange(item.id, 'patchColor', nextColor.name)}
            className={`w-5 h-5 rounded-full border border-border shadow-sm shrink-0 ${
              patchColors.find(c => c.name === item.patchColor)?.class || 'bg-transparent'
            }`}
          />
          <input
            type="text"
            value={item.patchNumber || ''}
            onChange={(e) => onChange(item.id, 'patchNumber', e.target.value)}
            className="w-10 px-1 py-1 bg-muted/50 border border-border rounded text-xs text-center focus:ring-1 focus:ring-primary font-bold"
            placeholder="#"
          />
        </div>
      </td>

      <td className="py-1 px-1 w-16">
        <input
          type="text"
          value={item.outputChannel || ''}
          onChange={(e) => onChange(item.id, 'outputChannel', e.target.value)}
          className="w-full px-1 py-1 bg-transparent border-none text-sm font-mono text-center focus:ring-1 focus:ring-primary font-bold"
          placeholder="A1"
        />
      </td>

      <td className="py-1 px-1 min-w-[150px]">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange(item.id, 'label', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:ring-1 focus:ring-primary font-bold"
          placeholder="Monitor/MIX..."
        />
      </td>

      <td className="py-1 px-1 text-muted-foreground italic min-w-[150px]">
        <input
          type="text"
          value={item.mixRider}
          onChange={(e) => onChange(item.id, 'mixRider', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm italic focus:ring-1 focus:ring-primary"
          placeholder="MIX demanat..."
        />
      </td>

      <td className={`py-1 px-1 min-w-[160px] transition-colors ${mixContraStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <div className={`relative flex items-center rounded border ${isMixContraActive ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-transparent'}`}>
          <input
            type="text"
            value={item.mixContra}
            onChange={(e) => onChange(item.id, 'mixContra', e.target.value)}
            onFocus={() => onCellFocus(item.id, 'mixContra')}
            className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
            placeholder="Clic per assignar..."
          />
          {mixContraStatus.isError && (
            <Tooltip text="Sense estoc disponible!">
              <div className="absolute right-2 text-destructive pointer-events-none">
                <Package className="w-4 h-4 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>
      </td>

      <td className={`py-1 px-1 min-w-[160px] transition-colors ${mixStandStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <div className={`relative flex items-center rounded border ${isMixStandActive ? 'ring-2 ring-primary border-primary bg-primary/10' : 'border-transparent'}`}>
          <input
            type="text"
            value={item.mixStand || ''}
            onChange={(e) => onChange(item.id, 'mixStand', e.target.value)}
            onFocus={() => onCellFocus(item.id, 'mixStand')}
            className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
            placeholder="Clic per assignar..."
          />
          {mixStandStatus.isError && (
            <Tooltip text="Sense estoc disponible!">
              <div className="absolute right-2 text-destructive pointer-events-none">
                <Package className="w-4 h-4 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>
      </td>

      <td className="py-1 px-1">
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onChange(item.id, 'notes', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm text-muted-foreground focus:ring-1 focus:ring-primary"
          placeholder="..."
        />
      </td>

      <td className="py-1 px-1 text-center w-10 border-l border-border/50">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// --- Selector de Categories ---

interface SearchableCategorySelectorProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  placeholder: string;
}

const SearchableCategorySelector: React.FC<SearchableCategorySelectorProps> = ({ 
  categories, 
  activeCategory, 
  onSelect,
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return categories;
    return categories.filter(cat => cat.toLowerCase().includes(search));
  }, [categories, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  },[]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-background border border-border rounded px-2 py-1 text-[10px] font-bold focus:ring-1 focus:ring-primary outline-none transition-all hover:border-primary/50"
      >
        <span className="truncate">
          {activeCategory === 'all' ? placeholder : activeCategory}
        </span>
        <Filter className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-lg z-[100] flex flex-col overflow-hidden">
          <div className="p-1.5 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 bg-background border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            <button
              onClick={() => {
                onSelect('all');
                setIsOpen(false);
                setSearchTerm('');
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-bold transition-colors ${
                activeCategory === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground'
              }`}
            >
              {placeholder}
            </button>
            {filteredCategories.filter(c => c !== 'all').map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSelect(cat);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-medium transition-colors truncate ${
                  activeCategory === cat 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
            {filteredCategories.length === 0 && (
              <div className="px-2 py-3 text-[10px] text-muted-foreground text-center italic">
                Sense resultats
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Balanç del Rider ---

interface RiderBalanceProps {
  inputList: InputListItem[];
  monitorList: MonitorListItem[];
  eventFrame: { startDate: string; endDate: string; id: string };
  getMaterialAvailability: (id: string, start: string, end: string, frameId: string) => { available: number; total: number };
  performance?: Performance; 
}

const RiderBalance: React.FC<RiderBalanceProps> = ({ inputList, monitorList, eventFrame, getMaterialAvailability, performance }) => {
  const usage = useMemo(() => {
    const counts: Record<string, { id: string; name: string; qty: number }> = {};
    
    inputList.forEach(item => {
      if (item.micContraId) {
        if (!counts[item.micContraId]) counts[item.micContraId] = { id: item.micContraId, name: item.micContra, qty: 0 };
        counts[item.micContraId].qty += 1;
      }
      if (item.standId) {
        if (!counts[item.standId]) counts[item.standId] = { id: item.standId, name: item.stand, qty: 0 };
        counts[item.standId].qty += 1;
      }
    });

    monitorList.forEach(item => {
      if (item.mixContraId) {
        if (!counts[item.mixContraId]) counts[item.mixContraId] = { id: item.mixContraId, name: item.mixContra, qty: 0 };
        counts[item.mixContraId].qty += 1;
      }
      if (item.mixStandId) {
        if (!counts[item.mixStandId]) counts[item.mixStandId] = { id: item.mixStandId, name: item.mixStand, qty: 0 };
        counts[item.mixStandId].qty += 1;
      }
    });
    
    return Object.values(counts).map(u => {
      const globalAvail = getMaterialAvailability(u.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
      
      const savedUsage = (performance?.techData?.inputList?.filter(
        input => input.micContraId === u.id || input.standId === u.id
      ).length || 0) + (performance?.techData?.monitorList?.filter(
        monitor => monitor.mixContraId === u.id || monitor.mixStandId === u.id
      ).length || 0);

      const actualAvailable = globalAvail.available + savedUsage - u.qty;

      return { ...u, available: actualAvailable, isError: actualAvailable < 0 };
    });
  },[inputList, monitorList, getMaterialAvailability, eventFrame, performance]);

  if (usage.length === 0) return null;

  return (
    <div className="p-3 border-t border-border bg-card">
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
        <ChartBarIcon className="w-3 h-3" />
        Balanç del Rider
      </h3>
      <div className="space-y-1.5">
        {usage.map(u => (
          <div key={u.id} className={`flex items-center justify-between p-1.5 rounded border ${u.isError ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-transparent'}`}>
            <span className={`text-[10px] font-medium truncate flex-grow mr-2 ${u.isError ? 'text-destructive font-bold' : ''}`}>
              {u.name}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${u.isError ? 'bg-destructive text-destructive-foreground' : 'bg-primary/10 text-primary'}`}>
              {u.qty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Pantalla Principal ---

const RiderWorkshop: React.FC = () => {
  const { eventFrameId: urlEventFrameId } = useParams<{ eventFrameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { 
    eventFrames,
    materialItems, 
    getMaterialAvailability,
    updatePerformance
  } = useEventDataStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    notificationService[type](message);
  };

  const[selectedEventFrameId, setSelectedEventFrameId] = useState<string | null>(urlEventFrameId || null);
  const[selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);

  // NOU: Estat per saber quina casella està seleccionada (Click to Assign)
  const [activeCell, setActiveCell] = useState<{ id: string; field: 'micContra' | 'stand' | 'mixContra' | 'mixStand' } | null>(null);

  useEffect(() => {
    if (urlEventFrameId) setSelectedEventFrameId(urlEventFrameId);
  }, [urlEventFrameId]);

  const eventFrame = useMemo(() => 
    selectedEventFrameId ? eventFrames.find(ef => ef.id === selectedEventFrameId) : null
  , [selectedEventFrameId, eventFrames]);

  const activeEventFrames = useMemo(() => 
    eventFrames.filter(ef => !ef.isArchived).sort((a, b) => b.startDate.localeCompare(a.startDate))
  , [eventFrames]);

  const[searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const migratedPerformances = useRef<Set<string>>(new Set());

  const performance = useMemo(() => {
    const perf = eventFrame?.performances?.find(p => p.id === selectedPerformanceId);
    
    if (perf && !perf.techData && !migratedPerformances.current.has(perf.id)) {
      migratedPerformances.current.add(perf.id);
      const updatedPerf = {
        ...perf,
        techData: { inputList:[], monitorList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' }
      };
      
      setTimeout(() => {
        if (selectedEventFrameId) updatePerformance(selectedEventFrameId, updatedPerf);
      }, 0);
      return updatedPerf;
    }
    return perf;
  },[eventFrame, selectedPerformanceId, selectedEventFrameId, updatePerformance]);

  const initialTechData = useMemo((): PerformanceTechData => {
    if (performance?.techData) return performance.techData;
    return { inputList:[], monitorList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' };
  }, [performance]);

  const {
    localData: techData,
    localDataRef: techDataRef,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialTechData, (data) => {
    if (selectedEventFrameId && performance) {
      updatePerformance(selectedEventFrameId, { ...performance, techData: data });
    }
  });

  useEffect(() => {
    if (eventFrame?.performances?.length) {
      if (!selectedPerformanceId || !eventFrame.performances.find(p => p.id === selectedPerformanceId)) {
        if (isDirty) saveNow();
        setSelectedPerformanceId(eventFrame.performances[0].id);
        setActiveCell(null); // Netejar selecció al canviar de banda
      }
    } else {
      setSelectedPerformanceId(null);
      setActiveCell(null);
    }
  },[eventFrame, selectedPerformanceId, isDirty, saveNow]);

  const categories = useMemo(() => {
    const cats = new Set(materialItems.map(m => m.category));
    return ['all', ...Array.from(cats)].sort();
  }, [materialItems]);

  const filteredMaterial = useMemo(() => {
    return materialItems.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = activeCategory === 'all' || m.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [materialItems, searchTerm, activeCategory]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Només fem servir el DragEnd per reordenar les files
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      // Comprovar si és un input
      const inputIndex = techData.inputList.findIndex((item) => item.id === active.id);
      if (inputIndex !== -1) {
        const newIndex = techData.inputList.findIndex((item) => item.id === over.id);
        if (newIndex !== -1) {
          updateLocal({ inputList: arrayMove(techData.inputList, inputIndex, newIndex) });
        }
        return;
      }

      // Comprovar si és un monitor
      const monitorIndex = (techData.monitorList || []).findIndex((item) => item.id === active.id);
      if (monitorIndex !== -1) {
        const newIndex = (techData.monitorList || []).findIndex((item) => item.id === over.id);
        if (newIndex !== -1) {
          const newMonitorList = arrayMove(techData.monitorList || [], monitorIndex, newIndex);
          updateLocal({ monitorList: newMonitorList });
        }
        return;
      }
    }
  };

  // NOU: Funció unificada per canviar inputs (tant si s'escriu com si es clica a l'inventari)
  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    const newInputList = techDataRef.current.inputList.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item,[field]: value };
        
        // Auto-vincular l'ID si el text coincideix exactament amb un material de l'inventari
        if (field === 'micContra') {
          const matched = materialItems.find(m => m.name === value);
          updatedItem.micContraId = matched ? matched.id : undefined;
        }
        if (field === 'stand') {
          const matched = materialItems.find(m => m.name === value);
          updatedItem.standId = matched ? matched.id : undefined;
        }
        return updatedItem;
      }
      return item;
    });
    updateLocal({ inputList: newInputList });
  };

  // Helper functions to filter activeCell types
  const getWorkshopActiveCell = (): { id: string; field: 'micContra' | 'stand' } | null => {
    if (!activeCell) return null;
    if (activeCell.field === 'micContra' || activeCell.field === 'stand') {
      return activeCell as { id: string; field: 'micContra' | 'stand' };
    }
    return null;
  };

  const getMonitorActiveCell = (): { id: string; field: 'mixContra' | 'mixStand' } | null => {
    if (!activeCell) return null;
    if (activeCell.field === 'mixContra' || activeCell.field === 'mixStand') {
      return activeCell as { id: string; field: 'mixContra' | 'mixStand' };
    }
    return null;
  };

  // NOU: Clicar a un material de l'inventari l'assigna a la casella activa
  const handleMaterialClick = (material: MaterialItem) => {
    if (activeCell) {
      if (activeCell.field === 'mixContra' || activeCell.field === 'mixStand') {
        handleMonitorChange(activeCell.id, activeCell.field, material.name);
      } else {
        handleInputChange(activeCell.id, activeCell.field, material.name);
      }
      showToast(`${material.name} assignat`, 'success');
    } else {
      const message = "Fes clic a una casella per poder assignar material.";
      showToast(message, "info");
    }
  };

  const addInputItem = () => {
    const currentList = techDataRef.current.inputList;
    const lastItem = currentList[currentList.length - 1];
    let newChannel = '';
    if (lastItem?.channel) {
      const lastChannel = parseInt(lastItem.channel);
      if (!isNaN(lastChannel)) newChannel = (lastChannel + 1).toString();
    }

    const newItem: InputListItem = {
      id: Date.now().toString(),
      channel: newChannel,
      patchColor: 'transparent',
      patchNumber: '',
      label: '',
      micRider: '',
      micContra: '',
      stand: '',
      notes: '',
    };
    updateLocal({ inputList: [...currentList, newItem] });
  };

  // Funcions per gestionar monitors (separats dels inputs)
  const handleMonitorChange = (id: string, field: keyof MonitorListItem, value: any) => {
    const newMonitorList = (techDataRef.current.monitorList || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-vincular l'ID si el text coincideix exactament amb un material de l'inventari
        if (field === 'mixContra') {
          const matched = materialItems.find(m => m.name === value);
          updatedItem.mixContraId = matched ? matched.id : undefined;
        }
        if (field === 'mixStand') {
          const matched = materialItems.find(m => m.name === value);
          updatedItem.mixStandId = matched ? matched.id : undefined;
        }
        return updatedItem;
      }
      return item;
    });
    updateLocal({ monitorList: newMonitorList });
  };

  const addMonitorItem = () => {
    const currentList = techDataRef.current.monitorList || [];
    const lastItem = currentList[currentList.length - 1];
    let newOutputChannel = '';
    if (lastItem?.outputChannel) {
      // Lògica per generar el següent canal de sortida (A1, A2, B1, B2, etc.)
      const match = lastItem.outputChannel.match(/([A-Z])(\d+)/);
      if (match) {
        const letter = match[1];
        const number = parseInt(match[2]);
        const nextNumber = number + 1;
        newOutputChannel = `${letter}${nextNumber}`;
      } else {
        newOutputChannel = 'A1';
      }
    } else {
      newOutputChannel = 'A1';
    }

    const newItem: MonitorListItem = {
      id: Date.now().toString(),
      outputChannel: newOutputChannel,
      patchColor: 'transparent',
      patchNumber: '',
      label: '',
      mixRider: '',
      mixContra: '',
      mixStand: '',
      notes: '',
    };
    updateLocal({ monitorList: [...currentList, newItem] });
  };

  const copyRiderToContra = () => {
    const newList = techDataRef.current.inputList.map(item => ({
      ...item,
      micContra: item.micContra || item.micRider
    }));
    updateLocal({ inputList: newList });
    showToast(t('rider_workshop.copy_rider_to_contra'), 'success');
  };

  const clearAllContra = () => {
    const newList = techDataRef.current.inputList.map(item => ({
      ...item,
      micContra: '',
      micContraId: undefined,
      stand: '',
      standId: undefined
    }));
    updateLocal({ inputList: newList });
    showToast(t('rider_workshop.clear_all_contra'), 'info');
  };

  const handleEventChange = (id: string) => {
    setSelectedEventFrameId(id);
    navigate(`/riders/${id}`, { replace: true });
  };

  if (!selectedEventFrameId) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-muted/30 border-2 border-dashed border-border rounded-lg">
          <div className="max-w-md space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGridIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{t('performances.select_event')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('performances.select_event_placeholder')}
            </p>
          </div>
          <div className="w-full max-w-sm px-4">
            <select 
              className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm"
              onChange={(e) => handleEventChange(e.target.value)}
              value=""
            >
              <option value="" disabled>{t('performances.select_event_placeholder')}</option>
              {activeEventFrames.map(ef => (
                <option key={ef.id} value={ef.id}>{new Date(ef.startDate).toLocaleDateString('ca-ES')} - {ef.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (!eventFrame) {
    return <div className="p-8 text-center">{t('common.event_not_found')}</div>;
  }

  return (
    <div className="px-2 py-2 h-[calc(100vh-140px)] flex flex-col space-y-4">
      
      {/* Header de la Secció */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGridIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">{t('main.nav_riders')}</h1>
            <div className="mt-1">
               <select 
                value={selectedEventFrameId} 
                onChange={(e) => handleEventChange(e.target.value)}
                className="bg-transparent border-none p-0 text-xs text-muted-foreground hover:text-primary cursor-pointer outline-none font-medium"
              >
                {activeEventFrames.map(ef => (
                  <option key={ef.id} value={ef.id}>{ef.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{t('rider_workshop.switch_performance')}</span>
            <select 
              value={selectedPerformanceId || ''} 
              onChange={(e) => {
                if (isDirty) saveNow();
                setSelectedPerformanceId(e.target.value);
                setActiveCell(null);
              }}
              className="bg-transparent border-none p-0 text-sm focus:ring-0 outline-none font-bold"
            >
              {!eventFrame.performances?.length && <option value="">{t('performances.no_performances')}</option>}
              {eventFrame.performances?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-1 border-l border-border pl-3">
             <Tooltip text={t('rider_workshop.copy_rider_to_contra')}>
              <button
                onClick={copyRiderToContra}
                className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-primary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip text={t('rider_workshop.clear_all_contra')}>
              <button
                onClick={clearAllContra}
                className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden bg-card rounded-lg border border-border shadow-sm">
        
        {/* Sidebar - Inventari */}
        <aside className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
          <div className="p-3 border-b border-border space-y-2">
            {/* Avís visual de Point & Shoot */}
            <div className={`p-2 rounded-md text-[10px] flex items-center gap-2 transition-colors ${
              activeCell ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground border border-transparent'
            }`}>
              <MousePointerClick className="w-4 h-4 shrink-0" />
              <span>
                {activeCell 
                  ? "Fes clic a qualsevol material per assignar-lo a la casella seleccionada." 
                  : "Selecciona una casella a la taula per poder assignar-hi material."}
              </span>
            </div>

            {/* Cercador d'ítems */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('rider_workshop.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            {/* Selector de Categories */}
            <div className="flex items-center gap-2">
              <SearchableCategorySelector
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
                placeholder={t('rider_workshop.all_categories')}
              />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-3 custom-scrollbar">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Package className="w-3 h-3" />
              {t('rider_workshop.inventory_title')}
            </h3>
            {filteredMaterial.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs italic">
                {t('rider_workshop.no_material_found')}
              </div>
            ) : (
              filteredMaterial.map((item: MaterialItem) => {
                // 1. Quants n'hi ha guardats a la base de dades per aquest rider?
                const savedUsage = performance?.techData?.inputList?.filter(
                  input => input.micContraId === item.id || input.standId === item.id
                ).length || 0;

                // 2. Quants n'hi ha al buffer local ara mateix?
                const localUsage = techData.inputList.filter(
                  input => input.micContraId === item.id || input.standId === item.id
                ).length;

                // 3. Disponibilitat global
                const globalAvail = getMaterialAvailability(item.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
                
                // 4. Càlcul precís evitant la doble comptabilitat
                const actualAvailable = globalAvail.available + savedUsage - localUsage;

                return (
                  <InventoryItem 
                    key={item.id} 
                    item={item} 
                    availability={{ available: actualAvailable, total: globalAvail.total }}
                    eventFrame={eventFrame}
                    techData={techData}
                    performance={performance}
                    onClick={handleMaterialClick}
                    isSelectionActive={activeCell !== null}
                  />
                );
              })
            )}
          </div>
          
          <RiderBalance 
            inputList={techData.inputList}
            monitorList={techData.monitorList || []}
            eventFrame={eventFrame}
            getMaterialAvailability={getMaterialAvailability}
            performance={performance} // NOU: Li passem l'actuació
          />
        </aside>

        {/* Main Content - Taula de Rider */}
        <main className="flex-grow overflow-auto bg-background flex flex-col">
          {!performance ? (
            <div className="flex-grow flex items-center justify-center text-muted-foreground italic">
              {t('performances.no_inputs')}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
              <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-muted/5 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Music className="text-primary w-5 h-5" />
                  <h2 className="text-lg font-bold truncate max-w-xs">{performance.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 bg-muted border border-border rounded-full text-muted-foreground font-medium uppercase">
                    {performance.type || 'N/A'}
                  </span>
                  <span className="text-xs font-mono text-primary font-bold">
                    {performance.showTime || '--:--'}
                  </span>
                </div>
                <button
                  onClick={addInputItem}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors text-xs font-bold border border-border"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('performances.add_input')}
                </button>
              </div>

              <div className="flex-grow p-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-6">
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border text-left">
                            <th className="w-10"></th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.patch_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                              {t('performances.channel_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.label_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.mic_rider_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.mic_contra_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.stand_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.notes_header')}
                            </th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <SortableContext items={techData.inputList} strategy={verticalListSortingStrategy}>
                            {techData.inputList.map((item) => (
                              <WorkshopRow 
                                key={item.id} 
                                item={item} 
                                onChange={handleInputChange}
                                onRemove={(id) => updateLocal({ inputList: techDataRef.current.inputList.filter(i => i.id !== id) })}
                                activeCell={getWorkshopActiveCell()}
                                onCellFocus={(id, field) => setActiveCell({ id, field })}
                              />
                            ))}
                          </SortableContext>
                        </tbody>
                      </table>
                    </div>

                    {/* Taula de Monitors/Auxiliars */}
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden mt-6">
                      <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-muted/5">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold">Monitors / Auxiliars</h3>
                          <span className="text-xs px-2 py-1 bg-muted border border-border rounded-full text-muted-foreground">
                            {techData.monitorList?.length || 0}
                          </span>
                        </div>
                        <button
                          onClick={addMonitorItem}
                          className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors text-xs font-bold border border-border"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Afegir Monitor
                        </button>
                      </div>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border text-left">
                            <th className="w-10"></th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.patch_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                              {t('performances.channel_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.label_header')}
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              MIX Rider
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              MIX Contra
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Peu
                            </th>
                            <th className="py-2.5 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {t('performances.notes_header')}
                            </th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <SortableContext items={(techData.monitorList || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {(techData.monitorList || []).map((item) => (
                                <MonitorRow 
                                  key={item.id} 
                                  item={item} 
                                  onChange={handleMonitorChange}
                                  onRemove={(id) => updateLocal({ monitorList: (techDataRef.current.monitorList || []).filter(i => i.id !== id) })}
                                  activeCell={getMonitorActiveCell()}
                                  onCellFocus={(id, field) => setActiveCell({ id, field })}
                                />
                              ))}
                          </SortableContext>
                        </tbody>
                      </table>
                    </div>

                    {/* Notes Tècniques Addicionals */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 pb-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          {t('performances.lighting_notes')}
                        </label>
                        <textarea
                          value={techData.lightingNotes}
                          onChange={(e) => updateLocal({ lightingNotes: e.target.value })}
                          placeholder="..."
                          className="w-full h-28 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {t('performances.video_notes')}
                        </label>
                        <textarea
                          value={techData.videoNotes}
                          onChange={(e) => updateLocal({ videoNotes: e.target.value })}
                          placeholder="..."
                          className="w-full h-28 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          {t('performances.stage_requirements')}
                        </label>
                        <textarea
                          value={techData.stageRequirements}
                          onChange={(e) => updateLocal({ stageRequirements: e.target.value })}
                          placeholder="..."
                          className="w-full h-28 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </DndContext>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RiderWorkshop;