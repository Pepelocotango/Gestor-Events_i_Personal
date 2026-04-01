import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Performance } from '../../types';
import { LayoutGridIcon } from '../../constants';

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

  const techData = performance.techData || {
    inputList: [],
    lightingNotes: '',
    videoNotes: '',
    stageRequirements: '',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-3 bg-primary/5 border border-primary/20 rounded-lg mb-6">
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

      {/* Input List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b border-border pb-2">{t('performances.input_list_title')}</h3>
        
        {techData.inputList.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic border border-dashed border-border rounded-lg">
            {t('performances.no_inputs')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.patch_header')}</th>
                  <th className="text-center py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.channel_header')}</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.label_header')}</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.mic_rider_header')}</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.mic_contra_header')}</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.stand_header')}</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">{t('performances.notes_header')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {techData.inputList.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="py-2 px-3 text-sm">
                       <div className="flex items-center gap-2">
                        {item.patchColor && item.patchColor !== 'transparent' && (
                          <div className={`w-3 h-3 rounded-full border border-border shadow-sm bg-${item.patchColor === 'yellow' ? 'yellow-400' : item.patchColor + '-500'}`} />
                        )}
                        <span>{item.patchNumber || '-'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm text-center font-mono font-bold">{item.channel || '-'}</td>
                    <td className="py-2 px-3 text-sm font-medium">{item.label}</td>
                    <td className="py-2 px-3 text-sm italic text-muted-foreground">{item.micRider || '-'}</td>
                    <td className="py-2 px-3 text-sm font-semibold">{item.micContra || '-'}</td>
                    <td className="py-2 px-3 text-sm">{item.stand || '-'}</td>
                    <td className="py-2 px-3 text-sm text-muted-foreground">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Notes de Llums */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t('performances.lighting_notes')}
          </label>
          <div className="p-3 bg-muted/30 border border-border rounded-md text-sm min-h-[100px] whitespace-pre-wrap">
            {techData.lightingNotes || <span className="text-muted-foreground italic">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>

        {/* Video Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t('performances.video_notes')}
          </label>
          <div className="p-3 bg-muted/30 border border-border rounded-md text-sm min-h-[100px] whitespace-pre-wrap">
            {techData.videoNotes || <span className="text-muted-foreground italic">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>

        {/* Necessitats d'Escenari */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {t('performances.stage_requirements')}
          </label>
          <div className="p-3 bg-muted/30 border border-border rounded-md text-sm min-h-[100px] whitespace-pre-wrap">
            {techData.stageRequirements || <span className="text-muted-foreground italic">-- {t('performances.no_technical_notes')} --</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTechForm;
