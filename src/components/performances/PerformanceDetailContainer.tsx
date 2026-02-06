import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Performance } from '../../types';
import PerformanceBasicForm from './PerformanceBasicForm';
import PerformanceTechForm from './PerformanceTechForm';
import PerformanceHospitalityForm from './PerformanceHospitalityForm';
import PerformanceAdvancing from './PerformanceAdvancing';
import { 
  DocumentTextIconComponent, 
  AdjustmentsHorizontalIconComponent, 
  BriefcaseIconComponent 
} from '../../constants';

interface PerformanceDetailContainerProps {
  eventFrameId: string;
  performance: Performance;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type ActiveTab = 'basic' | 'tech' | 'hospitality';

const PerformanceDetailContainer: React.FC<PerformanceDetailContainerProps> = ({
  eventFrameId,
  performance,
  showToast,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');

  const tabs = [
    { id: 'basic' as ActiveTab, label: t('performances.tab_basic'), icon: <DocumentTextIconComponent className="w-4 h-4" /> },
    { id: 'tech' as ActiveTab, label: t('performances.tab_tech'), icon: <AdjustmentsHorizontalIconComponent className="w-4 h-4" /> },
    { id: 'hospitality' as ActiveTab, label: t('performances.tab_hospitality'), icon: <BriefcaseIconComponent className="w-4 h-4" /> },
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
          />
        );
      case 'hospitality':
        return (
          <PerformanceHospitalityForm
            eventFrameId={eventFrameId}
            performance={performance}
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
        {/* Barra de Pestanyes */}
        <div className="border-b border-border">
          <nav className="flex space-x-1 p-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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
