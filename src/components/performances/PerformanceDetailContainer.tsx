import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, ShowToastFunction, PerformancePdfOptions } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import PerformanceBasicForm from './PerformanceBasicForm';
import PerformanceTechForm from './PerformanceTechForm';
import PerformanceHospitalityForm from './PerformanceHospitalityForm';
import PerformanceAdvancing from './PerformanceAdvancing';
import PerformancePdfOptionsModal from './PerformancePdfOptions';
import CollapsibleSection from '../ui/CollapsibleSection';
import Tooltip from '../ui/Tooltip';
import { triggerAllSaves } from '../../utils/saveManager';
import { generatePerformancePdfObjectWithOptions, exportPerformanceToPdfWithOptions, validatePerformanceData } from '../../utils/pdfGenerator';
import { 
  DocumentTextIconComponent, 
  AdjustmentsHorizontalIconComponent, 
  BriefcaseIconComponent,
  EyeIcon,
  PdfIcon
} from '../../constants';

interface PerformanceDetailContainerProps {
  eventFrameId: string;
  performance: Performance;
  showToast: ShowToastFunction;
}

type ActiveTab = 'basic' | 'tech' | 'hospitality';

const PerformanceDetailContainer: React.FC<PerformanceDetailContainerProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const { openModal } = useModalStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');

  // Estat global per a les opcions del PDF de l'actuació
  const [pdfOptions, setPdfOptions] = useState<PerformancePdfOptions>({
    includeBasicInfo: true,
    includeInputs: true,
    includeTechnicalNotes: true,
    includeHospitality: true,
    includeGeneralNotes: true,
    showEmptySections: false,
  });

  // Handler per canviar de pestanya amb auto-save
  const handleTabChange = (newTab: ActiveTab) => {
    // Força guardar abans de canviar de pestanya per evitar pèrdua de dades
    triggerAllSaves();
    setActiveTab(newTab);
  };

  const tabs = [
    { 
      id: 'basic' as ActiveTab, 
      label: t('performances.tab_basic'), 
      icon: <DocumentTextIconComponent className="w-4 h-4" />,
      tooltip: t('performances.tab_basic_tooltip')
    },
    { 
      id: 'tech' as ActiveTab, 
      label: t('performances.tab_tech'), 
      icon: <AdjustmentsHorizontalIconComponent className="w-4 h-4" />,
      tooltip: t('performances.tab_tech_tooltip')
    },
    { 
      id: 'hospitality' as ActiveTab, 
      label: t('performances.tab_hospitality'), 
      icon: <BriefcaseIconComponent className="w-4 h-4" />,
      tooltip: t('performances.tab_hospitality_tooltip')
    },
  ];

  // --- LÒGICA UNIFICADA DE PDF (Igual que Fitxes de Bolo) ---
  const handlePreviewRider = () => {
    triggerAllSaves(); // Força el desat dels buffers (WYSIWYG)
    
    // Obtenim les dades més recents de l'store
    const latestEventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === eventFrameId);
    const latestPerformance = latestEventFrame?.performances?.find(p => p.id === performance.id);
    
    if (!latestPerformance || !latestEventFrame) return;

    // Validació prèvia
    const validation = validatePerformanceData(latestPerformance);
    if (!validation.isValid) {
      validation.errors.forEach(error => showToast(error, 'error'));
      return;
    }
    validation.warnings.forEach(warning => showToast(warning, 'info'));

    try {
      const doc = generatePerformancePdfObjectWithOptions(latestPerformance, latestEventFrame, pdfOptions);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
      
      openModal('pdfPreview', {
        pdfUrl,
        titleOverride: t('modals.pdf_preview.title_override', { name: latestPerformance.name }),
        onSave: () => handleExportRider()
      });
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  };

  const handleExportRider = () => {
    triggerAllSaves(); // Força el desat dels buffers
    
    const latestEventFrame = useEventDataStore.getState().eventFrames.find(ef => ef.id === eventFrameId);
    const latestPerformance = latestEventFrame?.performances?.find(p => p.id === performance.id);
    
    if (!latestPerformance || !latestEventFrame) return;

    exportPerformanceToPdfWithOptions(latestPerformance, latestEventFrame, pdfOptions, showToast);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <PerformanceBasicForm eventFrameId={eventFrameId} performance={performance} showToast={showToast} />;
      case 'tech':
        return <PerformanceTechForm eventFrameId={eventFrameId} performance={performance} />;
      case 'hospitality':
        return <PerformanceHospitalityForm eventFrameId={eventFrameId} performance={performance} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Capçalera amb títol i botons d'exportació globals - Compacta */}
      <div className="flex justify-between items-center bg-card px-4 py-2.5 rounded-lg border border-border shadow-sm">
        <h2 className="text-lg font-bold text-foreground truncate max-w-[60%]">
          {performance.name || t('performances.unnamed')}
        </h2>
        <div className="flex items-center gap-2">
          <Tooltip text={t('tech_sheets.form.tooltip_preview')}>
            <button onClick={handlePreviewRider} className="preview-pdf-button px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-bold text-xs no-print flex items-center gap-2 transition-colors">
              <EyeIcon className="h-3.5 w-3.5" />
              <span>{t('tech_sheets.form.preview')}</span>
            </button>
          </Tooltip>
          <Tooltip text={t('tech_sheets.form.tooltip_export')}>
            <button onClick={handleExportRider} className="export-pdf-button px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-bold text-xs no-print flex items-center gap-2 transition-colors">
              <PdfIcon className="h-3.5 w-3.5" />
              <span>{t('tech_sheets.form.export_pdf')}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Secció Plegable d'Opcions PDF - Compacta */}
      <CollapsibleSection 
        title={t('performances.pdf_options_title')} 
        defaultOpen={false}
        headerClassName="py-1.5 text-xs font-bold uppercase tracking-widest bg-muted/30"
      >
        <div className="p-3 bg-card border-x border-b border-border rounded-b-lg">
          <PerformancePdfOptionsModal
            options={pdfOptions}
            onOptionsChange={setPdfOptions}
            onExport={handleExportRider}
            disabled={!performance.name}
          />
        </div>
      </CollapsibleSection>

      {/* Advancement Control */}
      <PerformanceAdvancing eventFrameId={eventFrameId} performance={performance} />
      
      {/* Contenidor de Pestanyes - Compacte */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col flex-grow">
        <div className="border-b border-border bg-muted/10">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <Tooltip key={tab.id} text={tab.tooltip}>
                <button
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                    focus:outline-none focus:ring-1 focus:ring-ring
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, { className: "w-3.5 h-3.5" })}
                  <span>{tab.label}</span>
                </button>
              </Tooltip>
            ))}
          </nav>
        </div>

        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetailContainer;
