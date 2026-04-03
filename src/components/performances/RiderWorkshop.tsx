import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
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
  MousePointerClick,
  ChevronDown,
  ChevronUp
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
    
    const currentInputCount = techData.inputList
      .filter((input: InputListItem) => input.micContraId === item.id || input.standId === item.id)
      .length;
    const currentMonitorCount = (techData.monitorList || [])
      .filter((monitor: MonitorListItem) => monitor.mixContraId === item.id || monitor.mixStandId === item.id)
      .length;
    const currentTotal = currentInputCount + currentMonitorCount;
    if (currentTotal > 0) {
      assignments.push({
        eventName: eventFrame.name || 'Esdeveniment',
        performanceName: performance?.name || 'Actuació actual',
        quantity: currentTotal
      });
    }

    eventFrame.performances?.forEach((perf: Performance) => {
      if (perf.id !== performance?.id) { 
        const perfInputCount = perf.techData?.inputList?.filter((input: InputListItem) => input.micContraId === item.id || input.standId === item.id).length || 0;
        const perfMonitorCount = perf.techData?.monitorList?.filter((monitor: MonitorListItem) => monitor.mixContraId === item.id || monitor.mixStandId === item.id).length || 0;
        const perfTotal = perfInputCount + perfMonitorCount;
        if (perfTotal > 0) {
          assignments.push({
            eventName: eventFrame.name || 'Esdeveniment',
            performanceName: perf.name,
            quantity: perfTotal
          });
        }
      }
    });

    return assignments;
  };

  const assignments = getAssignments();
  const isCurrentlyAssigned = techData.inputList.some(
    (input: InputListItem) => input.micContraId === item.id || input.standId === item.id
  ) || (techData.monitorList || []).some(
    (monitor: MonitorListItem) => monitor.mixContraId === item.id || monitor.mixStandId === item.id
  );

  return (
    <div
      onClick={() => onClick(item)}
      className={`p-1.5 mb-1 rounded border transition-all ${
        isSelectionActive ? 'cursor-pointer hover:ring-1 hover:ring-primary hover:border-primary' : 'cursor-default opacity-80'
      } ${
        isCurrentlyAssigned ? 'ring-1 ring-success/50 bg-success/5 border-success/30 shadow-sm' :
        isNegativeStock ? 'bg-destructive/10 border-destructive/50 animate-pulse' : 
        isOutOfStock ? 'bg-muted/50 border-border grayscale text-muted-foreground' : 
        'bg-card border-border shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center text-[10px]">
        <Tooltip text={`${item.name}${item.notes ? ` \n\n📝 ${item.notes}` : ''}`}>
          <span className={`font-bold truncate mr-1 ${
            isNegativeStock ? 'text-destructive' : ''
          }`}>{item.name}</span>
        </Tooltip>
        <span className={`text-[8px] px-1 py-0.5 rounded-full font-black shrink-0 ${
          isNegativeStock ? 'bg-destructive text-destructive-foreground' : 
          isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}>
          {availability.available}/{item.stock}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mt-0.5 opacity-60">
        {item.location && <div className="text-[8px] text-muted-foreground truncate italic leading-none">{item.location}</div>}
        {item.notes && <div className="text-[7px] text-muted-foreground truncate font-medium leading-none flex items-center gap-1">
          <EditIcon className="w-2 h-2 shrink-0" />
          {item.notes}
        </div>}
      </div>
      {assignments.length > 0 && (
        <div className="text-[7px] text-muted-foreground mt-1 space-y-0.5 border-t border-border/30 pt-1">
          {assignments.map((assignment, idx) => (
            <div key={idx} className="truncate flex justify-between items-center">
              <span className="opacity-70">{assignment.performanceName}:</span>
              <span className="font-black text-primary ml-1">{assignment.quantity}</span>
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
  t: TFunction;
  onChange: (id: string, field: keyof InputListItem, value: any) => void;
  onRemove: (id: string) => void;
  activeCell: { id: string; field: 'micContra' | 'stand' } | null;
  onCellFocus: (id: string, field: 'micContra' | 'stand') => void;
}

const WorkshopRow: React.FC<WorkshopRowProps> = ({ item, t, onChange, onRemove, activeCell, onCellFocus }) => {
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
      className={`hover:bg-muted/30 transition-colors group ${isDragging ? 'bg-accent/50 shadow-lg' : ''}`}
    >
      <td className="w-8 text-center border-r border-border/50">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 opacity-20 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
        </div>
      </td>
      
      <td className="py-1 px-1.5 w-20">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(item.id, 'patchColor', nextColor.name)}
            className={`w-4 h-4 rounded-full border border-border shrink-0 transition-transform hover:scale-110 active:scale-95 ${
              patchColors.find(c => c.name === item.patchColor)?.class || 'bg-transparent'
            }`}
          />
          <input
            type="text"
            value={item.patchNumber || ''}
            onChange={(e) => onChange(item.id, 'patchNumber', e.target.value)}
            className="w-8 px-1 py-0.5 bg-muted/50 border border-border rounded text-[9px] text-center focus:ring-1 focus:ring-primary/50 outline-none font-black"
            placeholder="#"
          />
        </div>
      </td>

      <td className="py-1 px-1 w-14">
        <input
          type="text"
          value={item.channel || ''}
          onChange={(e) => onChange(item.id, 'channel', e.target.value)}
          className="w-full px-1 py-0.5 bg-transparent border-none text-[11px] font-mono text-center focus:ring-0 outline-none font-black text-primary"
          placeholder="CH"
        />
      </td>

      <td className="py-1 px-1.5 min-w-[120px]">
        <Tooltip text={item.label || ''}>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onChange(item.id, 'label', e.target.value)}
            className="w-full px-1.5 py-1 bg-transparent border-none text-[11px] focus:ring-0 outline-none font-bold placeholder:opacity-20"
            placeholder="..."
          />
        </Tooltip>
      </td>

      <td className="py-1 px-1.5 text-muted-foreground italic min-w-[120px]">
        <Tooltip text={item.micRider || ''}>
          <input
            type="text"
            value={item.micRider}
            onChange={(e) => onChange(item.id, 'micRider', e.target.value)}
            className="w-full px-1.5 py-1 bg-transparent border-none text-[10px] italic focus:ring-0 outline-none"
            placeholder={t('performances.mic_di_placeholder')}
          />
        </Tooltip>
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${micStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={item.micContra || (micStatus.isError ? "Sense estoc disponible!" : "")}>
          <div className={`relative flex items-center rounded border transition-all ${isMicActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={item.micContra}
              onChange={(e) => onChange(item.id, 'micContra', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'micContra')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {micStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${standStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={item.stand || (standStatus.isError ? "Sense estoc disponible!" : "")}>
          <div className={`relative flex items-center rounded border transition-all ${isStandActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={item.stand}
              onChange={(e) => onChange(item.id, 'stand', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'stand')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {standStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      <td className="py-1 px-1.5">
        <Tooltip text={item.notes || ''}>
          <input
            type="text"
            value={item.notes}
            onChange={(e) => onChange(item.id, 'notes', e.target.value)}
            className="w-full px-1 py-1 bg-transparent border-none text-[10px] text-muted-foreground focus:ring-0 outline-none"
            placeholder="..."
          />
        </Tooltip>
      </td>

      <td className="py-1 px-1 text-center">
        <input
          type="checkbox"
          checked={item.exclusive || false}
          onChange={(e) => onChange(item.id, 'exclusive', e.target.checked)}
          className="w-3.5 h-3.5 accent-primary"
        />
      </td>

      <td className="py-1 px-1 text-center w-10 border-l border-border/50">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

// --- Fila de Monitor ---

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
  } = useSortable({ id: item.id });

  const style = { transform: CSS.Transform.toString(transform) };

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
      className={`hover:bg-muted/30 transition-colors group ${isDragging ? 'bg-accent/50 shadow-lg' : ''}`}
    >
      <td className="w-8 text-center border-r border-border/50">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 opacity-20 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
        </div>
      </td>
      
      <td className="py-1 px-1.5 w-20">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(item.id, 'patchColor', nextColor.name)}
            className={`w-4 h-4 rounded-full border border-border shrink-0 transition-transform hover:scale-110 active:scale-95 ${
              patchColors.find(c => c.name === item.patchColor)?.class || 'bg-transparent'
            }`}
          />
          <input
            type="text"
            value={item.patchNumber || ''}
            onChange={(e) => onChange(item.id, 'patchNumber', e.target.value)}
            className="w-8 px-1 py-0.5 bg-muted/50 border border-border rounded text-[9px] text-center focus:ring-1 focus:ring-primary/50 outline-none font-black"
            placeholder="#"
          />
        </div>
      </td>

      <td className="py-1 px-1 w-14">
        <input
          type="text"
          value={item.outputChannel || ''}
          onChange={(e) => onChange(item.id, 'outputChannel', e.target.value)}
          className="w-full px-1 py-0.5 bg-transparent border-none text-[11px] font-mono text-center focus:ring-0 outline-none font-black text-primary"
          placeholder="A1"
        />
      </td>

      <td className="py-1 px-1.5 min-w-[120px]">
        <Tooltip text={item.label || ''}>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onChange(item.id, 'label', e.target.value)}
            className="w-full px-1.5 py-1 bg-transparent border-none text-[11px] focus:ring-0 outline-none font-bold placeholder:opacity-20"
            placeholder="..."
          />
        </Tooltip>
      </td>

      <td className="py-1 px-1.5 text-muted-foreground italic min-w-[120px]">
        <Tooltip text={item.mixRider || ''}>
          <input
            type="text"
            value={item.mixRider}
            onChange={(e) => onChange(item.id, 'mixRider', e.target.value)}
            className="w-full px-1.5 py-1 bg-transparent border-none text-[10px] italic focus:ring-0 outline-none"
            placeholder="Demanat..."
          />
        </Tooltip>
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${mixContraStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={item.mixContra || (mixContraStatus.isError ? "Sense estoc disponible!" : "")}>
          <div className={`relative flex items-center rounded border transition-all ${isMixContraActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={item.mixContra}
              onChange={(e) => onChange(item.id, 'mixContra', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'mixContra')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {mixContraStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${mixStandStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={item.mixStand || (mixStandStatus.isError ? "Sense estoc disponible!" : "")}>
          <div className={`relative flex items-center rounded border transition-all ${isMixStandActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={item.mixStand || ''}
              onChange={(e) => onChange(item.id, 'mixStand', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'mixStand')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {mixStandStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      <td className="py-1 px-1.5">
        <Tooltip text={item.notes || ''}>
          <input
            type="text"
            value={item.notes}
            onChange={(e) => onChange(item.id, 'notes', e.target.value)}
            className="w-full px-1 py-1 bg-transparent border-none text-[10px] text-muted-foreground focus:ring-0 outline-none"
            placeholder="..."
          />
        </Tooltip>
      </td>

      <td className="py-1 px-1 text-center">
        <input
          type="checkbox"
          checked={item.exclusive || false}
          onChange={(e) => onChange(item.id, 'exclusive', e.target.checked)}
          className="w-3.5 h-3.5 accent-primary"
        />
      </td>

      <td className="py-1 px-1 text-center w-10 border-l border-border/50">
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
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
  categories, activeCategory, onSelect, placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return categories;
    return categories.filter(cat => cat.toLowerCase().includes(search));
  }, [categories, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  },[]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-background border border-border rounded px-2 py-1 text-[9px] font-black focus:ring-1 focus:ring-primary/50 outline-none transition-all hover:border-primary/50"
      >
        <span className="truncate">{activeCategory === 'all' ? placeholder : activeCategory}</span>
        <Filter className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded shadow-xl z-[100] flex flex-col overflow-hidden">
          <div className="p-1.5 border-b border-border bg-muted/30">
            <input
              autoFocus
              type="text"
              placeholder="Filtrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 bg-background border border-border rounded text-[9px] focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-40 overflow-y-auto custom-scrollbar p-1">
            <button
              onClick={() => { onSelect('all'); setIsOpen(false); }}
              className={`w-full text-left px-2 py-1.5 rounded text-[9px] font-black transition-colors ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
            >
              {placeholder}
            </button>
            {filteredCategories.filter(c => c !== 'all').map((cat) => (
              <button
                key={cat}
                onClick={() => { onSelect(cat); setIsOpen(false); }}
                className={`w-full text-left px-2 py-1.5 rounded text-[9px] font-medium transition-colors truncate ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Balanç del Rider (Taula Compacta i Col·lapsable) ---

interface RiderBalanceProps {
  performances: Performance[];
  materialItems: MaterialItem[];
  eventFrame: { startDate: string; endDate: string; id: string };
  getMaterialAvailability: (id: string, start: string, end: string, frameId: string) => { available: number; total: number };
}

const RiderBalance: React.FC<RiderBalanceProps> = ({ performances, materialItems, eventFrame, getMaterialAvailability }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const usage = useMemo(() => {
    const counts: Record<string, { id: string; name: string; qty: number; location: string }> = {};
    
    performances.forEach(perf => {
      [...(perf.techData?.inputList || []), ...(perf.techData?.monitorList || [])].forEach((item: any) => {
        const matId = item.micContraId || item.standId || item.mixContraId || item.mixStandId;
        const matName = item.micContra || item.stand || item.mixContra || item.mixStand;
        if (matId) {
          if (!counts[matId]) {
            const m = materialItems.find(mi => mi.id === matId);
            counts[matId] = { id: matId, name: matName, qty: 0, location: m?.location || '-' };
          }
          counts[matId].qty += 1;
        }
      });
    });
    
    return Object.values(counts).map(u => {
      const globalAvail = getMaterialAvailability(u.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
      return { ...u, available: globalAvail.available, isError: globalAvail.available < 0 };
    }).sort((a, b) => (b.isError ? 1 : 0) - (a.isError ? 1 : 0));
  },[performances, materialItems, getMaterialAvailability, eventFrame]);

  if (usage.length === 0) return null;

  const errorCount = usage.filter(u => u.isError).length;

  return (
    <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1.5 bg-muted/20 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <ChartBarIcon className="w-3.5 h-3.5 text-primary" />
            Balanç Consolidat
          </h3>
          {errorCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {errorCount} {errorCount === 1 ? 'ERROR' : 'ERRORS'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 text-[8px] font-black uppercase tracking-tight opacity-60">
             <div className="flex items-center gap-1.5 text-primary">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              OK
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
              ERROR
            </div>
          </div>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="animate-in fade-in duration-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="py-1.5 px-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Material</th>
                <th className="py-1.5 px-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Ubicació</th>
                <th className="py-1.5 px-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-center">Quantitat</th>
                <th className="py-1.5 px-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Estat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usage.map(u => (
                <tr key={u.id} className={`transition-colors ${u.isError ? 'bg-destructive/5' : ''}`}>
                  <td className={`py-1.5 px-4 text-[10px] font-black ${u.isError ? 'text-destructive' : ''}`}>
                    <Tooltip text={u.name || ''}>
                      <span className="truncate block max-w-[200px]">{u.name}</span>
                    </Tooltip>
                  </td>
                  <td className="py-1.5 px-4 text-[9px] text-muted-foreground italic">
                    <Tooltip text={u.location || ''}>
                      <span className="truncate block max-w-[150px]">{u.location}</span>
                    </Tooltip>
                  </td>
                  <td className="py-1.5 px-4 text-[11px] font-mono font-black text-center">
                    <span className={u.isError ? 'text-destructive' : 'text-primary'}>{u.qty}</span>
                  </td>
                  <td className="py-1.5 px-4 text-right">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${u.isError ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary/10 text-primary'}`}>
                      {u.isError ? 'MANCA' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

// --- Pantalla Principal ---

const RiderWorkshop: React.FC = () => {
  // 1. Hooks de Router y Traducción
  const { eventFrameId: urlEventFrameId } = useParams<{ eventFrameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 2. Hooks de Store
  const { eventFrames, materialItems, getMaterialAvailability, updatePerformance } = useEventDataStore();

  // 3. Estados Locales
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string | null>(urlEventFrameId || null);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<{ id: string; field: 'micContra' | 'stand' | 'mixContra' | 'mixStand' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // 4. Referencias
  const migratedPerformances = useRef<Set<string>>(new Set());

  // 5. Estados para secciones colapsables
  const [isInputsExpanded, setIsInputsExpanded] = useState(true);
  const [isMonitorsExpanded, setIsMonitorsExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  // 6. Efectos
  useEffect(() => { 
    if (urlEventFrameId) setSelectedEventFrameId(urlEventFrameId); 
  }, [urlEventFrameId]);

  // 7. Memos de Datos
  const eventFrame = useMemo(() => 
    selectedEventFrameId ? eventFrames.find(ef => ef.id === selectedEventFrameId) : null
  , [selectedEventFrameId, eventFrames]);

  const activeEventFrames = useMemo(() => 
    eventFrames.filter(ef => !ef.isArchived).sort((a, b) => b.startDate.localeCompare(a.startDate))
  , [eventFrames]);

  const performance = useMemo(() => {
    const perf = eventFrame?.performances?.find(p => p.id === selectedPerformanceId);
    if (perf && !perf.techData && !migratedPerformances.current.has(perf.id)) {
      migratedPerformances.current.add(perf.id);
      const updatedPerf = { ...perf, techData: { inputList:[], monitorList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' } };
      setTimeout(() => { if (selectedEventFrameId) updatePerformance(selectedEventFrameId, updatedPerf); }, 0);
      return updatedPerf;
    }
    return perf;
  },[eventFrame, selectedPerformanceId, selectedEventFrameId, updatePerformance]);

  const initialTechData = useMemo(() => 
    performance?.techData || { inputList:[], monitorList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' }
  , [performance]);

  // 8. Hook de Guardado con Buffering
  const { localData: techData, localDataRef: techDataRef, updateLocal, saveNow, isDirty } = useBufferedSave(initialTechData, (data) => {
    if (selectedEventFrameId && performance) updatePerformance(selectedEventFrameId, { ...performance, techData: data });
  });

  const materialCategories = useMemo(() => ['all', ...Array.from(new Set(materialItems.map(m => m.category)))].sort(), [materialItems]);

  useEffect(() => {
    if (eventFrame?.performances?.length) {
      if (!selectedPerformanceId || !eventFrame.performances.find(p => p.id === selectedPerformanceId)) {
        if (isDirty) saveNow();
        setSelectedPerformanceId(eventFrame.performances[0].id);
        setActiveCell(null);
      }
    } else {
      setSelectedPerformanceId(null);
      setActiveCell(null);
    }
  },[eventFrame, selectedPerformanceId, isDirty, saveNow]);

  const filteredMaterial = useMemo(() => {
    return materialItems.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.location && m.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = activeCategory === 'all' || m.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [materialItems, searchTerm, activeCategory]);

  // 9. DnD Kit Hooks
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // 10. Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const inputIndex = techData.inputList.findIndex(i => i.id === active.id);
    if (inputIndex !== -1) {
      const newIndex = techData.inputList.findIndex(i => i.id === over.id);
      if (newIndex !== -1) updateLocal({ inputList: arrayMove(techData.inputList, inputIndex, newIndex) });
      return;
    }
    const monitorIndex = (techData.monitorList || []).findIndex(i => i.id === active.id);
    if (monitorIndex !== -1) {
      const newIndex = (techData.monitorList || []).findIndex(i => i.id === over.id);
      if (newIndex !== -1) updateLocal({ monitorList: arrayMove(techData.monitorList || [], monitorIndex, newIndex) });
    }
  };

  const handleInputChange = (id: string, field: any, value: any) => {
    const newList = techDataRef.current.inputList.map(item => {
      if (item.id === id) {
        const up = { ...item, [field]: value };
        if (field === 'micContra' || field === 'stand') {
          const matched = materialItems.find(m => m.name === value);
          if (field === 'micContra') up.micContraId = matched?.id; else up.standId = matched?.id;
        }
        return up;
      }
      return item;
    });
    updateLocal({ inputList: newList });
  };

  const handleMonitorChange = (id: string, field: any, value: any) => {
    const newList = (techDataRef.current.monitorList || []).map(item => {
      if (item.id === id) {
        const up = { ...item, [field]: value };
        if (field === 'mixContra' || field === 'mixStand') {
          const matched = materialItems.find(m => m.name === value);
          if (field === 'mixContra') up.mixContraId = matched?.id; else up.mixStandId = matched?.id;
        }
        return up;
      }
      return item;
    });
    updateLocal({ monitorList: newList });
  };

  const handleMaterialClick = (material: MaterialItem) => {
    if (activeCell) {
      if (activeCell.field === 'mixContra' || activeCell.field === 'mixStand') handleMonitorChange(activeCell.id, activeCell.field, material.name);
      else handleInputChange(activeCell.id, activeCell.field, material.name);
      notificationService.success(`${material.name} assignat`);
    } else {
      notificationService.info("Selecciona una casella per assignar material.");
    }
  };

  const handleEventChange = (id: string) => {
    setSelectedEventFrameId(id);
    navigate(`/riders/${id}`, { replace: true });
  };

  // --- RENDERITZAT CONDICIONAL (DESPRÉS DE TOTS ELS HOOKS) ---

  if (!selectedEventFrameId) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-muted/30 border-2 border-dashed border-border rounded-xl w-full max-w-2xl shadow-sm">
          <div className="max-w-md space-y-2 px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGridIcon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">{t('performances.select_event')}</h2>
            <p className="text-xs text-muted-foreground font-medium">
              {t('performances.select_event_placeholder')}
            </p>
          </div>
          <div className="w-full max-w-sm px-6">
            <select 
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm font-black text-primary cursor-pointer hover:bg-muted/50 transition-colors"
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

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden bg-background">
      
      {/* SIDEBAR - Alçada Total */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-2 border-b border-border space-y-2">
          <div className={`p-2 rounded text-[9px] flex items-start gap-2 ${activeCell ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'bg-muted/50 text-muted-foreground opacity-50'}`}>
            <MousePointerClick className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${activeCell ? 'animate-bounce' : ''}`} />
            <span className="font-black uppercase tracking-tight">{activeCell ? "Assig. Activa" : "Clica una cel·la"}</span>
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <input type="text" placeholder={t('rider_workshop.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-7 pr-2 py-1 bg-muted/30 border border-border rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium" />
            </div>
            <SearchableCategorySelector categories={materialCategories} activeCategory={activeCategory} onSelect={setActiveCategory} placeholder="Categories" />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-2 custom-scrollbar bg-muted/5">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2 px-1 opacity-50"><Package className="w-3 h-3" /> Inventari</h3>
          {eventFrame && filteredMaterial.map(item => {
            const globalAvail = getMaterialAvailability(item.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id, undefined, undefined, performance?.id);
            const savedUsage = performance?.techData?.inputList?.filter(i => i.micContraId === item.id || i.standId === item.id).length || 0;
            const localUsage = techData.inputList.filter(i => i.micContraId === item.id || i.standId === item.id).length;
            return <InventoryItem key={item.id} item={item} availability={{ available: globalAvail.available + savedUsage - localUsage, total: globalAvail.total }} eventFrame={eventFrame} techData={techData} performance={performance} onClick={handleMaterialClick} isSelectionActive={activeCell !== null} />;
          })}
        </div>
      </aside>

      {/* ZONA DRETA - Stack Vertical */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* TOP BAR COMPACTE */}
        <header className="px-4 py-2 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
              <LayoutGridIcon className="w-4 h-4 text-primary" />
              <select value={selectedEventFrameId} onChange={(e) => { handleEventChange(e.target.value); }} className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary outline-none cursor-pointer">
                {activeEventFrames.map(ef => <option key={ef.id} value={ef.id}>{ef.name}</option>)}
              </select>
            </div>
            <div className="h-4 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-muted-foreground uppercase opacity-50">Artista:</span>
              <select value={selectedPerformanceId || ''} onChange={(e) => { if (isDirty) saveNow(); setSelectedPerformanceId(e.target.value); setActiveCell(null); }} className="bg-muted px-2 py-1 rounded text-xs font-black text-primary outline-none border-none shadow-sm cursor-pointer hover:bg-muted/80">
                {eventFrame?.performances?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex items-center gap-1 ml-2">
                <Tooltip text="Copiar Rider a Contra"><button onClick={() => { updateLocal({ inputList: techDataRef.current.inputList.map(i => ({ ...i, micContra: i.micContra || i.micRider })) }); notificationService.success("Copiats"); }} className="p-1.5 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary transition-colors"><Copy className="w-4 h-4" /></button></Tooltip>
                <Tooltip text="Netejar Contra-rider"><button onClick={() => { updateLocal({ inputList: techDataRef.current.inputList.map(i => ({ ...i, micContra: '', micContraId: undefined, stand: '', standId: undefined })) }); notificationService.info("Netejat"); }} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button></Tooltip>
              </div>
            </div>
          </div>
          <button onClick={() => { const last = techDataRef.current.inputList[techDataRef.current.inputList.length-1]; let next = ''; if (last?.channel) { const n = parseInt(last.channel); if (!isNaN(n)) next = (n+1).toString(); } updateLocal({ inputList: [...techDataRef.current.inputList, { id: Date.now().toString(), channel: next, patchColor: 'transparent', patchNumber: '', label: '', micRider: '', micContra: '', stand: '', notes: '' }] }); }} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-[10px] font-black shadow-md shadow-primary/10">
            <Plus className="w-3 h-3" /> INPUT
          </button>
        </header>

        {/* CONTINGUT SCROLLABLE */}
        <main className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {/* SECCIÓ INPUTS */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsInputsExpanded(!isInputsExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <LayoutGridIcon className="w-3.5 h-3.5 text-primary" /> 
                    Llista d'Inputs
                    <span className="text-muted-foreground ml-2">({techData.inputList.length})</span>
                  </h3>
                  {isInputsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                {isInputsExpanded && (
                  <table className="w-full border-collapse animate-in fade-in duration-200">
                    <thead>
                      <tr className="bg-muted/10 text-left border-b border-border">
                        <th className="w-8"></th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Patch</th>
                        <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">CH</th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Etiqueta</th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Rider</th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Contra</th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Peu</th>
                        <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Notes</th>
                        <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Exc.</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <SortableContext items={techData.inputList} strategy={verticalListSortingStrategy}>
                        {techData.inputList.map(item => <WorkshopRow key={item.id} item={item} t={t} onChange={handleInputChange} onRemove={(id) => updateLocal({ inputList: techDataRef.current.inputList.filter(i => i.id !== id) })} activeCell={activeCell?.field === 'micContra' || activeCell?.field === 'stand' ? activeCell as any : null} onCellFocus={(id, field) => setActiveCell({ id, field })} />)}
                      </SortableContext>
                    </tbody>
                  </table>
                )}
              </section>

              {/* SECCIÓ MONITORS */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsMonitorsExpanded(!isMonitorsExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-primary" /> 
                    Monitors
                    <span className="text-muted-foreground ml-2">({techData.monitorList?.length || 0})</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); const last = (techDataRef.current.monitorList || [])[(techDataRef.current.monitorList || []).length-1]; let next = 'A1'; if (last?.outputChannel) { const m = last.outputChannel.match(/([A-Z])(\d+)/); if (m) next = `${m[1]}${parseInt(m[2])+1}`; } updateLocal({ monitorList: [...(techDataRef.current.monitorList || []), { id: Date.now().toString(), outputChannel: next, patchColor: 'transparent', patchNumber: '', label: '', mixRider: '', mixContra: '', mixStand: '', notes: '' }] }); if (!isMonitorsExpanded) setIsMonitorsExpanded(true); }} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> AFEGIR</button>
                    {isMonitorsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                {isMonitorsExpanded && (
                  <table className="w-full border-collapse animate-in fade-in duration-200">
                    <tbody className="divide-y divide-border/50">
                      <SortableContext items={(techData.monitorList || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {(techData.monitorList || []).map(item => <MonitorRow key={item.id} item={item} onChange={handleMonitorChange} onRemove={(id) => updateLocal({ monitorList: (techDataRef.current.monitorList || []).filter(i => i.id !== id) })} activeCell={activeCell?.field === 'mixContra' || activeCell?.field === 'mixStand' ? activeCell as any : null} onCellFocus={(id, field) => setActiveCell({ id, field })} />)}
                      </SortableContext>
                    </tbody>
                  </table>
                )}
              </section>

              {/* SECCIÓ NOTES */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsNotesExpanded(!isNotesExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <EditIcon className="w-3.5 h-3.5 text-primary" /> 
                    Notes Tècniques
                  </h3>
                  {isNotesExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                {isNotesExpanded && (
                  <div className="grid grid-cols-3 gap-3 p-3 animate-in fade-in duration-200">
                    {['lightingNotes', 'videoNotes', 'stageRequirements'].map((field, idx) => (
                      <div key={field} className="space-y-1">
                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 ml-1">
                          <div className={`w-1 h-1 rounded-full ${['bg-yellow-400', 'bg-blue-400', 'bg-red-400'][idx]}`}></div>
                          {t(`performances.${field}`)}
                        </label>
                        <textarea value={(techData as any)[field]} onChange={(e) => updateLocal({ [field]: e.target.value })} className="w-full h-20 p-2 bg-muted/10 border border-border rounded text-[10px] focus:ring-1 focus:ring-primary/30 outline-none resize-none font-medium" placeholder="..." />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* BALANÇ INTEGRAT - Aquí sota les notes */}
              <RiderBalance performances={eventFrame?.performances || []} materialItems={materialItems} eventFrame={eventFrame as any} getMaterialAvailability={getMaterialAvailability} />
            </div>
          </DndContext>
        </main>
      </div>
    </div>
  );
};

const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

export default RiderWorkshop;