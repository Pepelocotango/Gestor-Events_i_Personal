import React from 'react';
import logger from '../../utils/logger';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { EventFrame, AssignmentStatus, ShowToastFunction, Assignment } from '../../types';
import { formatDateDMY, formatDateRangeDMY } from '../../utils/dateFormat';
import { formatDateRanges } from '../../utils/dateRangeFormatter'; // Importem això per formatar els rangs de dies
import Tooltip from '../ui/Tooltip';

interface CommonFormProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

interface EventFrameDetailsModalProps extends CommonFormProps {
  eventFrame: EventFrame;
}

export const EventFrameDetailsModal: React.FC<EventFrameDetailsModalProps> = ({ onClose, eventFrame }) => {
  const { peopleGroups } = useEventDataStore.getState();
  const { openModal } = useModalStore.getState();

  const handleDeleteClick = () => {
    openModal('confirmDeleteEventFrame', {
      itemType: "Marc d'Esdeveniment",
      itemName: eventFrame.name,
      itemId: eventFrame.id,
    });
  };

  // Funció auxiliar per obtenir el color segons l'estat
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case AssignmentStatus.Yes: return 'text-success';
      case AssignmentStatus.No: return 'text-destructive';
      case AssignmentStatus.Pending: return 'text-warning';
      case AssignmentStatus.Mixed: return 'text-primary'; // Blau per a Mixt
      default: return 'text-muted-foreground';
    }
  };

  // Funció per agrupar les dates per estat (per al cas Mixt)
  const getGroupedDatesByStatus = (assignment: Assignment) => {
    if (!assignment.dailyStatuses) return {};
    const grouped: Record<string, string[]> = {};
    
    Object.entries(assignment.dailyStatuses).forEach(([date, status]) => {
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(date);
    });
    return grouped;
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xl font-bold text-foreground">{eventFrame.name}</h4>
        {eventFrame.place && <p className="text-sm text-muted-foreground">{eventFrame.place}</p>}
        <p className="text-sm text-muted-foreground">
          {eventFrame.startDate === eventFrame.endDate
            ? formatDateDMY(eventFrame.startDate)
            : formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)}
        </p>
      </div>
      {eventFrame.generalNotes && (
        <div>
          <h5 className="font-semibold text-foreground">Notes Generals:</h5>
          <p className="text-sm text-foreground whitespace-pre-wrap p-2 bg-muted rounded">{eventFrame.generalNotes}</p>
        </div>
      )}

      <div>
        <h5 className="font-semibold text-foreground">Assignacions ({eventFrame.assignments.length}):</h5>
        {eventFrame.assignments.length > 0 ? (
          <ul className="space-y-2 pl-1 text-sm max-h-60 overflow-y-auto">
            {[...eventFrame.assignments]
              .sort((a, b) => (peopleGroups.find(p => p.id === a.personGroupId)?.name || '').localeCompare(peopleGroups.find(p => p.id === b.personGroupId)?.name || ''))
              .map(assign => {
                const person = peopleGroups.find(p => p.id === assign.personGroupId);
                const personName = person?.name || 'N/A';
                const dateRange = assign.startDate === assign.endDate 
                  ? formatDateDMY(assign.startDate) 
                  : formatDateRangeDMY(assign.startDate, assign.endDate);

                // Lògica de renderitzat segons si és Mixt o no
                if (assign.status === AssignmentStatus.Mixed && assign.dailyStatuses) {
                  const groupedDates = getGroupedDatesByStatus(assign);
                  // Definim l'ordre de visualització: Sí, No, Pendent
                  const statusOrder = [AssignmentStatus.Yes, AssignmentStatus.No, AssignmentStatus.Pending];

                  return (
                    <li key={assign.id} className="text-muted-foreground border-b border-border/50 pb-2 last:border-0">
                      <div className="font-medium text-foreground">
                        {personName}
                        {assign.role && <span className="italic text-muted-foreground font-normal"> - {assign.role}</span>}: <span className="text-xs font-normal text-muted-foreground">{dateRange}</span> <span className={`${getStatusColorClass(AssignmentStatus.Mixed)} font-bold`}>Mixt:</span>
                      </div>
                      <ul className="pl-4 mt-1 space-y-0.5">
                        {statusOrder.map(status => {
                          const dates = groupedDates[status];
                          if (dates && dates.length > 0) {
                            return (
                              <li key={status} className="text-xs">
                                <span className="text-muted-foreground">[{formatDateRanges(dates)}]</span> <span className={`${getStatusColorClass(status)} font-bold uppercase`}>{status}</span>
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                      {assign.notes && <div className="text-xs italic pl-4 text-muted-foreground mt-1">Nota: {assign.notes}</div>}
                    </li>
                  );
                } else {
                  // Cas estàndard (Sí, No, Pendent)
                  return (
                    <li key={assign.id} className="text-muted-foreground py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium text-foreground">{personName}{assign.role && <span className="italic text-muted-foreground font-normal"> - {assign.role}</span>}</span>: <span className="text-xs text-muted-foreground">{dateRange}</span> <span className={`${getStatusColorClass(assign.status)} font-bold`}>{assign.status}</span>
                      {assign.notes && <div className="text-xs italic pl-4 text-muted-foreground mt-0.5">Nota: {assign.notes}</div>}
                    </li>
                  );
                }
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No hi ha assignacions per aquest esdeveniment.</p>
        )}
      </div>
      
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
        <Tooltip text="Ressaltar aquest marc a la llista principal">
          <button
            onClick={() => {
              logger.info(`[EventFrameDetailsModal] "Mostrar a la Llista" clicked for EventFrame ID: ${eventFrame.id}. Calling showAndHighlightEvent...`);
              useEventDataStore.getState().showAndHighlightEvent(eventFrame.id);
            }}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50"
          >
            Mostrar a la Llista
          </button>
        </Tooltip>
        <div className="space-x-2">
          <Tooltip text="Obrir el formulari per editar els detalls d'aquest marc">
            <button
                onClick={() => openModal('editEventFrame', { eventFrameToEdit: eventFrame })}
              className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50"
            >
              Editar Marc
            </button>
          </Tooltip>
          <Tooltip text="Eliminar aquest marc d'esdeveniment i totes les seves assignacions">
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50"
            >
              Eliminar Marc
            </button>
          </Tooltip>
          <Tooltip text="Tancar aquesta finestra de detalls">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50"
            >
              Tancar
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default EventFrameDetailsModal;