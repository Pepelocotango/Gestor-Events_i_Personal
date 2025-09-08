import React, { useRef } from 'react';
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
  const { getPersonGroupById } = useEventDataStore.getState();
  const person = getPersonGroupById(assignment.personGroupId);
  const isMultiDay = assignment.startDate !== assignment.endDate;
  const skipNextCollapse = useRef(false);

  const statusCardClasses: { [key in AssignmentStatus]: string } = {
    [AssignmentStatus.Yes]: 'assignment-card-yes',
    [AssignmentStatus.Pending]: 'assignment-card-pending',
    [AssignmentStatus.No]: 'assignment-card-no',
    [AssignmentStatus.Mixed]: 'assignment-card-mixed',
  };
  const cardClass = `assignment-card ${statusCardClasses[assignment.status] || ''}`;

  const toggleDailyView = () => {
    // CANVI CLAU: Ara sempre passem l'ID. El pare s'encarrega de la lògica de toggle.
    onToggleDailyView(assignment.id);
  };

  return (
    <li className={cardClass}>
      <div
        className={`flex flex-col sm:flex-row justify-between sm:items-start gap-0.5 ${isMultiDay ? 'cursor-pointer' : ''}`}
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
          <p className="font-semibold text-sm">{person?.name || 'Persona Desconeguda'}</p>
          <p className="text-xs opacity-80">{formatDateRangeDMY(assignment.startDate, assignment.endDate)}</p>
          <p className="text-xs font-bold opacity-90">
            {getStatusSummaryText(assignment)}
          </p>
          {assignment.notes && <p className="text-xs mt-0.5 italic opacity-70 whitespace-pre-wrap">Nota: {assignment.notes}</p>}
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
                    isDailyViewExpanded ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
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
                      ? 'opacity-100 ring-1 ring-offset-1 dark:ring-offset-gray-900 ring-black/50'
                      : 'opacity-60 hover:opacity-100'
                  } ${status === AssignmentStatus.Yes ? 'bg-green-500 text-white' : status === AssignmentStatus.Pending ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  {status}
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-0.5">
            <Tooltip text="Editar assignació">
              <button onClick={() => onEdit(eventFrame.id, assignment.id)} className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <EditIcon className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip text="Eliminar assignació">
              <button onClick={() => onDelete(eventFrame.id, assignment.id)} className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <TrashIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {isMultiDay && isDailyViewExpanded && (
        <div className="daily-details-section p-1">
          <h6 className="text-xs font-semibold mb-0.5">Estat per dia:</h6>
          <div className="space-y-0.5">
            {getDaysInRange(assignment.startDate, assignment.endDate).map(date => {
              const currentDailyStatus = assignment.dailyStatuses?.[date] || (assignment.status !== AssignmentStatus.Mixed ? assignment.status : AssignmentStatus.Pending);
              
              const statusRowClasses: { [key: string]: string } = {
                  [AssignmentStatus.Yes]: 'daily-row-yes',
                  [AssignmentStatus.No]: 'daily-row-no',
                  [AssignmentStatus.Pending]: 'daily-row-pending',
              };
              const rowClass = statusRowClasses[currentDailyStatus] || 'daily-row-mixed';

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