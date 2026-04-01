import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Mic2, 
  Music, 
  Trash2, 
  Filter,
  Package,
  GripVertical,
  Plus,
  Copy,
  LayoutGridIcon,
  ChartBarIcon
} from 'lucide-react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { notificationService } from '../../utils/notificationService';
import Tooltip from '../ui/Tooltip';
import { 
  InputListItem, 
  MaterialItem, 
  PerformanceTechData,
  TechSheetData,
  Performance
} from '../../types';
import { useBufferedSave } from '../../hooks/useBufferedSave';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub-components per al Dnd ---

interface DraggableMaterialProps {
  item: MaterialItem;
  availability: { available: number; total: number };
  eventFrame: any;
  techData: PerformanceTechData;
  performance?: Performance;
}

const DraggableMaterial: React.FC<DraggableMaterialProps> = ({ item, availability, eventFrame, techData, performance }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `material-${item.id}`,
    data: { item, type: 'material' }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isOutOfStock = availability.available <= 0;
  const isNegativeStock = availability.available < 0;

  // Calcular totes les assignacions d'aquest material
  interface MaterialAssignment {
    eventName: string;
    performanceName: string;
    quantity: number;
  }

  const getAssignments = (): MaterialAssignment[] => {
    const assignments: MaterialAssignment[] = [];
    
    // 1. Rider actual (dades locals)
    techData.inputList
      .filter((input: InputListItem) => input.micContraId === item.id || input.standId === item.id)
      .forEach(() => {
        assignments.push({
          eventName: eventFrame.name || 'Esdeveniment',
          performanceName: performance?.name || 'Actuació actual',
          quantity: 1
        });
      });

    // 2. Altres actuacions del mateix esdeveniment (dades globals)
    eventFrame.performances?.forEach((perf: Performance) => {
      if (perf.id !== performance?.id) { // No comptar el rider actual dues vegades
        perf.techData?.inputList?.forEach((input: InputListItem) => {
          if (input.micContraId === item.id || input.standId === item.id) {
            assignments.push({
              eventName: eventFrame.name || 'Esdeveniment',
              performanceName: perf.name,
              quantity: 1
            });
          }
        });
      }
    });

    // 3. Fitxa tècnica de l'esdeveniment
    if (eventFrame.techSheet) {
      const needsKeys = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment'];
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 mb-2 rounded border transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 border-primary' : 
        isNegativeStock ? 'bg-destructive/20 border-destructive/50 animate-pulse' : 
        isOutOfStock ? 'bg-muted/50 border-border grayscale text-muted-foreground' : 
        'bg-card border-border hover:border-primary/50 shadow-sm'
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
      {/* Llista d'assignacions del material */}
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

// --- Cel·la Dropzone ---

interface DroppableCellProps {
  inputId: string;
  field: 'micContra' | 'stand';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ inputId, field, value, onChange, placeholder }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${inputId}-${field}`,
    data: { type: 'dropzone', inputId, field }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`relative group h-full flex items-center transition-colors rounded ${
        isOver ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''
      }`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full h-full px-2 py-1.5 bg-transparent border-none text-sm focus:outline-none placeholder:text-muted-foreground/50"
        placeholder={placeholder}
      />
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-primary/10 rounded">
          <Package className="w-4 h-4 text-primary animate-bounce" />
        </div>
      )}
    </div>
  );
};

// --- Fila de la Taula (específica per al Workshop) ---

interface WorkshopRowProps {
  item: InputListItem;
  onChange: (id: string, field: keyof InputListItem, value: any) => void;
  onRemove: (id: string) => void;
}

const WorkshopRow: React.FC<WorkshopRowProps> = ({ item, onChange, onRemove }) => {
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

  // Funció per comprovar disponibilitat d'un material concret
  const checkAvailability = (materialId?: string) => {
    if (!materialId || !eventFrame) return { isError: false, available: 0 };
    const avail = getMaterialAvailability(materialId, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
    return { isError: avail.available < 0, available: avail.available };
  };

  const micStatus = checkAvailability(item.micContraId);
  const standStatus = checkAvailability(item.standId);

  // Colors per al patch
  const patchColors = [
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
      className={`hover:bg-muted/30 transition-colors ${isDragging ? 'bg-accent/50' : ''}`}
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
        <div className="relative flex items-center">
          <DroppableCell 
            inputId={item.id} 
            field="micContra" 
            value={item.micContra} 
            onChange={(val) => onChange(item.id, 'micContra', val)}
            placeholder={t('rider_workshop.drop_here')}
          />
          {micStatus.isError && (
            <Tooltip text={`${t('common.error')}: Sense estoc disponible!`}>
              <div className="absolute right-2 text-destructive">
                <Package className="w-4 h-4 animate-pulse" />
              </div>
            </Tooltip>
          )}
        </div>
      </td>

      <td className={`py-1 px-1 min-w-[160px] transition-colors ${standStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <div className="relative flex items-center">
          <DroppableCell 
            inputId={item.id} 
            field="stand" 
            value={item.stand} 
            onChange={(val) => onChange(item.id, 'stand', val)}
            placeholder={t('rider_workshop.drop_here')}
          />
          {standStatus.isError && (
            <Tooltip text={`${t('common.error')}: Sense estoc disponible!`}>
              <div className="absolute right-2 text-destructive">
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

// --- Selector de Categories Cercable ---

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
  }, []);

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

// --- Balanç del Rider (Subcomponent) ---

interface RiderBalanceProps {
  inputList: InputListItem[];
  eventFrame: { startDate: string; endDate: string; id: string };
  getMaterialAvailability: (id: string, start: string, end: string, frameId: string) => { available: number; total: number };
}

const RiderBalance: React.FC<RiderBalanceProps> = ({ 
  inputList, 
  eventFrame, 
  getMaterialAvailability 
}) => {
  // Calcular demanda total de l'actuació actual
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
    
    return Object.values(counts).map(u => {
      const avail = getMaterialAvailability(u.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
      return { ...u, available: avail.available, isError: avail.available < 0 };
    });
  }, [inputList, getMaterialAvailability, eventFrame]);

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
    getEventFrameById, 
    materialItems, 
    getMaterialAvailability,
    updatePerformance
  } = useEventDataStore();

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    notificationService[type](message);
  };

  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string | null>(urlEventFrameId || null);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);

  // Sincronitzar ID de la URL amb l'estat local
  useEffect(() => {
    if (urlEventFrameId) setSelectedEventFrameId(urlEventFrameId);
  }, [urlEventFrameId]);

  const eventFrame = useMemo(() => 
    selectedEventFrameId ? eventFrames.find(ef => ef.id === selectedEventFrameId) : null
  , [selectedEventFrameId, eventFrames]);

  // Llista d'esdeveniments actius (no arxivats) per al selector inicial
  const activeEventFrames = useMemo(() => 
    eventFrames.filter(ef => !ef.isArchived).sort((a, b) => b.startDate.localeCompare(a.startDate))
  , [eventFrames]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const migratedPerformances = useRef<Set<string>>(new Set()); // Evitar migracions duplicades

  const performance = useMemo(() => {
    const perf = eventFrame?.performances?.find(p => p.id === selectedPerformanceId);
    
    // MIGRACIÓ: Si la performance no té techData, crear-lo per evitar pèrdua de dades
    if (perf && !perf.techData && !migratedPerformances.current.has(perf.id)) {
      console.log('[RiderWorkshop] MIGRACIÓ: Creant techData per a performance existent:', perf.name);
      migratedPerformances.current.add(perf.id); // Marcar com a migrada
      
      const updatedPerf = {
        ...perf,
        techData: {
          inputList: [],
          lightingNotes: '',
          videoNotes: '',
          stageRequirements: '',
        }
      };
      
      // Actualitzar la store immediatament (sense afegir a dependències)
      setTimeout(() => {
        if (selectedEventFrameId) {
          updatePerformance(selectedEventFrameId, updatedPerf);
        }
      }, 0);
      
      console.log('[RiderWorkshop] Performance carregada (després de migració):', { 
        selectedPerformanceId, 
        performanceName: updatedPerf.name, 
        inputListLength: updatedPerf.techData?.inputList?.length 
      });
      return updatedPerf;
    }
    
    console.log('[RiderWorkshop] Performance carregada:', { 
      selectedPerformanceId, 
      performanceName: perf?.name, 
      inputListLength: perf?.techData?.inputList?.length 
    });
    return perf;
  }, [eventFrame, selectedPerformanceId, selectedEventFrameId]);

  // Gestió de dades buferitzades
  const initialTechData = useMemo((): PerformanceTechData => {
    // Si la performance té techData, l'utilitzem directament
    if (performance?.techData) {
      return performance.techData;
    }
    // Si no, creem un objecte buit però mantenint la referència
    return {
      inputList: [],
      lightingNotes: '',
      videoNotes: '',
      stageRequirements: '',
    };
  }, [performance]);

  const {
    localData: techData,
    localDataRef: techDataRef,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialTechData, (data) => {
    console.log('[RiderWorkshop] Intentant desar performance:', { selectedEventFrameId, performance: performance?.name, data });
    if (selectedEventFrameId && performance) {
      console.log('[RiderWorkshop] Cridant updatePerformance...');
      updatePerformance(selectedEventFrameId, { ...performance, techData: data });
      console.log('[RiderWorkshop] updatePerformance cridat correctament');
    } else {
      console.warn('[RiderWorkshop] No es pot desar - falta eventFrameId o performance:', { selectedEventFrameId, performance });
    }
  });

  // Seleccionar la primera actuació per defecte quan canvia l'esdeveniment
  useEffect(() => {
    if (eventFrame?.performances?.length) {
      if (!selectedPerformanceId || !eventFrame.performances.find(p => p.id === selectedPerformanceId)) {
        // Desar les dades actuals abans de canviar de performance
        if (isDirty) {
          console.log('[RiderWorkshop] Desant canvis pendents abans de canviar de performance');
          saveNow();
        }
        setSelectedPerformanceId(eventFrame.performances[0].id);
      }
    } else {
      setSelectedPerformanceId(null);
    }
  }, [eventFrame, selectedPerformanceId, isDirty, saveNow]);

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

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'material') {
      setActiveDragItem(event.active.data.current.item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Cas 1: Reordenar la llista d'inputs
    if (active.data.current?.sortable && over.data.current?.sortable) {
      if (active.id !== over.id) {
        const oldIndex = techData.inputList.findIndex((item) => item.id === active.id);
        const newIndex = techData.inputList.findIndex((item) => item.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          updateLocal({ inputList: arrayMove(techData.inputList, oldIndex, newIndex) });
        }
      }
      return;
    }

    // Cas 2: Drop de material sobre una cel·la
    if (active.data.current?.type === 'material' && over.data.current?.type === 'dropzone') {
      const material = active.data.current.item;
      const { inputId, field } = over.data.current;
      
      const newInputList = techDataRef.current.inputList.map(item => {
        if (item.id === inputId) {
          return { 
            ...item, 
            [field]: material.name, 
            [`${field}Id`]: material.id 
          };
        }
        return item;
      });
      
      updateLocal({ inputList: newInputList });
      showToast(`${material.name} ${t('rider_workshop.assigned')}`, 'success');
    }
  };

  const handleInputChange = (id: string, field: keyof InputListItem, value: any) => {
    const newInputList = techDataRef.current.inputList.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'micContra' && item.micContraId) {
          const mat = materialItems.find(m => m.id === item.micContraId);
          if (mat && mat.name !== value) updatedItem.micContraId = undefined;
        }
        if (field === 'stand' && item.standId) {
          const mat = materialItems.find(m => m.id === item.standId);
          if (mat && mat.name !== value) updatedItem.standId = undefined;
        }
        return updatedItem;
      }
      return item;
    });
    updateLocal({ inputList: newInputList });
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                  // Desar les dades actuals abans de canviar de performance
                  if (isDirty) {
                    console.log('[RiderWorkshop] Desant canvis pendents abans de canviar de performance (selector)');
                    saveNow();
                  }
                  setSelectedPerformanceId(e.target.value);
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
              
              {/* Selector de Categories Intel·ligent */}
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
                  // Calculem quants d'aquest material ja estan assignats al rider local
                  const localAssignments = techData.inputList.filter(
                    input => input.micContraId === item.id || input.standId === item.id
                  ).length;

                  // Creem un TechSheetData mínim només amb aquestes assignacions locals
                  const localOverride: TechSheetData = {
                    eventName: eventFrame.name || '',
                    location: eventFrame.place || '',
                    date: eventFrame.startDate,
                    showDuration: '',
                    technicalProviders: [],
                    sound: {
                      status: 'yes',
                      details: '',
                      data: {
                        needs: Array.from({ length: localAssignments }, (_, index) => ({
                          id: `local-${item.id}-${index}`,
                          materialItemId: item.id,
                          quantity: '1',
                          description: '',
                          origin: 'Rider'
                        }))
                      }
                    }
                  };

                  return (
                    <DraggableMaterial 
                      key={item.id} 
                      item={item} 
                      availability={getMaterialAvailability(item.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id, undefined, localOverride)}
                      eventFrame={eventFrame}
                      techData={techData}
                      performance={performance}
                    />
                  );
                })
              )}
            </div>
            
            <RiderBalance 
              inputList={techData.inputList}
              eventFrame={eventFrame}
              getMaterialAvailability={getMaterialAvailability}
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
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Overlay quan arrosseguem material */}
        <DragOverlay>
          {activeDragItem ? (
            <div className="p-3 rounded border bg-primary text-primary-foreground shadow-xl rotate-3 scale-105 pointer-events-none flex items-center gap-2">
              <Mic2 className="w-4 h-4" />
              <span className="font-bold text-sm">{activeDragItem.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default RiderWorkshop;
