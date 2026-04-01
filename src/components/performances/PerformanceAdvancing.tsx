import React from 'react';
import { useTranslation } from 'react-i18next';
import { Performance, PerformanceAdvancing as PerformanceAdvancingType } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import Tooltip from '../ui/Tooltip';
import { 
  ArrowDownOnSquareIconComponent, 
  ArrowUpOnSquareIconComponent, 
  CheckBadgeIconComponent,
  ClockIconComponent
} from '../../constants';

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
      icon: <ArrowDownOnSquareIconComponent className="w-6 h-6" />,
    },
    {
      key: 'counterRiderSent' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.counter_rider_sent'),
      tooltip: t('performances.advancing.counter_rider_sent_tooltip'),
      icon: <ArrowUpOnSquareIconComponent className="w-6 h-6" />,
    },
    {
      key: 'schedulesConfirmed' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.schedules_confirmed'),
      tooltip: t('performances.advancing.schedules_confirmed_tooltip'),
      icon: <ClockIconComponent className="w-6 h-6" />,
    },
    {
      key: 'hospitalityClosed' as keyof PerformanceAdvancingType,
      label: t('performances.advancing.hospitality_closed'),
      tooltip: t('performances.advancing.hospitality_closed_tooltip'),
      icon: <CheckBadgeIconComponent className="w-6 h-6" />,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 mb-2 shadow-sm">
      {/* Header with Progress - Compacte */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('performances.advancing.title')}</h3>
          <span className={`text-xs font-bold ${getProgressTextColor()}`}>
            {Math.round(getCompletionPercentage())}%
          </span>
        </div>
        
        {/* Progress Bar - Més fina i a la dreta */}
        <div className="flex-grow max-w-[150px] ml-4">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Clicables - Més petits i horitzontals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {advancingItems.map((item) => (
          <Tooltip key={item.key} text={item.tooltip}>
            <button
              onClick={() => toggleAdvancingItem(item.key)}
              className={`
                flex items-center gap-2 p-1.5 rounded border transition-all duration-200
                ${advancing[item.key as keyof PerformanceAdvancingType]
                  ? 'border-success/50 bg-success/5 text-success hover:bg-success/10'
                  : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:border-muted-foreground/30'
                }
                focus:outline-none focus:ring-1 focus:ring-ring
              `}
            >
              <div className={advancing[item.key as keyof PerformanceAdvancingType] ? 'text-success' : 'opacity-40'}>
                {React.cloneElement(item.icon as React.ReactElement, { className: "w-4 h-4" })}
              </div>
              <span className="text-[10px] font-bold leading-tight text-left flex-grow">{item.label}</span>
              {advancing[item.key as keyof PerformanceAdvancingType] && (
                <span className="text-[10px] font-black mr-1">✓</span>
              )}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Estat de Completitud - Molt discret */}
      {getCompletionPercentage() === 100 && (
        <div className="mt-2 py-1 px-2 bg-success/10 border border-success/20 rounded flex items-center justify-center gap-2">
          <span className="text-[10px] text-success font-bold uppercase tracking-widest">
            {t('performances.advancing.all_complete')}
          </span>
        </div>
      )}
    </div>
  );
};

export default PerformanceAdvancing;
