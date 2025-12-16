import React, { useRef, useMemo } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { EventFrame, Assignment, AssignmentStatus } from '../types';
import { EditIcon, TrashIcon } from '../constants';
import { formatDateDMY, formatDateRangeDMY } from '../utils/dateFormat';
import { getStatusSummaryText } from '../utils/statusUtils';
import Tooltip from './ui/Tooltip';

const getDaysInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  currentDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

interface AssignmentCardProps {
  assignment: Assignment;
  eventFrame: EventFrame;
  isDailyViewExpanded: boolean;
  onToggleDailyView: (assignmentId: string) => void;
  onGeneralStatusChange: (eventFrameId: string, assignmentId: string, newStatus: AssignmentStatus) => void;
  onDailyStatusChange: (eventFrameId: string, assignment: Assignment, date: string, newStatus: AssignmentStatus) => void;
  onEdit: (eventFrameId: string, assignmentId: string) => void;
  onDelete: (eventFrameId: string, assignmentId: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  eventFrame,
  isDailyViewExpanded,
  onToggleDailyView,
  onGeneralStatusChange,
  onDailyStatusChange,
  onEdit,
  onDelete,
}) => {
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);
  const personName = peopleMap.get(assignment.personGroupId);
  if (!personName) {
    console.error(`PersonGroup not found for ID: ${assignment.personGroupId}`);
  }

  // Ensure assignment and eventFrame are valid
  if (!assignment || !eventFrame) {
    console.error('Invalid assignment or eventFrame passed to AssignmentCard:', { assignment, eventFrame });
    return null;
  }

  const isMultiDay = assignment.startDate !== assignment.endDate;
  const skipNextCollapse = useRef(false);

  const statusBorderClasses: { [key in AssignmentStatus]: string } = {
    [AssignmentStatus.Yes]: 'border-l-success',
    [AssignmentStatus.Pending]: 'border-l-warning',
    [AssignmentStatus.No]: 'border-l-destructive',
    [AssignmentStatus.Mixed]: 'border-l-primary',
  };
  const borderClass = statusBorderClasses[assignment.status] || 'border-l-transparent';

  const statusButtonClasses: { [key in AssignmentStatus]?: string } = {
    [AssignmentStatus.Yes]: 'bg-success text-success-foreground',
    [AssignmentStatus.Pending]: 'bg-warning text-warning-foreground',
    [AssignmentStatus.No]: 'bg-destructive text-destructive-foreground',
  };

  const toggleDailyView = () => {
    onToggleDailyView(assignment.id);
  };

  const liClasses = useMemo(() => {
    const base = 'rounded-lg';
    // La vora per 'Mixt' utilitzarà el color 'primary' per defecte
    const borderClassForMixed = 'border-l-primary'; 
    const borderClasses = `border-l-4 ${borderClass}`;

    switch (assignment.status) {
      case AssignmentStatus.Yes:
        return `${base} bg-success/15 ${borderClasses}`;
      case AssignmentStatus.Pending:
        return `${base} bg-warning/15 ${borderClasses}`;
      case AssignmentStatus.No:
        return `${base} bg-destructive/15 ${borderClasses}`;
      case AssignmentStatus.Mixed:
        // Només apliquem la classe del degradat. La transparència la definirem al CSS.
        // Afegim la vora per consistència visual.
        return `${base} bg-gradient-mixed border-l-4 ${borderClassForMixed}`; 
      default:
        return `${base} bg-card ${borderClasses}`;
    }
}, [assignment.status, borderClass]);

  return (
    <li className={`${liClasses} mb-3`}>
      <div
        className={`flex flex-col sm:flex-row justify-between sm:items-start gap-3 p-4 ${isMultiDay ? 'cursor-pointer' : ''}`}
        onClick={(e) => {
          if (!isMultiDay) return;
          if ((e.target as HTMLElement).closest('button, input, select, a')) {
            skipNextCollapse.current = true;
            return;
          }
          if (!skipNextCollapse.current) {
            toggleDailyView();
          }
          skipNextCollapse.current = false;
        }}
      >
        <div className="flex-grow">
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-foreground">
              {personName || 'Persona Desconeguda'}
              {assignment.role && (
                <span className="ml-2 text-base font-medium italic text-muted-foreground">
                  - {assignment.role}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base text-muted-foreground">
                {formatDateRangeDMY(assignment.startDate, assignment.endDate)}
              </p>
              <span className="text-base font-semibold text-foreground/90">
                {getStatusSummaryText(assignment)}
              </span>
            </div>
            {assignment.notes && (
              <p className="text-sm mt-1.5 text-muted-foreground/90 italic bg-muted/30 p-2 rounded-md">
                {assignment.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:items-center sm:flex-row sm:gap-3 self-start sm:self-center flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {isMultiDay && (
              <Tooltip text={isDailyViewExpanded ? "Ocultar vista diària" : "Mostrar vista diària"}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDailyView();
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isDailyViewExpanded 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-secondary text-secondary-foreground hover:bg-accent/50 hover:shadow-sm'
                  }`}
                >
                  {isDailyViewExpanded ? "Ocultar" : "Mostrar dies"}
                </button>
              </Tooltip>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {[AssignmentStatus.Yes, AssignmentStatus.Pending, AssignmentStatus.No].map(status => (
                <Tooltip key={status} text={`Marcar tot com a '${status}'`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGeneralStatusChange(eventFrame.id, assignment.id, status);
                    }}
                    className={`font-semibold px-4 py-2 text-sm rounded-md transition-all ${
                      assignment.status === status && assignment.status !== AssignmentStatus.Mixed
                        ? 'opacity-100 ring-2 ring-offset-1 ring-offset-card ring-ring/50 scale-105 shadow-md'
                        : 'opacity-90 hover:opacity-100 hover:scale-105 hover:shadow-sm'
                    } ${statusButtonClasses[status]}`}
                  >
                    {status}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 sm:mt-0">
            <Tooltip text="Editar assignació">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(eventFrame.id, assignment.id);
                }} 
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Editar assignació"
              >
                <EditIcon className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip text="Eliminar assignació">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(eventFrame.id, assignment.id);
                }} 
                className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-accent/50 transition-colors"
                aria-label="Eliminar assignació"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {isMultiDay && isDailyViewExpanded && (
        <div className="mt-3 pt-3 border-t-2 border-border/50 bg-muted/20 p-4 rounded-b-lg">
          <h6 className="text-base font-semibold mb-3 text-foreground/90">Estat per dia:</h6>
          <div className="space-y-2.5">
            {getDaysInRange(assignment.startDate, assignment.endDate).map(date => {
              const currentDailyStatus = assignment.dailyStatuses?.[date] || (assignment.status !== AssignmentStatus.Mixed ? assignment.status : AssignmentStatus.Pending);
              
              const statusRowClasses: { [key in AssignmentStatus]?: string } = {
                [AssignmentStatus.Yes]: 'bg-success/20',
                [AssignmentStatus.Pending]: 'bg-warning/20',
                [AssignmentStatus.No]: 'bg-destructive/20',
              };

              return (
                <div 
                  key={date} 
                  className={`
                    flex items-center justify-between p-3 rounded-lg 
                    ${statusRowClasses[currentDailyStatus] || 'bg-muted/30'}
                    transition-all hover:shadow-sm
                  `}
                >
                  <span className="text-sm font-medium text-foreground/90">
                    {formatDateDMY(date)}
                  </span>
                  <div className="flex items-center gap-2">
                    {[AssignmentStatus.Yes, AssignmentStatus.Pending, AssignmentStatus.No].map(status => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDailyStatusChange(eventFrame.id, assignment, date, status);
                        }}
                        className={`
                          px-3 py-1.5 text-sm rounded-md transition-all
                          ${
                            currentDailyStatus === status
                              ? 'font-semibold text-foreground bg-background/90 shadow-md scale-105'
                              : 'opacity-90 hover:opacity-100 bg-background/70 hover:bg-background/90 hover:scale-105 hover:shadow-sm'
                          }
                          ${statusButtonClasses[status]}
                        `}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
};

export default AssignmentCard;