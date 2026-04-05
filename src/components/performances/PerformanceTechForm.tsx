import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Performance } from '../../types';
import { LayoutGridIcon } from '../../constants';
import { useEventDataStore } from '../../stores/eventDataStore';
import RiderBalance from './RiderBalance';

interface PerformanceTechFormProps {
  eventFrameId: string;
  performance: Performance;
}

const PerformanceTechForm: React.FC<PerformanceTechFormProps> = ({
  eventFrameId,
  performance,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { eventFrames, materialItems, getMaterialAvailability: getMaterialAvailabilityFromStore } = useEventDataStore();

  const eventFrame = eventFrames.find(ef => ef.id === eventFrameId);
  
  // Wrapper per adaptar la signatura de getMaterialAvailability
  const getMaterialAvailability = (materialId: string, startDate: Date, endDate: Date, eventFrameId: string) => {
    return getMaterialAvailabilityFromStore(
      materialId, 
      startDate.toISOString(), 
      endDate.toISOString(), 
      eventFrameId
    );
  };

  const techData = performance.techData || {
    inputList: [],
    monitorList: [],
    cableList: [],
    spareList: [],
    lightingNotes: '',
    videoNotes: '',
    stageRequirements: '',
  };

  const patchColorMap: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    brown: 'bg-amber-800',
    transparent: 'bg-transparent'
  };

  return (
    <div className="space-y-8">
      {/* Avís i Botó Rider */}
      <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-3">
          <LayoutGridIcon className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium text-primary">
            {t('performances.tech_read_only_msg', { defaultValue: "L'edició tècnica s'ha mogut al nou mòdul de Riders." })}
          </p>
        </div>
        <button
          onClick={() => navigate(`/riders/${eventFrameId}`)}
          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          {t('rider_workshop.title')}
        </button>
      </div>

      {/* LLISTA D'INPUTS (CH IN) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <LayoutGridIcon className="w-4 h-4" />
            {t('pdf.input_list')}
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {techData.inputList?.length || 0}
          </span>
        </div>
        
        {!techData.inputList || techData.inputList.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed border-border rounded-lg bg-muted/10">
            {t('performances.no_inputs')}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border w-16">{t('pdf.patch')}</th>
                  <th className="py-2 px-2 font-black text-muted-foreground uppercase tracking-wider border-b border-border text-center w-12">{t('pdf.channel')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.label')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.mic_rider')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.mic_contra')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.stand')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.notes')}</th>
                  <th className="py-2 px-2 font-black text-muted-foreground uppercase tracking-wider border-b border-border text-center w-10">Exc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {techData.inputList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 border-r border-border/50">
                      <div className="flex items-center gap-2">
                        {item.patchColor && item.patchColor !== 'transparent' && (
                          <div className={`w-2.5 h-2.5 rounded-full border border-border shadow-sm ${patchColorMap[item.patchColor] || 'bg-transparent'}`} />
                        )}
                        <span className="font-mono font-bold text-muted-foreground">{item.patchNumber || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-black text-primary border-r border-border/50">{item.channel || '-'}</td>
                    <td className="py-2 px-3 font-bold">{item.label || '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground italic">{item.micRider || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-primary/80">{item.micContra || '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{item.stand || '-'}</td>
                    <td className="py-2 px-3 text-[10px] text-muted-foreground leading-tight">{item.notes || '-'}</td>
                    <td className="py-2 px-2 text-center text-primary font-black">{item.exclusive ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* LLISTA DE MONITORS (CH OUT) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <LayoutGridIcon className="w-4 h-4" />
            {t('pdf.monitor_list')}
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {techData.monitorList?.length || 0}
          </span>
        </div>
        
        {!techData.monitorList || techData.monitorList.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed border-border rounded-lg bg-muted/10">
            {t('performances.no_monitors', { defaultValue: 'Sense monitors definits' })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border w-16">{t('pdf.patch')}</th>
                  <th className="py-2 px-2 font-black text-muted-foreground uppercase tracking-wider border-b border-border text-center w-12">{t('pdf.output_channel')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.label')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.monitor_rider')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.monitor_contra')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.monitor_stand')}</th>
                  <th className="py-2 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.notes')}</th>
                  <th className="py-2 px-2 font-black text-muted-foreground uppercase tracking-wider border-b border-border text-center w-10">Exc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {techData.monitorList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 border-r border-border/50">
                      <div className="flex items-center gap-2">
                        {item.patchColor && item.patchColor !== 'transparent' && (
                          <div className={`w-2.5 h-2.5 rounded-full border border-border shadow-sm ${patchColorMap[item.patchColor] || 'bg-transparent'}`} />
                        )}
                        <span className="font-mono font-bold text-muted-foreground">{item.patchNumber || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-black text-primary border-r border-border/50">{item.outputChannel || '-'}</td>
                    <td className="py-2 px-3 font-bold">{item.label || '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground italic">{item.mixRider || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-primary/80">
                      {item.mixContra || '-'} 
                      {item.monitorQty && item.monitorQty > 1 ? ` (x${item.monitorQty})` : ''}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {item.mixStand || '-'}
                      {item.standQty && item.standQty > 1 ? ` (x${item.standQty})` : ''}
                    </td>
                    <td className="py-2 px-3 text-[10px] text-muted-foreground leading-tight">{item.notes || '-'}</td>
                    <td className="py-2 px-2 text-center text-primary font-black">{item.exclusive ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CABLEJAT I SPARE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cablejat */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              {t('pdf.cable_list')}
            </h3>
          </div>
          {!techData.cableList || techData.cableList.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-muted-foreground italic border border-dashed border-border rounded-lg bg-muted/5">
              Sense cablejat definit
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border shadow-sm">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border w-12 text-center">{t('pdf.qty')}</th>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.material')}</th>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.notes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {techData.cableList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-1.5 px-3 text-center font-bold text-primary border-r border-border/50">{item.qty || 1}</td>
                      <td className="py-1.5 px-3 font-medium">{item.itemName || '-'}</td>
                      <td className="py-1.5 px-3 text-[10px] text-muted-foreground">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Material Spare */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              {t('pdf.spare_list')}
            </h3>
          </div>
          {!techData.spareList || techData.spareList.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-muted-foreground italic border border-dashed border-border rounded-lg bg-muted/5">
              Sense material spare
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border shadow-sm">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border w-12 text-center">{t('pdf.qty')}</th>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.material')}</th>
                    <th className="py-1.5 px-3 font-black text-muted-foreground uppercase tracking-wider border-b border-border">{t('pdf.notes')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {techData.spareList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-1.5 px-3 text-center font-bold text-primary border-r border-border/50">{item.qty || 1}</td>
                      <td className="py-1.5 px-3 font-medium">{item.itemName || '-'}</td>
                      <td className="py-1.5 px-3 text-[10px] text-muted-foreground">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* NOTES TÈCNIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
        {/* Notes de Llums */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {t('performances.lighting_notes')}
          </label>
          <div className="p-3 bg-muted/10 border border-border rounded-md text-xs min-h-[80px] whitespace-pre-wrap leading-relaxed">
            {techData.lightingNotes || <span className="text-muted-foreground italic opacity-50">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>

        {/* Video Notes */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {t('performances.video_notes')}
          </label>
          <div className="p-3 bg-muted/10 border border-border rounded-md text-xs min-h-[80px] whitespace-pre-wrap leading-relaxed">
            {techData.videoNotes || <span className="text-muted-foreground italic opacity-50">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>

        {/* Necessitats d'Escenari */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            {t('performances.stage_requirements')}
          </label>
          <div className="p-3 bg-muted/10 border border-border rounded-md text-xs min-h-[80px] whitespace-pre-wrap leading-relaxed">
            {techData.stageRequirements || <span className="text-muted-foreground italic opacity-50">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>
      </div>

      {/* BALANÇ CONSOLIDAT (READ ONLY) */}
      {eventFrame && (
        <section className="pt-6 border-t border-border/50">
          <RiderBalance
            performances={eventFrame.performances || []}
            materialItems={materialItems}
            eventFrame={eventFrame}
            getMaterialAvailability={getMaterialAvailability}
            readOnly={true}
          />
        </section>
      )}
    </div>
  );
};

export default PerformanceTechForm;
