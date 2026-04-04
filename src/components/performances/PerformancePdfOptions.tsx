import React from 'react';
import { useTranslation } from 'react-i18next';
import { PerformancePdfOptions } from '../../types';
import { PdfIcon } from '../../constants';

interface PerformancePdfOptionsProps {
  options: PerformancePdfOptions;
  onOptionsChange: (options: PerformancePdfOptions) => void;
  onExport: () => void;
  disabled?: boolean;
}

const PerformancePdfOptionsComponent: React.FC<PerformancePdfOptionsProps> = ({
  options,
  onOptionsChange,
  onExport,
  disabled = false
}) => {
  const { t } = useTranslation();

  const handleOptionChange = (key: keyof PerformancePdfOptions, value: boolean) => {
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  const defaultOptions: PerformancePdfOptions = {
    includeBasicInfo: true,
    includeInputs: true,
    includeTechnicalNotes: true,
    includeHospitality: true,
    includeGeneralNotes: true,
    includeMonitors: true,
    showEmptySections: false
  };

  const resetToDefaults = () => {
    onOptionsChange(defaultOptions);
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">{t('performances.pdf_options_title')}</h4>
        <button
          onClick={resetToDefaults}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('common.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeBasicInfo"
            checked={options.includeBasicInfo}
            onChange={(e) => handleOptionChange('includeBasicInfo', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeBasicInfo" className="text-sm font-medium">
            {t('performances.include_basic_info')}
          </label>
        </div>

        {/* Inputs */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeInputs"
            checked={options.includeInputs}
            onChange={(e) => handleOptionChange('includeInputs', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeInputs" className="text-sm font-medium">
            {t('performances.include_inputs')}
          </label>
        </div>

        {/* Technical Notes */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeTechnicalNotes"
            checked={options.includeTechnicalNotes}
            onChange={(e) => handleOptionChange('includeTechnicalNotes', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeTechnicalNotes" className="text-sm font-medium">
            {t('performances.include_technical_notes')}
          </label>
        </div>

        {/* Hospitality */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeHospitality"
            checked={options.includeHospitality}
            onChange={(e) => handleOptionChange('includeHospitality', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeHospitality" className="text-sm font-medium">
            {t('performances.include_hospitality')}
          </label>
        </div>

        {/* General Notes */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeGeneralNotes"
            checked={options.includeGeneralNotes}
            onChange={(e) => handleOptionChange('includeGeneralNotes', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeGeneralNotes" className="text-sm font-medium">
            {t('performances.include_general_notes')}
          </label>
        </div>

        {/* Monitors */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeMonitors"
            checked={options.includeMonitors}
            onChange={(e) => handleOptionChange('includeMonitors', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="includeMonitors" className="text-sm font-medium">
            {t('performances.include_monitors')}
          </label>
        </div>

        {/* Show Empty Sections */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showEmptySections"
            checked={options.showEmptySections}
            onChange={(e) => handleOptionChange('showEmptySections', e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="showEmptySections" className="text-sm font-medium">
            {t('performances.show_empty_sections')}
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={onExport}
          disabled={disabled}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PdfIcon className="w-4 h-4" />
          {t('performances.export_custom_pdf')}
        </button>
      </div>
    </div>
  );
};

export default PerformancePdfOptionsComponent;
