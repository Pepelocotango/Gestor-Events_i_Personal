import React from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from './ui/CollapsibleSection';

interface PerformancesDisplayProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const PerformancesDisplay: React.FC<PerformancesDisplayProps> = ({ showToast: _showToast }) => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <CollapsibleSection 
        title={t('performances.manager_title')}
        defaultOpen={true}
      >
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">{t('performances.no_event_selected')}</p>
          <p className="text-sm mt-2">En construcció</p>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default PerformancesDisplay;
