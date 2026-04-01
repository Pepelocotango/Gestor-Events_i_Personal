import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  Search, 
  Mic2, 
  Music, 
  Trash2, 
  Save,
  Filter,
  Package,
  GripVertical,
  Plus,
  Copy
} from 'lucide-react';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';
import { 
  InputListItem, 
  MaterialItem, 
  PerformanceTechData 
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
  arrayMove 
} from '@dnd-kit/sortable';

// --- Sub-components per al Dnd ---

interface DraggableMaterialProps {
  item: MaterialItem;
  availability: { available: number; total: number };
}

const DraggableMaterial: React.FC<DraggableMaterialProps> = ({ item, availability }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `material-${item.id}`,
    data: { item, type: 'material' }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isOutOfStock = availability.available <= 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 mb-2 rounded border transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 border-primary' : 
        isOutOfStock ? 'bg-muted/50 border-border grayscale text-muted-foreground' : 
        'bg-card border-border hover:border-primary/50 shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium truncate mr-2">{item.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}>
          {availability.available}/{item.stock}
        </span>
      </div>
      {item.location && <div className="text-[10px] text-muted-foreground truncate">{item.location}</div>}
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
      <td className="w-10 text-center">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-2">
          <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
        </div>
      </td>
      
      <td className="py-1 px-1 w-24">
        <div className="flex items-center gap-1.5">
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
            className="w-10 px-1 py-1 bg-muted/50 border border-border rounded text-xs text-center focus:ring-1 focus:ring-primary"
            placeholder="#"
          />
        </div>
      </td>

      <td className="py-1 px-1 w-16">
        <input
          type="text"
          value={item.channel || ''}
          onChange={(e) => onChange(item.id, 'channel', e.target.value)}
          className="w-full px-1 py-1 bg-transparent border-none text-sm font-mono text-center focus:ring-1 focus:ring-primary"
          placeholder="CH"
        />
      </td>

      <td className="py-1 px-1 min-w-[150px]">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange(item.id, 'label', e.target.value)}
          className="w-full px-2 py-1.5 bg-transparent border-none text-sm focus:ring-1 focus:ring-primary font-medium"
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

      <td className="py-1 px-1 bg-primary/5 min-w-[160px]">
        <DroppableCell 
          inputId={item.id} 
          field="micContra" 
          value={item.micContra} 
          onChange={(val) => onChange(item.id, 'micContra', val)}
          placeholder={t('rider_workshop.drop_here')}
        />
      </td>

      <td className="py-1 px-1 bg-primary/5 min-w-[160px]">
        <DroppableCell 
          inputId={item.id} 
          field="stand" 
          value={item.stand} 
          onChange={(val) => onChange(item.id, 'stand', val)}
          placeholder={t('rider_workshop.drop_here')}
        />
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

      <td className="py-1 px-1 text-center w-10">
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

// --- Pantalla Principal ---

const RiderWorkshop: React.FC = () => {
  const { eventFrameId } = useParams<{ eventFrameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { 
    getEventFrameById, 
    materialItems, 
    getMaterialAvailability,
    updatePerformance,
    showToast
  } = useEventDataStore();

  const eventFrame = useMemo(() => eventFrameId ? getEventFrameById(eventFrameId) : null, [eventFrameId, getEventFrameById]);
  
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  // Seleccionar la primera actuació per defecte
  useEffect(() => {
    if (eventFrame?.performances?.length && !selectedPerformanceId) {
      setSelectedPerformanceId(eventFrame.performances[0].id);
    }
  }, [eventFrame, selectedPerformanceId]);

  const performance = useMemo(() => 
    eventFrame?.performances?.find(p => p.id === selectedPerformanceId), 
  [eventFrame, selectedPerformanceId]);

  // Gestió de dades buferitzades
  const initialTechData = useMemo((): PerformanceTechData => ({
    inputList: performance?.techData?.inputList || [],
    lightingNotes: performance?.techData?.lightingNotes || '',
    videoNotes: performance?.techData?.videoNotes || '',
    stageRequirements: performance?.techData?.stageRequirements || '',
  }), [performance]);

  const {
    localData: techData,
    localDataRef: techDataRef,
    updateLocal,
    saveNow,
    isDirty
  } = useBufferedSave(initialTechData, (data) => {
    if (eventFrameId && performance) {
      updatePerformance(eventFrameId, { ...performance, techData: data });
    }
  });

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
        // Si canviem el text manualment, comprovem si encara és el material guardat
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
      <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground overflow-hidden">
        
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-none">{t('rider_workshop.title')}</h1>
              <p className="text-xs text-muted-foreground mt-1">{eventFrame.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('rider_workshop.switch_performance')}</span>
              <select 
                value={selectedPerformanceId || ''} 
                onChange={(e) => setSelectedPerformanceId(e.target.value)}
                className="bg-background border border-border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
              >
                {eventFrame.performances?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 border-l border-border pl-4">
               <Tooltip text={t('rider_workshop.copy_rider_to_contra')}>
                <button
                  onClick={copyRiderToContra}
                  className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-primary"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text={t('rider_workshop.clear_all_contra')}>
                <button
                  onClick={clearAllContra}
                  className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <button
              onClick={saveNow}
              disabled={!isDirty}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                isDirty ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Save className="w-4 h-4" />
              {isDirty ? t('performances.save_changes') : t('performances.saved')}
            </button>
          </div>
        </header>

        <div className="flex-grow flex overflow-hidden">
          
          {/* Sidebar - Inventari */}
          <aside className="w-72 border-r border-border bg-muted/30 flex flex-col shrink-0">
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('rider_workshop.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap transition-colors ${
                      activeCategory === cat 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    {cat === 'all' ? t('rider_workshop.all_categories') : cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                {t('rider_workshop.inventory_title')}
              </h3>
              {filteredMaterial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  {t('rider_workshop.no_material_found')}
                </div>
              ) : (
                filteredMaterial.map(item => (
                  <DraggableMaterial 
                    key={item.id} 
                    item={item} 
                    availability={getMaterialAvailability(item.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id)}
                  />
                ))
              )}
            </div>
          </aside>

          {/* Main Content - Taula de Rider */}
          <main className="flex-grow overflow-auto p-6 bg-background">
            {!performance ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                {t('performances.no_inputs')}
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Music className="text-primary w-6 h-6" />
                      {performance.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {performance.type} • {performance.showTime || '--:--'}
                    </p>
                  </div>
                  <button
                    onClick={addInputItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors text-sm font-medium border border-border"
                  >
                    <Plus className="w-4 h-4" />
                    {t('performances.add_input')}
                  </button>
                </div>

                <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    {/* ... (thead es manté igual) */}
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-left">
                        <th className="w-10"></th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.patch_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
                          {t('performances.channel_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.label_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.mic_rider_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.mic_contra_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.stand_header')}
                        </th>
                        <th className="py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {t('performances.notes_header')}
                        </th>
                        <th className="w-12"></th>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      {t('performances.lighting_notes')}
                    </label>
                    <textarea
                      value={techData.lightingNotes}
                      onChange={(e) => updateLocal({ lightingNotes: e.target.value })}
                      placeholder="..."
                      className="w-full h-32 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      {t('performances.video_notes')}
                    </label>
                    <textarea
                      value={techData.videoNotes}
                      onChange={(e) => updateLocal({ videoNotes: e.target.value })}
                      placeholder="..."
                      className="w-full h-32 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      {t('performances.stage_requirements')}
                    </label>
                    <textarea
                      value={techData.stageRequirements}
                      onChange={(e) => updateLocal({ stageRequirements: e.target.value })}
                      placeholder="..."
                      className="w-full h-32 p-3 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    />
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
