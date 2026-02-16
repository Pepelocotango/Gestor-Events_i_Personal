import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, ShowToastFunction } from '../../types';
import PerformanceBasicForm from './PerformanceBasicForm';
import PerformanceTechForm from './PerformanceTechForm';
import PerformanceHospitalityForm from './PerformanceHospitalityForm';
import PerformanceAdvancing from './PerformanceAdvancing';
import Tooltip from '../ui/Tooltip';
import { 
  DocumentTextIconComponent, 
  AdjustmentsHorizontalIconComponent, 
  BriefcaseIconComponent,
  PdfIcon
} from '../../constants';
import { exportPerformanceToPdfWithOptions } from '../../utils/pdfGenerator';

interface PerformanceDetailContainerProps {
  eventFrameId: string;
  performance: Performance;
  eventFrame: any; // EventFrame data
  showToast: ShowToastFunction;
}

type ActiveTab = 'basic' | 'tech' | 'hospitality';

const PerformanceDetailContainer: React.FC<PerformanceDetailContainerProps> = ({
  eventFrameId,
  performance,
  eventFrame,
  showToast,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');

  // Opcions per defecte per exportar rider complet
  const defaultPdfOptions = {
    includeBasicInfo: true,
    includeInputs: true,
    includeTechnicalNotes: true,
    includeHospitality: true,
    includeGeneralNotes: true,
    showEmptySections: false,
  };

  const handleExportCompleteRider = () => {
    exportPerformanceToPdfWithOptions(performance, eventFrame, defaultPdfOptions, showToast);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <PerformanceBasicForm
            eventFrameId={eventFrameId}
            performance={performance}
            showToast={showToast}
          />
        );
      case 'tech':
        return (
          <PerformanceTechForm
            eventFrameId={eventFrameId}
            performance={performance}
            eventFrame={eventFrame}
            showToast={showToast}
          />
        );
      case 'hospitality':
        return (
          <PerformanceHospitalityForm
            eventFrameId={eventFrameId}
            performance={performance}
            eventFrame={eventFrame}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Advancement Control */}
      <PerformanceAdvancing
        eventFrameId={eventFrameId}
        performance={performance}
      />
      
      {/* Contenidor de Pestanyes */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {/* Capçalera amb botó d'exportació */}
        <div className="flex justify-between items-center border-b border-border px-6 py-3">
          <div className="text-sm font-medium text-muted-foreground">
            {t('performances.rider_details', { name: performance.name })}
          </div>
          <Tooltip text={t('performances.export_complete_rider_tooltip')}>
            <button
              onClick={handleExportCompleteRider}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring flex items-center gap-2"
            >
              <PdfIcon className="w-4 h-4" />
              {t('performances.export_complete_rider')}
            </button>
          </Tooltip>
        </div>
        
        {/* Barra de Pestanyes */}
        <div className="border-b border-border">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <Tooltip key={tab.id} text={tab.tooltip}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              </Tooltip>
            ))}
          </nav>
        </div>

        {/* Contingut de la Pestanya */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDetailContainer;
