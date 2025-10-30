import { forwardRef, useMemo } from 'react';
import { logger, useModalStore, useEventDataStore, EventFrame, Assignment, AssignmentStatus, formatDateRangeDMY } from '@gep/core';
import { PersonAddIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, GoogleIcon, RestoreIcon } from '../constants';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import AssignmentCard from './AssignmentCard';
import Tooltip from './ui/Tooltip';

interface EventFrameCardProps {
  eventFrame: EventFrame;
  isExpanded: boolean;
  expandedDailyViewAssignmentIds: Set<string>;
  filters: { person: string; status: AssignmentStatus | ''; };
  onToggleExpand: (id: string) => void;
  onToggleDailyView: (id: string) => void;
  onUpdateEventFrame: (eventFrame: EventFrame) => void;
  onGeneralStatusChange: (eventFrameId: string, assignmentId: string, newStatus: AssignmentStatus) => void;
  onDailyStatusChange: (eventFrameId: string, assignment: Assignment, date: string, newStatus: AssignmentStatus) => void;
  onEditAssignment: (eventFrameId: string, assignmentId: string) => void;
  onDeleteAssignment: (eventFrameId: string, assignmentId: string) => void;
  setToastMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  isArchived?: boolean;
}

const EventFrameCard = forwardRef<HTMLDivElement, EventFrameCardProps>(({
  eventFrame, isExpanded, expandedDailyViewAssignmentIds, filters, onToggleExpand,
  onToggleDailyView, onUpdateEventFrame, onGeneralStatusChange,
  onDailyStatusChange, onEditAssignment, onDeleteAssignment, setToastMessage,
  isArchived = false,
}, ref) => {
  logger.info(`[EventFrameCard] Render for ${eventFrame.name}. isExpanded: ${isExpanded}`);
  const { peopleGroups, restoreEventFrame } = useEventDataStore.getState();
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);
  const { openModal } = useModalStore.getState();

  const filteredAssignments = eventFrame.assignments
    .filter(assign => 
      (!filters.person || assign.personGroupId === filters.person) && 
      (!filters.status || assign.status === filters.status || (assign.status === AssignmentStatus.Mixed && assign.dailyStatuses && Object.values(assign.dailyStatuses).includes(filters.status)))
    )
  .sort((a, b) => (peopleMap.get(a.personGroupId) || '').localeCompare(peopleMap.get(b.personGroupId) || ''));

  return (
    <div ref={ref} id={`event-card-${eventFrame.id}`} className="mb-1 rounded-lg overflow-hidden bg-card text-card-foreground border border-border" aria-labelledby={`event-frame-title-${eventFrame.id}`}>
      <div
        className="px-1 py-0.5 bg-muted cursor-pointer border-b border-border"
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest('button, input, select, a')) {
            return;
          }
          onToggleExpand(eventFrame.id);
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="mb-0.5 sm:mb-0 flex items-center gap-1">
            <Tooltip text={eventFrame.personnelComplete ? 'Marcar com a incomplet' : 'Marcar com a complet'}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateEventFrame({ ...eventFrame, personnelComplete: !eventFrame.personnelComplete });
                  setToastMessage(eventFrame.personnelComplete ? 'Marc marcat com a incomplet.' : 'Marc marcat com a complet.', 'success');
                }}
                className="focus:outline-none"
              >
              <CheckCircleIcon className={`w-5 h-5 transition-colors ${eventFrame.personnelComplete ? 'text-success' : 'text-warning'}`} />
              </button>
            </Tooltip>
            <h4
              id={`event-frame-title-${eventFrame.id}`}
              className="text-sm font-semibold hover:text-primary flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                openModal('eventFrameDetails', { eventFrame });
              }}
            >
              {eventFrame.googleEventId && (
                <Tooltip text="Aquest esdeveniment està sincronitzat amb Google Calendar">
                  <span>
                    <GoogleIcon className="w-4 h-4" />
                  </span>
                </Tooltip>
              )}

              {eventFrame.name}
            </h4>
            {eventFrame.place && <p className="text-xs text-muted-foreground">{eventFrame.place}</p>}
            <p className="text-xs text-muted-foreground">{formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)}</p>
          </div>
          <div className="flex items-center space-x-0.5 sm:space-x-0.5 flex-wrap">
            {isArchived ? (
              <Tooltip text="Restaurar l'esdeveniment">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreEventFrame(eventFrame.id);
                    setToastMessage(`Esdeveniment "${eventFrame.name}" restaurat.`, 'success');
                  }}
                  className="flex items-center gap-1 p-0.5 text-success hover:text-success/90 rounded-md hover:bg-accent"
                >
                  <RestoreIcon className="w-4 h-4" />
                  Restaurar
                </button>
              </Tooltip>
            ) : (
              <>
                <Tooltip text="Editar els detalls de l'esdeveniment">
                  <button onClick={(e) => { e.stopPropagation(); openModal('editEventFrame', { eventFrameToEdit: eventFrame }); }} className="p-0.5 text-primary hover:text-primary/80 rounded-md hover:bg-accent"><EditIcon className="w-4 h-4" /></button>
                </Tooltip>
                <Tooltip text="Eliminar l'esdeveniment">
                  <button onClick={(e) => { e.stopPropagation(); openModal('confirmDeleteEventFrame', { itemType: "Marc d'Esdeveniment", itemName: eventFrame.name, itemId: eventFrame.id }); }} className="p-0.5 text-destructive hover:text-destructive/80 rounded-md hover:bg-accent"><TrashIcon className="w-4 h-4" /></button>
                </Tooltip>
                <Tooltip text="Afegir una nova assignació de personal">
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const defaultPersonGroupId = peopleGroups.length > 0 ? peopleGroups[0].id : '';
                    openModal('addAssignment', {
                      eventFrame,
                      personGroupId: defaultPersonGroupId,
                      startDate: eventFrame.startDate,
                      endDate: eventFrame.endDate,
                      status: AssignmentStatus.Pending,
                      notes: '',
                    });
                  }} className="p-0.5 text-primary hover:text-primary/80 rounded-md hover:bg-accent"><PersonAddIcon className="w-4 h-4" /></button>
                </Tooltip>
              </>
            )}
            <Tooltip text={isExpanded ? "Col·lapsar secció" : "Expandir secció"}>
              <button onClick={(e) => { e.stopPropagation(); logger.info(`[EventFrameCard] Chevron clicked for ${eventFrame.name}. Calling onToggleExpand.`); onToggleExpand(eventFrame.id); }} className="p-0.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent">
                {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-1 py-0.5 bg-card">
          {eventFrame.generalNotes && (
            <div className="mb-0.5">
              <h5 className="font-medium text-sm">Notes Generals</h5>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{eventFrame.generalNotes}</p>
            </div>
          )}
          <h5 className="font-medium text-sm mb-0.5">Assignacions</h5>
          {filteredAssignments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hi ha assignacions que coincideixin amb els filtres.</p>
          ) : (
            <ul className="space-y-0.5">
              {filteredAssignments.map(assign => (
                <AssignmentCard
                  key={assign.id}
                  assignment={assign}
                  eventFrame={eventFrame}
                  isDailyViewExpanded={expandedDailyViewAssignmentIds.has(assign.id)}
                  onToggleDailyView={onToggleDailyView}
                  onGeneralStatusChange={onGeneralStatusChange}
                  onDailyStatusChange={onDailyStatusChange}
                  onEdit={onEditAssignment}
                  onDelete={onDeleteAssignment}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});

export default EventFrameCard;
