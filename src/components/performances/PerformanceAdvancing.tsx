import React from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, PerformanceAdvancing as PerformanceAdvancingType } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';

interface PerformanceAdvancingProps {
  eventFrameId: string;
  performance: Performance;
}

const PerformanceAdvancing: React.FC<PerformanceAdvancingProps> = ({
  eventFrameId,
  performance,
}) => {
  const { t } = useTranslation();
  const { updatePerformance } = useEventDataStore();

  const getInitialAdvancing = (): PerformanceAdvancingType => {
    return performance.advancing || {
      riderReceived: false,
      counterRiderSent: false,
      schedulesConfirmed: false,
      hospitalityClosed: false,
    };
  };

  const advancing = getInitialAdvancing();

  const toggleAdvancingItem = (field: keyof PerformanceAdvancingType) => {
    const updatedAdvancing: PerformanceAdvancingType = {
      ...advancing,
      [field]: !advancing[field],
    };

    updatePerformance(eventFrameId, {
      ...performance,
      advancing: updatedAdvancing,
    });
  };

  const getCompletionPercentage = (): number => {
    const items = Object.values(advancing);
    const completed = items.filter(Boolean).length;
    return (completed / items.length) * 100;
  };

  const getProgressColor = (): string => {
    const percentage = getCompletionPercentage();
    if (percentage === 100) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-muted';
  };

  const getProgressTextColor = (): string => {
    const percentage = getCompletionPercentage();
    if (percentage === 100) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-muted-foreground';
  };

  const advancingItems = [
    {
      key: 'riderReceived' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.rider_received'),
      tooltip: t('performances.advancing.rider_received_tooltip'),
      icon: '📄',
    },
    {
      key: 'counterRiderSent' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.counter_rider_sent'),
      tooltip: t('performances.advancing.counter_rider_sent_tooltip'),
      icon: '📤',
    },
    {
      key: 'schedulesConfirmed' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.schedules_confirmed'),
      tooltip: t('performances.advancing.schedules_confirmed_tooltip'),
      icon: '⏰',
    },
    {
      key: 'hospitalityClosed' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.hospitality_closed'),
      tooltip: t('performances.advancing.hospitality_closed_tooltip'),
      icon: '🏨',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{t('performances.advancing.title')}</h3>
          <span className={`text-sm font-medium ${getProgressTextColor()}`}>
            {Math.round(getCompletionPercentage())}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Clicables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {advancingItems.map((item) => (
          <Tooltip key={item.key} text={item.tooltip}>
            <button
              onClick={() => toggleAdvancingItem(item.key)}
              className={`
                flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                ${advancing[item.key as keyof PerformanceAdvancingType]
                  ? 'border-success bg-success/10 text-success hover:bg-success/20'
                  : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground'
                }
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              `}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium text-center">{item.label}</span>
              {advancing[item.key as keyof PerformanceAdvancingType] && (
                <span className="text-xs mt-1">✓</span>
              )}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Estat de Completitud */}
      {getCompletionPercentage() === 100 && (
        <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-sm text-success font-medium text-center">
            {t('performances.advancing.all_complete')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceAdvancing;
