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
    <li className={liClasses}>
      <div
        className={`flex flex-col sm:flex-row justify-between sm:items-start gap-0.5 p-2 ${isMultiDay ? 'cursor-pointer' : ''}`}
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
          <p className="font-semibold text-sm">{personName || 'Persona Desconeguda'}</p>
          <p className="text-xs text-muted-foreground">{formatDateRangeDMY(assignment.startDate, assignment.endDate)}</p>
          <p className="text-xs font-bold">
            {getStatusSummaryText(assignment)}
          </p>
          {assignment.notes && <p className="text-xs mt-0.5 italic text-muted-foreground whitespace-pre-wrap">Nota: {assignment.notes}</p>}
        </div>
        <div className="flex flex-col space-y-0.5 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-0.5 self-start sm:self-center flex-shrink-0">
          <div className="flex items-center space-x-0.5">
            {isMultiDay && (
              <Tooltip text={isDailyViewExpanded ? "Ocultar vista diària" : "Mostrar vista diària"}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDailyView();
                  }}
                  className={`px-1.5 py-0.5 rounded-md text-xs font-medium transition-colors ${
                    isDailyViewExpanded ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  }`}
                >
                  {isDailyViewExpanded ? "Ocultar" : "Mostrar"}
                </button>
              </Tooltip>
            )}
            {[AssignmentStatus.Yes, AssignmentStatus.Pending, AssignmentStatus.No].map(status => (
              <Tooltip key={status} text={`Marcar tot com a '${status}'`}>
                <button
                  onClick={() => onGeneralStatusChange(eventFrame.id, assignment.id, status)}
                  className={`font-semibold px-1.5 py-0.5 text-xs rounded-md transition-opacity ${
                    assignment.status === status && assignment.status !== AssignmentStatus.Mixed
                      ? 'opacity-100 ring-1 ring-offset-1 ring-offset-card ring-ring/50'
                      : 'opacity-60 hover:opacity-100'
                  } ${statusButtonClasses[status]}`}
                >
                  {status}
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-0.5">
            <Tooltip text="Editar assignació">
              <button onClick={() => onEdit(eventFrame.id, assignment.id)} className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent">
                <EditIcon className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip text="Eliminar assignació">
              <button onClick={() => onDelete(eventFrame.id, assignment.id)} className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent">
                <TrashIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {isMultiDay && isDailyViewExpanded && (
        <div className="mt-1 pt-1 border-t border-border bg-muted/50 p-1 rounded-b-lg">
          <h6 className="text-xs font-semibold mb-0.5">Estat per dia:</h6>
          <div className="space-y-0.5">
            {getDaysInRange(assignment.startDate, assignment.endDate).map(date => {
              const currentDailyStatus = assignment.dailyStatuses?.[date] || (assignment.status !== AssignmentStatus.Mixed ? assignment.status : AssignmentStatus.Pending);
              
              const statusRowClasses: { [key in AssignmentStatus]?: string } = {
                [AssignmentStatus.Yes]: 'bg-success/60',      // Fons verd al 60%
                [AssignmentStatus.No]: 'bg-destructive/60',   // Fons vermell al 60%
                [AssignmentStatus.Pending]: 'bg-warning/60',   // Fons groc al 60%
              };
              const rowClass = statusRowClasses[currentDailyStatus] || 'bg-muted/50';

              return (
                <div key={date} className={`flex items-center justify-between p-0.5 rounded-md transition-colors duration-200 ${rowClass}`}>
                  <span className="text-xs font-medium">{formatDateDMY(date)}:</span>
                  <div className="flex space-x-0.5">
                    {[AssignmentStatus.Yes, AssignmentStatus.Pending, AssignmentStatus.No].map(s => (
                      <Tooltip key={s} text={`Marcar dia com a '${s}'`}>
                        <button
                          onClick={() => onDailyStatusChange(eventFrame.id, assignment, date, s)}
                          className={`status-pill ${currentDailyStatus === s ?
                              (s === AssignmentStatus.Yes ? 'status-pill-selected-yes' : s === AssignmentStatus.No ? 'status-pill-selected-no' : 'status-pill-selected-pending') :
                              'status-pill-unselected'}`}
                        >
                          {s}
                        </button>
                      </Tooltip>
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