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
  MousePointerClick,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Cable,
  Star
} from 'lucide-react';
import RiderBalance from './RiderBalance';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { useRiderPdfConfigStore, autoSaveRiderPdfConfig } from '../../stores/riderPdfConfigStore';
import { notificationService } from '../../utils/notificationService';
import Tooltip from '../ui/Tooltip';
import AutosizeTextarea from '../ui/AutosizeTextarea';
import { 
  InputListItem, 
  MaterialItem,
  PerformanceTechData,
  Performance,
  MonitorListItem,
  PerformancePdfOptions,
  RiderGenericItem
} from '../../types';
import { useBufferedSave } from '../../hooks/useBufferedSave';
import { triggerAllSaves } from '../../utils/saveManager';
import { 
  generatePerformancePdfObjectWithOptions, 
  exportPerformanceToPdfWithOptions as exportPerformanceToPdfWithOptions, 
  validatePerformanceData 
} from '../../utils/pdfGenerator';
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
    
    // Càlcul per a l'actuació actual (buffer)
    let currentTotal = 0;
    techData.inputList?.forEach(i => {
      if (i.micContraId === item.id || i.standId === item.id || i.extresId === item.id) currentTotal += 1;
    });
    techData.monitorList?.forEach(m => {
      if (m.mixContraId === item.id) currentTotal += (m.monitorQty || 1);
      if (m.mixStandId === item.id) currentTotal += (m.standQty || 1);
    });
    techData.cableList?.forEach(c => { if (c.itemId === item.id) currentTotal += (c.qty || 1); });
    techData.spareList?.forEach(s => { if (s.itemId === item.id) currentTotal += (s.qty || 1); });

    if (currentTotal > 0) {
      assignments.push({
        eventName: eventFrame.name || 'Esdeveniment',
        performanceName: performance?.name || 'Actuació actual',
        quantity: currentTotal
      });
    }

    // Càlcul per a les altres actuacions (dades desades)
    eventFrame.performances?.forEach((perf: Performance) => {
      if (perf.id !== performance?.id) { 
        let perfTotal = 0;
        perf.techData?.inputList?.forEach(i => {
          if (i.micContraId === item.id || i.standId === item.id || i.extresId === item.id) perfTotal += 1;
        });
        perf.techData?.monitorList?.forEach(m => {
          if (m.mixContraId === item.id) perfTotal += (m.monitorQty || 1);
          if (m.mixStandId === item.id) perfTotal += (m.standQty || 1);
        });
        perf.techData?.cableList?.forEach(c => { if (c.itemId === item.id) perfTotal += (c.qty || 1); });
        perf.techData?.spareList?.forEach(s => { if (s.itemId === item.id) perfTotal += (s.qty || 1); });

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
  const isCurrentlyAssigned = assignments.some(a => a.performanceName === (performance?.name || 'Actuació actual') && a.quantity > 0);

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
  activeCell: { id: string; field: 'micContra' | 'stand' | 'extres' } | null;
  onCellFocus: (id: string, field: 'micContra' | 'stand' | 'extres') => void;
}

const WorkshopRow: React.FC<WorkshopRowProps> = ({ item, t, onChange, onRemove, activeCell, onCellFocus }) => {
  const { getMaterialAvailability, eventFrames, materialItems } = useEventDataStore();
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
  const extresStatus = checkAvailability(item.extresId);

  const micContraName = item.micContraId
    ? materialItems.find(m => m.id === item.micContraId)?.name ?? ''
    : item.micContra || '';
  const standName = item.standId
    ? materialItems.find(m => m.id === item.standId)?.name ?? ''
    : item.stand || '';
  const extresName = item.extresId
    ? materialItems.find(m => m.id === item.extresId)?.name ?? ''
    : item.extres || '';

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
  const isExtresActive = activeCell?.id === item.id && activeCell?.field === 'extres';

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
        <Tooltip text={micContraName || (micStatus.isError ? "Sense estoc disponible!" : "")}> 
          <div className={`relative flex items-center rounded border transition-all ${isMicActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={micContraName}
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
        <Tooltip text={standName || (standStatus.isError ? "Sense estoc disponible!" : "")}> 
          <div className={`relative flex items-center rounded border transition-all ${isStandActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={standName}
              onChange={(e) => onChange(item.id, 'stand', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'stand')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {standStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${extresStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={extresName || (extresStatus.isError ? "Sense estoc disponible!" : "")}> 
          <div className={`relative flex items-center rounded border transition-all ${isExtresActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={extresName}
              onFocus={() => onCellFocus(item.id, 'extres')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {extresStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
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
  const { getMaterialAvailability, eventFrames, materialItems } = useEventDataStore();
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

  const mixContraName = item.mixContraId
    ? materialItems.find(m => m.id === item.mixContraId)?.name ?? ''
    : item.mixContra || '';
  const mixStandName = item.mixStandId
    ? materialItems.find(m => m.id === item.mixStandId)?.name ?? ''
    : item.mixStand || '';

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
          placeholder="MIX"
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

      {/* Quantitat Monitor */}
      <td className="py-1 px-1 w-10">
        <input
          type="number"
          min={1}
          value={item.monitorQty ?? 1}
          onChange={(e) => onChange(item.id, 'monitorQty', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 px-1 py-0.5 bg-muted/50 border border-border rounded text-[9px] text-center focus:ring-1 focus:ring-primary/50 outline-none font-black"
        />
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${mixContraStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={mixContraName || (mixContraStatus.isError ? "Sense estoc disponible!" : "")}> 
          <div className={`relative flex items-center rounded border transition-all ${isMixContraActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={mixContraName}
              onChange={(e) => onChange(item.id, 'mixContra', e.target.value)}
              onFocus={() => onCellFocus(item.id, 'mixContra')}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {mixContraStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>

      {/* Quantitat Peu */}
      <td className="py-1 px-1 w-10">
        <input
          type="number"
          min={1}
          value={item.standQty ?? 1}
          onChange={(e) => onChange(item.id, 'standQty', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 px-1 py-0.5 bg-muted/50 border border-border rounded text-[9px] text-center focus:ring-1 focus:ring-primary/50 outline-none font-black"
        />
      </td>

      <td className={`py-1 px-1.5 min-w-[140px] transition-colors ${mixStandStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={mixStandName || (mixStandStatus.isError ? "Sense estoc disponible!" : "")}> 
          <div className={`relative flex items-center rounded border transition-all ${isMixStandActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={mixStandName}
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

// --- Generic Rider Row ---

interface GenericRiderRowProps {
  item: RiderGenericItem;
  onChange: (id: string, field: keyof RiderGenericItem, value: any) => void;
  onRemove: (id: string) => void;
  activeCell: { id: string; field: 'item' } | null;
  onCellFocus: (id: string) => void;
}

const GenericRiderRow: React.FC<GenericRiderRowProps> = ({ item, onChange, onRemove, activeCell, onCellFocus }) => {
  const { getMaterialAvailability, eventFrames, materialItems } = useEventDataStore();
  const { eventFrameId } = useParams<{ eventFrameId: string }>();
  const eventFrame = useMemo(() => eventFrameId ? eventFrames.find(ef => ef.id === eventFrameId) : null, [eventFrameId, eventFrames]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };

  const checkAvailability = (materialId?: string) => {
    if (!materialId || !eventFrame) return { isError: false };
    const avail = getMaterialAvailability(materialId, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
    return { isError: avail.available < 0 };
  };

  const itemStatus = checkAvailability(item.itemId);
  const isItemActive = activeCell?.id === item.id && activeCell?.field === 'item';

  const itemName = item.itemId
    ? materialItems.find(m => m.id === item.itemId)?.name ?? ''
    : item.itemName || '';

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-muted/30 transition-colors group ${isDragging ? 'bg-accent/50 shadow-lg' : ''}`}>
      <td className="w-8 text-center border-r border-border/50">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 opacity-20 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
        </div>
      </td>
      {/* Quantitat */}
      <td className="py-1 px-1 w-12">
        <input
          type="number"
          min={1}
          value={item.qty ?? 1}
          onChange={(e) => onChange(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
          className="w-10 px-1 py-0.5 bg-muted/50 border border-border rounded text-[9px] text-center focus:ring-1 focus:ring-primary/50 outline-none font-black"
        />
      </td>
      {/* Item (point and shoot) */}
      <td className={`py-1 px-1.5 min-w-[200px] transition-colors ${itemStatus.isError ? 'bg-destructive/10' : 'bg-primary/5'}`}>
        <Tooltip text={itemName || (itemStatus.isError ? 'Sense estoc disponible!' : '')}>
          <div className={`relative flex items-center rounded border transition-all ${isItemActive ? 'ring-1 ring-primary border-primary bg-background' : 'border-transparent'}`}>
            <input
              type="text"
              value={itemName}
              onChange={(e) => onChange(item.id, 'itemName', e.target.value)}
              onFocus={() => onCellFocus(item.id)}
              className="w-full px-2 py-1 bg-transparent border-none text-[11px] focus:outline-none placeholder:text-muted-foreground/30 font-medium"
              placeholder="Assignar..."
            />
            {itemStatus.isError && <Package className="absolute right-1.5 w-3 h-3 text-destructive animate-pulse" />}
          </div>
        </Tooltip>
      </td>
      {/* Notes */}
      <td className="py-1 px-1.5">
        <input
          type="text"
          value={item.notes}
          onChange={(e) => onChange(item.id, 'notes', e.target.value)}
          className="w-full px-1 py-1 bg-transparent border-none text-[10px] text-muted-foreground focus:ring-0 outline-none"
          placeholder="..."
        />
      </td>
      {/* Eliminar */}
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
  favoriteCategories?: string[];
  onToggleFavorite?: (category: string) => void;
}

const SearchableCategorySelector: React.FC<SearchableCategorySelectorProps> = ({ 
  categories, activeCategory, onSelect, placeholder, favoriteCategories = [], onToggleFavorite 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCategories = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return categories;
    return categories.filter(cat => cat.toLowerCase().includes(search));
  }, [categories, searchTerm]);

  // Separar categories preferides de la resta
  const { favoriteItems, otherItems } = useMemo(() => {
    const filtered = filteredCategories.filter(c => c !== 'all');
    const favorites = favoriteCategories.filter(cat => filtered.includes(cat));
    const others = filtered.filter(cat => !favoriteCategories.includes(cat));
    return { favoriteItems: favorites, otherItems: others };
  }, [filteredCategories, favoriteCategories]);

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
            
            {/* Secció de Preferits */}
            {favoriteItems.length > 0 && (
              <>
                <div className="px-2 py-1 text-[8px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/30 mb-1">
                  ⭐ Preferits
                </div>
                {favoriteItems.map((cat) => (
                  <div key={cat} className="flex items-center group">
                    <button
                      onClick={() => { onSelect(cat); setIsOpen(false); }}
                      className={`flex-1 text-left px-2 py-1.5 rounded-l text-[9px] font-medium transition-colors truncate ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
                    >
                      {cat}
                    </button>
                    <button
                      onClick={() => onToggleFavorite?.(cat)}
                      className="p-1.5 rounded-r border-l border-border/30 hover:bg-muted/50 transition-colors"
                      title="Treure de preferits"
                    >
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    </button>
                  </div>
                ))}
                {otherItems.length > 0 && (
                  <div className="px-2 py-1 text-[8px] text-muted-foreground border-b border-border/30 mb-1 mt-2"></div>
                )}
              </>
            )}
            
            {/* Resta de Categories */}
            {otherItems.map((cat) => (
              <div key={cat} className="flex items-center group">
                <button
                  onClick={() => { onSelect(cat); setIsOpen(false); }}
                  className={`flex-1 text-left px-2 py-1.5 rounded-l text-[9px] font-medium transition-colors truncate ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
                >
                  {cat}
                </button>
                <button
                  onClick={() => onToggleFavorite?.(cat)}
                  className="p-1.5 rounded-r border-l border-border/30 hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Afegir a preferits"
                >
                  <Star className="w-3 h-3 text-muted-foreground hover:text-yellow-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Component per Notes Tècniques amb Estat Local (per rapidesa) ---

interface TechnicalNoteProps {
  label: string;
  value: string;
  field: string;
  colorClass: string;
  onSave: (field: string, value: string) => void;
}

const TechnicalNote: React.FC<TechnicalNoteProps> = ({ label, value, field, colorClass, onSave }) => {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleBlur = () => {
    isFocused.current = false;
    onSave(field, localValue);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-1">
        <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
        {label}
      </label>
      <AutosizeTextarea 
        value={localValue} 
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => { isFocused.current = true; }}
        onBlur={handleBlur}
        className="w-full min-h-[80px] p-3 bg-muted/10 border border-border rounded-lg text-[11px] focus:ring-1 focus:ring-primary/30 outline-none resize-none font-medium transition-all" 
        placeholder={`${label}...`}
      />
    </div>
  );
};

// --- Pantalla Principal ---

const RiderWorkshop: React.FC = () => {
  // 1. Hooks de Router y Traducción
  const { eventFrameId: urlEventFrameId } = useParams<{ eventFrameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 2. Hooks de Store
  const { eventFrames, materialItems, getMaterialAvailability: getMaterialAvailabilityFromStore, updatePerformance } = useEventDataStore();
  const { openModal } = useModalStore();

  // Wrapper per adaptar la signatura de getMaterialAvailability
  const getMaterialAvailability = (materialId: string, startDate: Date, endDate: Date, eventFrameId: string) => {
    return getMaterialAvailabilityFromStore(
      materialId, 
      startDate.toISOString(), 
      endDate.toISOString(), 
      eventFrameId
    );
  };

  // 3. Estados Locales
  const [selectedEventFrameId, setSelectedEventFrameId] = useState<string | null>(urlEventFrameId || null);
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<{ id: string; field: 'micContra' | 'stand' | 'extres' | 'mixContra' | 'mixStand' | 'cable' | 'spare' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  
  // 4. Referencias
  const migratedPerformances = useRef<Set<string>>(new Set());

  // 5. Estados para secciones colapsables
  const [isInputsExpanded, setIsInputsExpanded] = useState(true);
  const [isMonitorsExpanded, setIsMonitorsExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
const [isCableExpanded, setIsCableExpanded] = useState(true);
const [isSpareExpanded, setIsSpareExpanded]  = useState(true);
const [showCableInPdf, setShowCableInPdf]   = useState(true);

  // Estat per a les opcions del PDF (només lectura, reaprofitat de PerformanceDetailContainer)
  const [pdfOptions] = useState<PerformancePdfOptions>({
    includeBasicInfo: true,
    includeInputs: true,
    includeMonitors: true,
    includeCable: true,     // NOU
    includeSpare: true,     // NOU
    includeTechnicalNotes: true,
    includeHospitality: true,
    includeGeneralNotes: true,
    showEmptySections: false,
  });

  // --- CONFIGURACIÓ DEL PDF (Store) ---
  const {
    config: pdfConfig,
    setOrientation,
    setSection,
    setInputColumn,
    setMonitorColumn,
    setBalanceConfig,
    loadConfig,
  } = useRiderPdfConfigStore();

  // Estat per rebre les dades del balanç (WYSIWYG)
  const [balanceData, setBalanceData] = useState<any[]>([]);

  // Carregar configuració al muntar el component
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

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
      const updatedPerf = { ...perf, techData: { inputList:[], monitorList: [], cableList: [], spareList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' } };
      setTimeout(() => { if (selectedEventFrameId) updatePerformance(selectedEventFrameId, updatedPerf); }, 0);
      return updatedPerf;
    }
    return perf;
  },[eventFrame, selectedPerformanceId, selectedEventFrameId, updatePerformance]);

  const initialTechData = useMemo(() => 
    performance?.techData || { inputList:[], monitorList: [], cableList: [], spareList: [], lightingNotes: '', videoNotes: '', stageRequirements: '' }
  , [performance]);

  // 8. Hook de Guardado con Buffering
  const { localData: techData, localDataRef: techDataRef, updateLocal, saveNow, isDirty } = useBufferedSave(initialTechData, (data) => {
    if (selectedEventFrameId && performance) updatePerformance(selectedEventFrameId, { ...performance, techData: data });
  });

  const materialCategories = useMemo(() => ['all', ...Array.from(new Set(materialItems.map(m => m.category)))].sort(), [materialItems]);

  // Carregar preferències de categories
  useEffect(() => {
    const loadFavoriteCategories = async () => {
      try {
        if (window.electronAPI?.getSessionData) {
          const sessionData = await window.electronAPI.getSessionData();
          setFavoriteCategories(sessionData.favoriteCategories || []);
        }
      } catch (error) {
        console.error('[RiderWorkshop] Error carregant categories preferides:', error);
      }
    };
    loadFavoriteCategories();
  }, []);

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
      return;
    }
    const cableIndex = (techData.cableList || []).findIndex(i => i.id === active.id);
    if (cableIndex !== -1) {
      const newIndex = (techData.cableList || []).findIndex(i => i.id === over.id);
      if (newIndex !== -1) updateLocal({ cableList: arrayMove(techData.cableList || [], cableIndex, newIndex) });
      return;
    }
    const spareIndex = (techData.spareList || []).findIndex(i => i.id === active.id);
    if (spareIndex !== -1) {
      const newIndex = (techData.spareList || []).findIndex(i => i.id === over.id);
      if (newIndex !== -1) updateLocal({ spareList: arrayMove(techData.spareList || [], spareIndex, newIndex) });
    }
  };

  const handleToggleFavoriteCategory = async (category: string) => {
    try {
      const newFavorites = favoriteCategories.includes(category)
        ? favoriteCategories.filter(c => c !== category)
        : [...favoriteCategories, category];
      
      setFavoriteCategories(newFavorites);
      
      if (window.electronAPI?.saveSessionData) {
        await window.electronAPI.saveSessionData('favoriteCategories', newFavorites);
      }
    } catch (error) {
      console.error('[RiderWorkshop] Error desant categories preferides:', error);
    }
  };

  const handleInputChange = (id: string, field: any, value: any) => {
    const newList = techDataRef.current.inputList.map(item => {
      if (item.id === id) {
        const up = { ...item, [field]: value };
        if (field === 'micContra' || field === 'stand' || field === 'extres') {
          // Si el valor ve de l'inventari (té ID), actualitzar l'ID
          const matched = materialItems.find(m => m.name === value);
          if (field === 'micContra') {
            up.micContraId = matched ? matched.id : undefined;
            up.micContra = matched ? matched.name : value;
          } else if (field === 'stand') {
            up.standId = matched ? matched.id : undefined;
            up.stand = matched ? matched.name : value;
          } else if (field === 'extres') {
            up.extresId = matched ? matched.id : undefined;
            up.extres = matched ? matched.name : value;
          }
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
          // Si el valor ve de l'inventari (té ID), actualitzar l'ID
          const matched = materialItems.find(m => m.name === value);
          if (field === 'mixContra') {
            up.mixContraId = matched ? matched.id : undefined;
            up.mixContra = matched ? matched.name : value;
          } else if (field === 'mixStand') {
            up.mixStandId = matched ? matched.id : undefined;
            up.mixStand = matched ? matched.name : value;
          }
        }
        return up;
      }
      return item;
    });
    updateLocal({ monitorList: newList });
  };

  const handleGenericChange = (
    listKey: 'cableList' | 'spareList',
    id: string, field: keyof RiderGenericItem, value: any
  ) => {
    const newList = (techDataRef.current[listKey] || []).map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'itemName') {
        // Si el valor ve de l'inventari (té ID), actualitzar l'ID
        const matched = materialItems.find(m => m.name === value);
        updated.itemId = matched ? matched.id : undefined;
        updated.itemName = matched ? matched.name : value;
      }
      return updated;
    });
    updateLocal({ [listKey]: newList });
  };

  const addGenericItem = (listKey: 'cableList' | 'spareList') => {
    const newItem: RiderGenericItem = {
      id: Date.now().toString(),
      qty: 1,
      itemName: '',
      notes: '',
    };
    updateLocal({ [listKey]: [...(techDataRef.current[listKey] || []), newItem] });
    if (listKey === 'cableList' && !isCableExpanded) setIsCableExpanded(true);
    if (listKey === 'spareList' && !isSpareExpanded) setIsSpareExpanded(true);
  };

  const handleMaterialClick = (material: MaterialItem) => {
    if (activeCell) {
      if (activeCell.field === 'mixContra' || activeCell.field === 'mixStand') {
        // Assignar directament amb ID per evitar ambigüitats
        const newList = (techDataRef.current.monitorList || []).map(item => {
          if (item.id === activeCell.id) {
            const up = { ...item };
            if (activeCell.field === 'mixContra') {
              up.mixContraId = material.id;
              up.mixContra = material.name;
            } else if (activeCell.field === 'mixStand') {
              up.mixStandId = material.id;
              up.mixStand = material.name;
            }
            return up;
          }
          return item;
        });
        updateLocal({ monitorList: newList });
      } else if (activeCell.field === 'cable') {
        const newList = (techDataRef.current.cableList || []).map(item => {
          if (item.id === activeCell.id) {
            return { ...item, itemId: material.id, itemName: material.name };
          }
          return item;
        });
        updateLocal({ cableList: newList });
      } else if (activeCell.field === 'spare') {
        const newList = (techDataRef.current.spareList || []).map(item => {
          if (item.id === activeCell.id) {
            return { ...item, itemId: material.id, itemName: material.name };
          }
          return item;
        });
        updateLocal({ spareList: newList });
      } else {
        // Inputs: micContra, stand, extres
        const newList = techDataRef.current.inputList.map(item => {
          if (item.id === activeCell.id) {
            const up = { ...item };
            if (activeCell.field === 'micContra') {
              up.micContraId = material.id;
              up.micContra = material.name;
            } else if (activeCell.field === 'stand') {
              up.standId = material.id;
              up.stand = material.name;
            } else if (activeCell.field === 'extres') {
              up.extresId = material.id;
              up.extres = material.name;
            }
            return up;
          }
          return item;
        });
        updateLocal({ inputList: newList });
      }
      notificationService.success(`${material.name} assignat`);
    } else {
      notificationService.info('Selecciona una casella per assignar material.');
    }
  };

  const handleEventChange = (id: string) => {
    setSelectedEventFrameId(id);
    navigate(`/riders/${id}`, { replace: true });
  };

  // --- LÒGICA DE PDF ---
  const handlePreviewRider = () => {
    triggerAllSaves(); // WYSIWYG: Força guardar el buffer
    
    // Obtenim les dades més recents
    const latestEventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === selectedEventFrameId);
    const latestPerformance = latestEventFrame?.performances?.find(p => p.id === selectedPerformanceId);
    
    if (!latestPerformance || !latestEventFrame) return;

    // Validació
    const validation = validatePerformanceData(latestPerformance);
    if (!validation.isValid) {
      validation.errors.forEach(err => notificationService.error(err));
      return;
    }

    try {
      const doc = generatePerformancePdfObjectWithOptions(
        latestPerformance, 
        latestEventFrame, 
        {
          ...pdfOptions,
          includeBasicInfo: pdfConfig.sections.basicInfo,
          includeInputs: pdfConfig.sections.inputs,
          includeMonitors: pdfConfig.sections.monitors,
          includeCable: pdfConfig.sections.cable,
          includeSpare: pdfConfig.sections.spare,
          includeTechnicalNotes: pdfConfig.sections.technicalNotes,
          includeHospitality: pdfConfig.sections.hospitality,
          includeGeneralNotes: pdfConfig.sections.generalNotes,
          showBalance: pdfConfig.sections.balance,
          inputColumns: pdfConfig.inputColumns,
          monitorColumns: pdfConfig.monitorColumns,
          pdfOrientation: pdfConfig.orientation,
          balanceData: balanceData,
        },
      );
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
      
      openModal('pdfPreview', {
        pdfUrl,
        titleOverride: t('modals.pdf_preview.title_override', { name: latestPerformance.name }),
        onSave: () => handleExportRider()
      });
    } catch (error) {
      notificationService.error((error as Error).message);
    }
  };

  const handleExportRider = () => {
    triggerAllSaves();
    const latestEventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === selectedEventFrameId);
    const latestPerformance = latestEventFrame?.performances?.find(p => p.id === selectedPerformanceId);
    
    if (!latestPerformance || !latestEventFrame) return;

    exportPerformanceToPdfWithOptions(
      latestPerformance, 
      latestEventFrame, 
      {
        ...pdfOptions,
        includeBasicInfo: pdfConfig.sections.basicInfo,
        includeInputs: pdfConfig.sections.inputs,
        includeMonitors: pdfConfig.sections.monitors,
        includeCable: pdfConfig.sections.cable,
        includeSpare: pdfConfig.sections.spare,
        includeTechnicalNotes: pdfConfig.sections.technicalNotes,
        includeHospitality: pdfConfig.sections.hospitality,
        includeGeneralNotes: pdfConfig.sections.generalNotes,
        showBalance: pdfConfig.sections.balance,
        inputColumns: pdfConfig.inputColumns,
        monitorColumns: pdfConfig.monitorColumns,
        pdfOrientation: pdfConfig.orientation,
        balanceData: balanceData,
      },
      () => notificationService.info('PDF generat correctament')
    );
  };

  const addInputItem = () => { 
    const currentList = techDataRef.current.inputList;
    const last = currentList[currentList.length-1]; 
    let next = '1'; 
    if (last?.channel) { 
      const n = parseInt(last.channel); 
      if (!isNaN(n)) next = (n+1).toString(); 
    } else if (currentList.length > 0) {
      next = (currentList.length + 1).toString();
    }
    updateLocal({ inputList: [...techDataRef.current.inputList, { id: Date.now().toString(), channel: next, patchColor: 'transparent', patchNumber: '', label: '', micRider: '', micContra: '', stand: '', notes: '' }] }); 
    if (!isInputsExpanded) setIsInputsExpanded(true);
  };

  const addMonitorItem = () => { 
    const currentList = techDataRef.current.monitorList || [];
    const last = currentList[currentList.length-1]; 
    let next = 'MIX 1'; 
    if (last?.outputChannel) { 
      const match = last.outputChannel.match(/(\d+)/);
      if (match) {
        next = `MIX ${parseInt(match[1]) + 1}`;
      } else {
        next = `MIX ${currentList.length + 1}`;
      }
    } else if (currentList.length > 0) {
      next = `MIX ${currentList.length + 1}`;
    }
    updateLocal({ monitorList: [...currentList, { id: Date.now().toString(), outputChannel: next, patchColor: 'transparent', patchNumber: '', label: '', mixRider: '', mixContra: '', monitorQty: 1, mixStand: '', standQty: 1, notes: '' }] }); 
    if (!isMonitorsExpanded) setIsMonitorsExpanded(true); 
  };

  // --- RENDERITZAT CONDICIONAL (DESPRÉS DE TOTS ELS HOOKS) ---

// Helper per calcular l'ús en temps real tenint en compte les quantitats
  const calculateUsageForItem = (data: PerformanceTechData | undefined, itemId: string) => {
    if (!data) return 0;
    let count = 0;
    data.inputList?.forEach(i => {
      if (i.micContraId === itemId) count += 1;
      if (i.standId === itemId) count += 1;
      if (i.extresId === itemId) count += 1;
    });
    data.monitorList?.forEach(m => {
      if (m.mixContraId === itemId) count += (m.monitorQty || 1);
      if (m.mixStandId === itemId) count += (m.standQty || 1);
    });
    data.cableList?.forEach(c => { if (c.itemId === itemId) count += (c.qty || 1); });
    data.spareList?.forEach(s => { if (s.itemId === itemId) count += (s.qty || 1); });
    return count;
  };

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
            <SearchableCategorySelector 
              categories={materialCategories} 
              activeCategory={activeCategory} 
              onSelect={setActiveCategory} 
              placeholder="Categories"
              favoriteCategories={favoriteCategories}
              onToggleFavorite={handleToggleFavoriteCategory}
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-2 custom-scrollbar bg-muted/5">
          <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2 px-1 opacity-50"><Package className="w-3 h-3" /> Inventari</h3>
          {eventFrame && filteredMaterial.map(item => {
            const globalAvail = getMaterialAvailability(item.id, new Date(eventFrame.startDate), new Date(eventFrame.endDate), eventFrame.id);
            const savedUsage = calculateUsageForItem(performance?.techData, item.id);
            const localUsage = calculateUsageForItem(techData, item.id);
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
            </div>
          </div>
        </header>

        {/* CONTINGUT SCROLLABLE */}
        <main className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* SECCIÓ DE CONTROLS PDF */}
          <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-3 py-2 bg-muted/20 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Controls PDF</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tooltip text={t('tech_sheets.form.tooltip_preview')}>
                    <button onClick={handlePreviewRider} className="p-1.5 hover:bg-secondary/20 text-muted-foreground hover:text-secondary-foreground rounded-md transition-all active:scale-95">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text={t('tech_sheets.form.tooltip_export')}>
                    <button onClick={handleExportRider} className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-all active:scale-95">
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {/* Orientació del PDF */}
              <div className="flex items-center gap-2">
                <Tooltip text="Selecciona l'orientació de la pàgina del PDF (vertical o horitzontal)">
                  <label htmlFor="pdfOrientation" className="font-medium text-muted-foreground cursor-pointer">Orientació:</label>
                </Tooltip>
                <select
                  id="pdfOrientation"
                  value={pdfConfig.orientation}
                  onChange={(e) => {
                    setOrientation(e.target.value as 'portrait' | 'landscape');
                    autoSaveRiderPdfConfig();
                  }}
                  className="h-6 px-2 text-[9px] border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horitzontal</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px]">
                {/* Info Bàsica */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou informació bàsica de l'esdeveniment, artista i horaris al PDF">
                    <input
                      type="checkbox"
                      id="showBasicInfoInPdf"
                      checked={pdfConfig.sections.basicInfo}
                      onChange={(e) => {
                        setSection('basicInfo', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showBasicInfoInPdf" className="font-medium text-muted-foreground cursor-pointer">Info Bàsica</label>
                </div>
                {/* Inputs */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou la taula d'inputs (micròfons) amb les columnes seleccionades al PDF">
                    <input
                      type="checkbox"
                      id="showInputsInPdf"
                      checked={pdfConfig.sections.inputs}
                      onChange={(e) => {
                        setSection('inputs', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showInputsInPdf" className="font-medium text-muted-foreground cursor-pointer">Inputs</label>
                </div>
                {/* Monitors */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou la taula de monitors (MIX) amb les columnes seleccionades al PDF">
                    <input
                      type="checkbox"
                      id="showMonitorsInPdf"
                      checked={pdfConfig.sections.monitors}
                      onChange={(e) => {
                        setSection('monitors', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showMonitorsInPdf" className="font-medium text-muted-foreground cursor-pointer">Monitors</label>
                </div>
                {/* Cablejat */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou la secció de cablejat al PDF">
                    <input
                      type="checkbox"
                      id="showCableInPdf"
                      checked={pdfConfig.sections.cable}
                      onChange={(e) => {
                        setSection('cable', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showCableInPdf" className="font-medium text-muted-foreground cursor-pointer">Cablejat</label>
                </div>
                {/* Material Spare */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou la secció de material spare al PDF">
                    <input
                      type="checkbox"
                      id="showSpareInPdf"
                      checked={pdfConfig.sections.spare}
                      onChange={(e) => {
                        setSection('spare', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showSpareInPdf" className="font-medium text-muted-foreground cursor-pointer">Material Spare</label>
                </div>
                {/* Notes Tècniques */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou notes tècniques d'il·luminació, vídeo i requeriments d'escenari al PDF">
                    <input
                      type="checkbox"
                      id="showTechnicalNotesInPdf"
                      checked={pdfConfig.sections.technicalNotes}
                      onChange={(e) => {
                        setSection('technicalNotes', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showTechnicalNotesInPdf" className="font-medium text-muted-foreground cursor-pointer">Notes Tècniques</label>
                </div>
                {/* Hospitalitat */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou informació d'hostes: cambres, catering, dietes, logística i aparcament al PDF">
                    <input
                      type="checkbox"
                      id="showHospitalityInPdf"
                      checked={pdfConfig.sections.hospitality}
                      onChange={(e) => {
                        setSection('hospitality', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showHospitalityInPdf" className="font-medium text-muted-foreground cursor-pointer">Hospitalitat</label>
                </div>
                {/* Notes Generals */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou les notes generals de l'actuació al PDF">
                    <input
                      type="checkbox"
                      id="showGeneralNotesInPdf"
                      checked={pdfConfig.sections.generalNotes}
                      onChange={(e) => {
                        setSection('generalNotes', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showGeneralNotesInPdf" className="font-medium text-muted-foreground cursor-pointer">Notes Generals</label>
                </div>
                {/* Balanç */}
                <div className="flex items-center gap-2">
                  <Tooltip text="Inclou el balanç consolidat de materials vs disponibilitat de tot l'esdeveniment al PDF">
                    <input
                      type="checkbox"
                      id="showBalanceInPdf"
                      checked={pdfConfig.sections.balance}
                      onChange={(e) => {
                        setSection('balance', e.target.checked);
                        autoSaveRiderPdfConfig();
                      }}
                      className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                    />
                  </Tooltip>
                  <label htmlFor="showBalanceInPdf" className="font-medium text-muted-foreground cursor-pointer">Balanç</label>
                </div>
              </div>
            </div>
          </section>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {/* SECCIÓ INPUTS */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsInputsExpanded(!isInputsExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <LayoutGridIcon className="w-3.5 h-3.5 text-primary" /> 
                      Llista d'Inputs
                      <span className="text-muted-foreground ml-2">({techData.inputList.length})</span>
                    </h3>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Tooltip text="Inclou la taula d'inputs (micròfons) al PDF">
                        <input
                          type="checkbox"
                          id="showInputsInPdf_section"
                          checked={pdfConfig.sections.inputs}
                          onChange={(e) => {
                            setSection('inputs', e.target.checked);
                            autoSaveRiderPdfConfig();
                          }}
                          className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                        />
                      </Tooltip>
                      <label htmlFor="showInputsInPdf_section" className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 bg-background/50 rounded-md p-0.5 border border-border/50">
                      <Tooltip text="Copiar Rider a Contra">
                        <button onClick={() => { updateLocal({ inputList: techDataRef.current.inputList.map(i => ({ ...i, micContra: i.micContra || i.micRider })) }); notificationService.success("Copiats"); }} className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </Tooltip>
                      <Tooltip text="Netejar Contra-rider">
                        <button onClick={() => { updateLocal({ inputList: techDataRef.current.inputList.map(i => ({ ...i, micContra: '', micContraId: undefined, stand: '', standId: undefined })) }); notificationService.info("Netejat"); }} className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Tooltip>
                    </div>
                    <button onClick={addInputItem} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <Plus className="w-2.5 h-2.5" /> AFEGIR INPUT
                    </button>
                    {isInputsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                {isInputsExpanded && (
                  <div className="flex flex-col">
                    <table className="w-full border-collapse animate-in fade-in duration-200">
                      <thead>
                        <tr className="bg-muted/10 text-left border-b border-border">
                          <th className="w-8"></th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Patch
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.patch}
                                onChange={() => {
                                  setInputColumn('patch', !pdfConfig.inputColumns.patch);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">
                            <div className="flex items-center justify-center gap-1">
                              CH
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.channel}
                                onChange={() => {
                                  setInputColumn('channel', !pdfConfig.inputColumns.channel);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Etiqueta
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.label}
                                onChange={() => {
                                  setInputColumn('label', !pdfConfig.inputColumns.label);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Rider
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.rider}
                                onChange={() => {
                                  setInputColumn('rider', !pdfConfig.inputColumns.rider);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Contra
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.contra}
                                onChange={() => {
                                  setInputColumn('contra', !pdfConfig.inputColumns.contra);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Peu
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.stand}
                                onChange={() => {
                                  setInputColumn('stand', !pdfConfig.inputColumns.stand);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              NOTES/EXTRES
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.notes}
                                onChange={() => {
                                  setInputColumn('notes', !pdfConfig.inputColumns.notes);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">
                            <div className="flex items-center justify-center gap-1">
                              Exc.
                              <input
                                type="checkbox"
                                checked={pdfConfig.inputColumns.exclusive}
                                onChange={() => {
                                  setInputColumn('exclusive', !pdfConfig.inputColumns.exclusive);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <SortableContext items={techData.inputList} strategy={verticalListSortingStrategy}>
                          {techData.inputList.map(item => <WorkshopRow key={item.id} item={item} t={t} onChange={handleInputChange} onRemove={(id) => updateLocal({ inputList: techDataRef.current.inputList.filter(i => i.id !== id) })} activeCell={activeCell?.field === 'micContra' || activeCell?.field === 'stand' || activeCell?.field === 'extres' ? activeCell as any : null} onCellFocus={(id, field) => setActiveCell({ id, field })} />)}
                        </SortableContext>
                      </tbody>
                    </table>
                    <button onClick={addInputItem} className="w-full py-2 bg-muted/5 hover:bg-muted/20 text-[9px] font-black text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 border-t border-border/30">
                      <Plus className="w-3.5 h-3.5" /> AFEGIR NOVA FILA D'INPUT
                    </button>
                  </div>
                )}
              </section>

              {/* SECCIÓ MONITORS */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsMonitorsExpanded(!isMonitorsExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-primary" /> 
                      Monitors
                      <span className="text-muted-foreground ml-2">({techData.monitorList?.length || 0})</span>
                    </h3>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Tooltip text="Inclou la taula de monitors (MIX) al PDF">
                        <input
                          type="checkbox"
                          id="showMonitorsInPdf_section"
                          checked={pdfConfig.sections.monitors}
                          onChange={(e) => {
                            setSection('monitors', e.target.checked);
                            autoSaveRiderPdfConfig();
                          }}
                          className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                        />
                      </Tooltip>
                      <label htmlFor="showMonitorsInPdf_section" className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); addMonitorItem(); }} className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1"><Plus className="w-2.5 h-2.5" /> AFEGIR MONITOR</button>
                    {isMonitorsExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                {isMonitorsExpanded && (
                  <div className="flex flex-col">
                    <table className="w-full border-collapse animate-in fade-in duration-200">
                      <thead>
                        <tr className="bg-muted/10 text-left border-b border-border">
                          <th className="w-8"></th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Patch
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.patch}
                                onChange={() => {
                                  setMonitorColumn('patch', !pdfConfig.monitorColumns.patch);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">
                            <div className="flex items-center justify-center gap-1">
                              MIX
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.outputChannel}
                                onChange={() => {
                                  setMonitorColumn('outputChannel', !pdfConfig.monitorColumns.outputChannel);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Etiqueta
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.label}
                                onChange={() => {
                                  setMonitorColumn('label', !pdfConfig.monitorColumns.label);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Rider
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.rider}
                                onChange={() => {
                                  setMonitorColumn('rider', !pdfConfig.monitorColumns.rider);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center w-10">Qttat</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Contra
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.contra}
                                onChange={() => {
                                  setMonitorColumn('contra', !pdfConfig.monitorColumns.contra);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center w-10">Qttat</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Peu
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.stand}
                                onChange={() => {
                                  setMonitorColumn('stand', !pdfConfig.monitorColumns.stand);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            <div className="flex items-center gap-1">
                              Notes
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.notes}
                                onChange={() => {
                                  setMonitorColumn('notes', !pdfConfig.monitorColumns.notes);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">
                            <div className="flex items-center justify-center gap-1">
                              Exc.
                              <input
                                type="checkbox"
                                checked={pdfConfig.monitorColumns.exclusive}
                                onChange={() => {
                                  setMonitorColumn('exclusive', !pdfConfig.monitorColumns.exclusive);
                                  autoSaveRiderPdfConfig();
                                }}
                                className="h-2 w-2 rounded border-border accent-primary focus:ring-primary"
                              />
                            </div>
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <SortableContext items={(techData.monitorList || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
                          {(techData.monitorList || []).map(item => <MonitorRow key={item.id} item={item} onChange={handleMonitorChange} onRemove={(id) => updateLocal({ monitorList: (techDataRef.current.monitorList || []).filter(i => i.id !== id) })} activeCell={activeCell?.field === 'mixContra' || activeCell?.field === 'mixStand' ? activeCell as any : null} onCellFocus={(id, field) => setActiveCell({ id, field })} />)}
                        </SortableContext>
                      </tbody>
                    </table>
                    <button onClick={addMonitorItem} className="w-full py-2 bg-muted/5 hover:bg-muted/20 text-[9px] font-black text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 border-t border-border/30">
                      <Plus className="w-3.5 h-3.5" /> AFEGIR NOU MONITOR
                    </button>
                  </div>
                )}
              </section>

              {/* SECCIÓ CABLEJAT */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsCableExpanded(!isCableExpanded)}
                  className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Cable className="w-3.5 h-3.5 text-primary" />
                      Cablejat
                      <span className="text-muted-foreground ml-2">({techData.cableList?.length || 0})</span>
                    </h3>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={showCableInPdf}
                        onChange={(e) => setShowCableInPdf(e.target.checked)}
                        className="h-3 w-3 rounded border-border accent-primary focus:ring-primary" />
                      <label className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => addGenericItem('cableList')}
                      className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <Plus className="w-2.5 h-2.5" /> AFEGIR CABLE
                    </button>
                    {isCableExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                {isCableExpanded && (
                  <div className="flex flex-col">
                    <table className="w-full border-collapse animate-in fade-in duration-200">
                      <thead>
                        <tr className="bg-muted/10 text-left border-b border-border">
                          <th className="w-8"></th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-12">Qttat</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Material</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Notes</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <SortableContext items={(techData.cableList || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
                          {(techData.cableList || []).map(item =>
                            <GenericRiderRow key={item.id} item={item}
                              onChange={(id, field, value) => handleGenericChange('cableList', id, field, value)}
                              onRemove={(id) => updateLocal({ cableList: (techDataRef.current.cableList || []).filter(i => i.id !== id) })}
                              activeCell={activeCell?.field === 'cable' ? activeCell as any : null}
                              onCellFocus={(id) => setActiveCell({ id, field: 'cable' })}
                            />
                          )}
                        </SortableContext>
                      </tbody>
                    </table>
                    <button onClick={() => addGenericItem('cableList')}
                      className="w-full py-2 bg-muted/5 hover:bg-muted/20 text-[9px] font-black text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 border-t border-border/30">
                      <Plus className="w-3.5 h-3.5" /> AFEGIR NOU CABLE
                    </button>
                  </div>
                )}
              </section>

              {/* SECCIÓ MATERIAL SPARE */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsSpareExpanded(!isSpareExpanded)}
                  className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      Material Spare
                      <span className="text-muted-foreground ml-2">({techData.spareList?.length || 0})</span>
                    </h3>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={pdfConfig.sections.spare}
                        onChange={(e) => {
                          setSection('spare', e.target.checked);
                          autoSaveRiderPdfConfig();
                        }}
                        className="h-3 w-3 rounded border-border accent-primary focus:ring-primary" 
                      />
                      <label className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => addGenericItem('spareList')}
                      className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1">
                      <Plus className="w-2.5 h-2.5" /> AFEGIR SPARE
                    </button>
                    {isSpareExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                {isSpareExpanded && (
                  <div className="flex flex-col">
                    <table className="w-full border-collapse animate-in fade-in duration-200">
                      <thead>
                        <tr className="bg-muted/10 text-left border-b border-border">
                          <th className="w-8"></th>
                          <th className="py-1.5 px-1 text-[9px] font-black text-muted-foreground uppercase tracking-widest w-12">Qttat</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Material</th>
                          <th className="py-1.5 px-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Notes</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <SortableContext items={(techData.spareList || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
                          {(techData.spareList || []).map(item =>
                            <GenericRiderRow key={item.id} item={item}
                              onChange={(id, field, value) => handleGenericChange('spareList', id, field, value)}
                              onRemove={(id) => updateLocal({ spareList: (techDataRef.current.spareList || []).filter(i => i.id !== id) })}
                              activeCell={activeCell?.field === 'spare' ? activeCell as any : null}
                              onCellFocus={(id) => setActiveCell({ id, field: 'spare' })}
                            />
                          )}
                        </SortableContext>
                      </tbody>
                    </table>
                    <button onClick={() => addGenericItem('spareList')}
                      className="w-full py-2 bg-muted/5 hover:bg-muted/20 text-[9px] font-black text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 border-t border-border/30">
                      <Plus className="w-3.5 h-3.5" /> AFEGIR NOU SPARE
                    </button>
                  </div>
                )}
              </section>

              {/* SECCIÓ NOTES */}
              <section className="rounded border border-border bg-card shadow-sm overflow-hidden">
                <div onClick={() => setIsNotesExpanded(!isNotesExpanded)} className="px-3 py-1.5 bg-muted/20 border-b border-border flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <EditIcon className="w-3.5 h-3.5 text-primary" /> 
                      Notes Tècniques
                    </h3>
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Tooltip text="Inclou notes tècniques d'il·luminació, vídeo i escenari al PDF">
                        <input
                          type="checkbox"
                          id="showTechnicalNotesInPdf_section"
                          checked={pdfConfig.sections.technicalNotes}
                          onChange={(e) => {
                            setSection('technicalNotes', e.target.checked);
                            autoSaveRiderPdfConfig();
                          }}
                          className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                        />
                      </Tooltip>
                      <label htmlFor="showTechnicalNotesInPdf_section" className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
                    </div>
                  </div>
                  {isNotesExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                {isNotesExpanded && (
                  <div className="flex flex-col gap-4 p-4 animate-in fade-in duration-200">
                    <TechnicalNote 
                      label={t('performances.lighting_notes')}
                      value={techData.lightingNotes}
                      field="lightingNotes"
                      colorClass="bg-blue-500"
                      onSave={(field, val) => updateLocal({ [field]: val })}
                    />
                    <TechnicalNote 
                      label={t('performances.video_notes')}
                      value={techData.videoNotes}
                      field="videoNotes"
                      colorClass="bg-purple-500"
                      onSave={(field, val) => updateLocal({ [field]: val })}
                    />
                    <TechnicalNote 
                      label={t('performances.stage_requirements')}
                      value={techData.stageRequirements}
                      field="stageRequirements"
                      colorClass="bg-green-500"
                      onSave={(field, val) => updateLocal({ [field]: val })}
                    />
                  </div>
                )}
              </section>

              {/* BALANÇ INTEGRAT - Aquí sota les notes */}
              <RiderBalance 
                performances={eventFrame?.performances || []} 
                materialItems={materialItems} 
                eventFrame={eventFrame as any} 
                getMaterialAvailability={getMaterialAvailability}
                showInPdf={pdfConfig.sections.balance}
                onTogglePdf={() => {
                  setSection('balance', !pdfConfig.sections.balance);
                  autoSaveRiderPdfConfig();
                }}
                currentPerformanceId={selectedPerformanceId || undefined}
                bufferedTechData={techData}
                onBalanceDataChange={setBalanceData}
                balanceConfig={pdfConfig.balanceConfig}
                setBalanceConfig={setBalanceConfig}
              />
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