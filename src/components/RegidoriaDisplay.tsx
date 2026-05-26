/**
 * =============================================================================
 * REGIDORIA DISPLAY
 * =============================================================================
 * DESCRIPCIÓ:
 * Component per a la gestió i exportació del Full de Ruta del Regidor.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i components.
 * - COMPONENT PRINCIPAL: RegidoriaDisplay amb llista d'esdeveniments.
 * - EXPORTACIÓ PDF: Funció per exportar el Full de Ruta del Regidor.
 * =============================================================================
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { generateRegidoriaPdfObject, exportRegidoriaSummaryPdf } from '../utils/pdfGenerator';
import { ShowToastFunction } from '../types';
import { Button } from './ui/Button';
import { formatDateDMY } from '../utils/dateFormat';
import { EyeIcon } from '../constants';
import Tooltip from './ui/Tooltip';

interface RegidoriaDisplayProps {
  showToast: ShowToastFunction;
}

const RegidoriaDisplay: React.FC<RegidoriaDisplayProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const { openModal } = useModalStore();

  const eventFramesWithPerformances = useMemo(() => {
    return eventFrames.map(frame => ({
      ...frame,
      performances: frame.performances || [],
      hasPerformances: (frame.performances && frame.performances.length > 0)
    })).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [eventFrames]);

  const handlePreviewRegidoria = (eventFrame: any) => {
    const framePerformances = eventFrame.performances || [];
    const techSheetData = eventFrame.techSheet;

    try {
      const doc = generateRegidoriaPdfObject(eventFrame, framePerformances, techSheetData);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';

      openModal('pdfPreview', {
        pdfUrl,
        titleOverride: t('main.regidoria.title'),
        onSave: () => handleExportRegidoria(eventFrame)
      });
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleExportRegidoria = async (eventFrame: any) => {
    const framePerformances = eventFrame.performances || [];
    const techSheetData = eventFrame.techSheet;

    await exportRegidoriaSummaryPdf(
      eventFrame,
      framePerformances,
      techSheetData,
      showToast
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('main.regidoria.title')}</h1>
        <p className="text-muted-foreground">{t('main.regidoria.description')}</p>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="grid grid-cols-1 gap-4">
          {eventFramesWithPerformances.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('main.regidoria.no_events')}
            </div>
          ) : (
            eventFramesWithPerformances.map((frame) => (
              <div
                key={frame.id}
                className="p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{frame.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{t('pdf.location')}: {frame.place || '-'}</span>
                      <span>{t('pdf.date')}: {formatDateDMY(frame.startDate)}</span>
                      <span>{t('main.regidoria.performances_count')}: {frame.performances.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip text={t('tech_sheets.form.tooltip_preview')}>
                      <button
                        onClick={() => handlePreviewRegidoria(frame)}
                        disabled={!frame.hasPerformances}
                        className="preview-pdf-button px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-bold text-xs no-print flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span>{t('tech_sheets.form.preview')}</span>
                      </button>
                    </Tooltip>
                    <Tooltip text={t('tech_sheets.form.tooltip_export')}>
                      <Button
                        onClick={() => handleExportRegidoria(frame)}
                        disabled={!frame.hasPerformances}
                        className="export-pdf-button px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-bold text-xs no-print flex items-center gap-2 transition-colors"
                      >
                        <span>{t('main.regidoria.export_pdf')}</span>
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RegidoriaDisplay;
