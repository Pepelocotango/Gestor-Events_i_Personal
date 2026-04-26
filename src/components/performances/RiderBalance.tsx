/**
 * =============================================================================
 * RIDER BALANCE
 * =============================================================================
 * DESCRIPCIÓ:
 * Component per calcular i mostrar el balanç de rider d'una actuació.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, lucide i components.
 * - COMPONENT PRINCIPAL: RiderBalance amb càlculs de balanç.
 * - ESTAT I CÀLCULS: Estat de filtres i càlculs de totals.
 * - HANDLERS: Gestió de canvis de filtres i exportació.
 * - RENDERITZAT: Estructura de taula amb balanç de rider.
 * =============================================================================
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { 
  MaterialItem,
  PerformanceTechData,
  Performance,
  EventFrame
} from '../../types';
import { autoSaveRiderPdfConfig } from '../../stores/riderPdfConfigStore';

interface RiderBalanceProps {
  performances: Performance[];
  materialItems: MaterialItem[];
  eventFrame: EventFrame;
  getMaterialAvailability: (materialId: string, startDate: Date, endDate: Date, eventFrameId: string) => { available: number; total: number };
  showInPdf?: boolean;
  onTogglePdf?: () => void;
  currentPerformanceId?: string | undefined;
  bufferedTechData?: PerformanceTechData;
  onBalanceDataChange?: (balanceData: any[]) => void; // Callback per passar dades al PDF
  balanceConfig?: { sortByCategory: boolean; sortByLocation: boolean; printBalance: boolean };
  setBalanceConfig?: (config: Partial<{ sortByCategory: boolean; sortByLocation: boolean; printBalance: boolean }>) => void;
  readOnly?: boolean;
}

const RiderBalance: React.FC<RiderBalanceProps> = ({ 
  performances, 
  materialItems, 
  eventFrame, 
  getMaterialAvailability, 
  showInPdf = true, 
  onTogglePdf, 
  currentPerformanceId, 
  bufferedTechData, 
  onBalanceDataChange, 
  balanceConfig, 
  setBalanceConfig,
  readOnly = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Utilitzar directament els valors del store, no estats locals
  const sortByCategory = balanceConfig?.sortByCategory ?? false;
  const sortByLocation = balanceConfig?.sortByLocation ?? false;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  const usage = useMemo(() => {
    const counts: Record<string, { id: string; name: string; qty: number; location: string; category: string; section: string }> = {};
    
    performances.forEach(perf => {
      // Usar el buffer en temps real si és l'actuació que estem editant actualment
      const dataToUse = (perf.id === currentPerformanceId && bufferedTechData) 
        ? bufferedTechData 
        : perf.techData;

      // Processar inputs per separat: micròfons, peus i extres
      (dataToUse?.inputList || []).forEach((item: any) => {
        // Comptar micròfon
        if (item.micContraId) {
          if (!counts[item.micContraId]) {
            const m = materialItems.find(mi => mi.id === item.micContraId);
            counts[item.micContraId] = {
              id: item.micContraId,
              name: m?.name || item.micContra || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Inputs'
            };
          }
          counts[item.micContraId].qty += 1;
        }
        
        // Comptar peu (stand)
        if (item.standId) {
          if (!counts[item.standId]) {
            const m = materialItems.find(mi => mi.id === item.standId);
            counts[item.standId] = {
              id: item.standId,
              name: m?.name || item.stand || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Inputs'
            };
          }
          counts[item.standId].qty += 1;
        }

        // Comptar extres
        if (item.extresId) {
          if (!counts[item.extresId]) {
            const m = materialItems.find(mi => mi.id === item.extresId);
            counts[item.extresId] = {
              id: item.extresId,
              name: m?.name || item.extres || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Inputs'
            };
          }
          counts[item.extresId].qty += 1;
        }
      });
      
      // Processar monitors per separat: contra i peu
      (dataToUse?.monitorList || []).forEach((item: any) => {
        // Comptar contra de monitor
        if (item.mixContraId) {
          if (!counts[item.mixContraId]) {
            const m = materialItems.find(mi => mi.id === item.mixContraId);
            counts[item.mixContraId] = {
              id: item.mixContraId,
              name: m?.name || item.mixContra || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Monitors'
            };
          }
          counts[item.mixContraId].qty += item.monitorQty ?? 1;
        }
        
        // Comptar peu de monitor
        if (item.mixStandId) {
          if (!counts[item.mixStandId]) {
            const m = materialItems.find(mi => mi.id === item.mixStandId);
            counts[item.mixStandId] = {
              id: item.mixStandId,
              name: m?.name || item.mixStand || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Monitors'
            };
          }
          counts[item.mixStandId].qty += item.standQty ?? 1;
        }
      });
      
      (dataToUse?.cableList || []).forEach((item: any) => {
        if (item.itemId) {
          if (!counts[item.itemId]) {
            const m = materialItems.find(mi => mi.id === item.itemId);
            counts[item.itemId] = {
              id: item.itemId,
              name: m?.name || item.itemName || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Cablejat'
            };
          }
          counts[item.itemId].qty += item.qty ?? 1;
        }
      });
      (dataToUse?.spareList || []).forEach((item: any) => {
        if (item.itemId) {
          if (!counts[item.itemId]) {
            const m = materialItems.find(mi => mi.id === item.itemId);
            counts[item.itemId] = {
              id: item.itemId,
              name: m?.name || item.itemName || '',
              qty: 0,
              location: m?.location || '-',
              category: m?.category || '',
              section: 'Material Spare'
            };
          }
          counts[item.itemId].qty += item.qty ?? 1;
        }
      });
    });
    
    let result = Object.values(counts).map(u => {
      const globalAvail = getMaterialAvailability(u.id, new Date(eventFrame.startDate), new Date(eventFrame.endDate), eventFrame.id);
      return { ...u, available: globalAvail.available, total: globalAvail.total, isError: globalAvail.available < 0 };
    });

    // Aplicar ordenament: primer per secció, després per errors, després pels altres criteris
    result.sort((a, b) => {
      // Primer ordenar per secció (Inputs → Monitors → Cablejat → Material Spare)
      const sectionOrder = { 'Inputs': 0, 'Monitors': 1, 'Cablejat': 2, 'Material Spare': 3 };
      const sectionDiff = sectionOrder[a.section as keyof typeof sectionOrder] - sectionOrder[b.section as keyof typeof sectionOrder];
      if (sectionDiff !== 0) return sectionDiff;
      
      // Després ordenar per errors (sempre prioritari)
      const errorDiff = (b.isError ? 1 : 0) - (a.isError ? 1 : 0);
      if (errorDiff !== 0) return errorDiff;

      // Després aplicar els filtres d'ordenament
      if (sortByCategory && sortByLocation) {
        // Ambdós actius: primer per categoria, després per ubicació
        const categoryDiff = a.category.localeCompare(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return a.location.localeCompare(b.location);
      } else if (sortByCategory) {
        // Només categoria
        return a.category.localeCompare(b.category);
      } else if (sortByLocation) {
        // Només ubicació
        return a.location.localeCompare(b.location);
      } else {
        // Sense ordenament específic, per nom
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [performances, materialItems, getMaterialAvailability, eventFrame, sortByCategory, sortByLocation, currentPerformanceId, bufferedTechData]);

  // Passar les dades ordenades al component principal (WYSIWYG)
  const lastUsageRef = useRef<string>('');
  
  useEffect(() => {
    if (onBalanceDataChange) {
      const currentUsageStr = JSON.stringify(usage);
      if (currentUsageStr !== lastUsageRef.current) {
        lastUsageRef.current = currentUsageStr;
        onBalanceDataChange(usage);
      }
    }
  }, [usage, onBalanceDataChange]);

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
          {!readOnly && (
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <Tooltip text={t('rider_workshop.sort_by_category_tooltip')}>
                <button
                  onClick={() => {
                    const newValue = !balanceConfig?.sortByCategory;
                    setBalanceConfig?.({ sortByCategory: newValue });
                    autoSaveRiderPdfConfig();
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    balanceConfig?.sortByCategory 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  Categoria
                  <ChevronUp className={`w-2.5 h-2.5 transition-transform ${balanceConfig?.sortByCategory ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>
              <Tooltip text={t('rider_workshop.sort_by_location_tooltip')}>
                <button
                  onClick={() => {
                    const newValue = !balanceConfig?.sortByLocation;
                    setBalanceConfig?.({ sortByLocation: newValue });
                    autoSaveRiderPdfConfig();
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    balanceConfig?.sortByLocation 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  Ubicació
                  <ChevronUp className={`w-2.5 h-2.5 transition-transform ${balanceConfig?.sortByLocation ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>
            </div>
          )}
          {!readOnly && onTogglePdf && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Tooltip text={t('rider_workshop.show_in_pdf_tooltip')}>
                <input
                  type="checkbox"
                  checked={showInPdf}
                  onChange={onTogglePdf}
                  className="h-3 w-3 rounded border-border accent-primary focus:ring-primary"
                />
              </Tooltip>
              <label className="text-[8px] font-medium text-muted-foreground cursor-pointer">PDF</label>
            </div>
          )}
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
                <th className="py-1.5 px-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest text-right">Estoc (Disp/Total)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usage.map((u, index) => {
                const isFirstInSection = index === 0 || usage[index - 1].section !== u.section;
                return (
                  <React.Fragment key={u.id}>
                    {isFirstInSection && (
                      <tr className="bg-muted/30">
                        <td colSpan={4} className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                              {u.section}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr 
                      className={`transition-colors cursor-pointer hover:bg-muted/20 ${
                        u.isError ? 'bg-destructive/5' : ''
                      } ${
                        selectedItemId === u.id ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                      }`}
                      onClick={() => setSelectedItemId(u.id === selectedItemId ? null : u.id)}
                    >
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
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${u.isError ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary/10 text-primary'}`}>
                          {u.available} / {u.total}
                        </span>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default RiderBalance;