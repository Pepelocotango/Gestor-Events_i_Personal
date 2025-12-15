import { forwardRef, useMemo } from 'react';
import logger from '@/utils/logger';
import { useModalStore } from '@/stores/modalStore';
import { useEventDataStore } from '@/stores/eventDataStore';
import { EventFrame, Assignment, AssignmentStatus } from '@/types';
import { PersonAddIcon, EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, GoogleIcon, RestoreIcon } from '@/constants';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatDateRangeDMY } from '@/utils/dateFormat';
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
  isFocused?: boolean;
  onFocus?: () => void;
}

const EventFrameCard = forwardRef<HTMLDivElement, EventFrameCardProps>(({
  eventFrame, isExpanded, expandedDailyViewAssignmentIds, filters, onToggleExpand,
  onToggleDailyView, onUpdateEventFrame, onGeneralStatusChange,
  onDailyStatusChange, onEditAssignment, onDeleteAssignment, setToastMessage,
  isArchived = false, isFocused = false, onFocus,
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
    <div 
      ref={ref} 
      id={`event-card-${eventFrame.id}`} 
      className={`mb-2 rounded-xl overflow-hidden bg-card text-card-foreground transition-all duration-200 ${
        isFocused 
          ? 'border-4 border-primary ring-4 ring-primary/20' 
          : 'border-2 border-border hover:border-muted-foreground/30'
      } ${isArchived ? 'opacity-70' : ''}`} 
      aria-labelledby={`event-frame-title-${eventFrame.id}`}
      onClick={(e) => {
        // Only toggle expand if the click is not on an interactive element like a button.
        // Those elements have their own onClick handlers with e.stopPropagation().
        if ((e.target as HTMLElement).closest('button, input, select, a')) {
          return;
        }
        onToggleExpand(eventFrame.id);
        onFocus?.();
      }}
    >
      <div
        className="px-3 py-2 bg-muted/50 cursor-pointer border-b-2 border-border"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(eventFrame.id);
          onFocus?.();
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
          <div className="flex-grow">
            <div className="flex items-center gap-2">
              <Tooltip text={eventFrame.personnelComplete ? 'Marcar com a incomplet' : 'Marcar com a complet'}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateEventFrame({ ...eventFrame, personnelComplete: !eventFrame.personnelComplete });
                    setToastMessage(eventFrame.personnelComplete ? 'Marc marcat com a incomplet.' : 'Marc marcat com a complet.', 'success');
                  }}
                  className="focus:outline-none p-1 -ml-1"
                >
                  <CheckCircleIcon className={`w-7 h-7 transition-colors ${eventFrame.personnelComplete ? 'text-success' : 'text-warning'}`} />
                </button>
              </Tooltip>
              <h4
                id={`event-frame-title-${eventFrame.id}`}
                className="text-xl font-bold hover:text-primary flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal('eventFrameDetails', { eventFrame });
                }}
              >
                {eventFrame.googleEventId && (
                  <Tooltip text="Aquest esdeveniment està sincronitzat amb Google Calendar">
                    <span>
                      <GoogleIcon className="w-6 h-6" />
                    </span>
                  </Tooltip>
                )}
                {eventFrame.name}
              </h4>
            </div>
            <div className="space-y-1 mt-1">
              {eventFrame.place && (
                <p className="text-base text-muted-foreground">{eventFrame.place}</p>
              )}
              <p className="text-base font-medium text-muted-foreground">
                {formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
            {isArchived ? (
              <Tooltip text="Restaurar l'esdeveniment">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreEventFrame(eventFrame.id);
                    setToastMessage(`Esdeveniment "${eventFrame.name}" restaurat.`, 'success');
                  }}
                  className="flex items-center gap-2 p-2.5 text-success hover:text-success/90 rounded-md hover:bg-accent/50 text-base font-medium"
                >
                  <RestoreIcon className="w-6 h-6" />
                  Restaurar
                </button>
              </Tooltip>
            ) : (
              <>
                <Tooltip text="Editar els detalls de l'esdeveniment">
                  <Tooltip text="Editar esdeveniment">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      openModal('editEventFrame', { eventFrameToEdit: eventFrame }); 
                    }} 
                    className="p-2.5 text-primary hover:text-primary/90 rounded-md hover:bg-accent/50 transition-colors"
                    aria-label="Editar esdeveniment"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                </Tooltip>
                <Tooltip text="Eliminar l'esdeveniment">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      openModal('confirmDeleteEventFrame', { 
                        itemType: "Marc d'Esdeveniment", 
                        itemName: eventFrame.name, 
                        itemId: eventFrame.id 
                      }); 
                    }} 
                    className="p-2.5 text-destructive hover:text-destructive/90 rounded-md hover:bg-accent/50 transition-colors"
                    aria-label="Eliminar esdeveniment"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
                <Tooltip text="Afegir una nova assignació de personal">
                  <button 
                    onClick={(e) => {
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
                    }} 
                    className="p-2.5 text-primary hover:text-primary/90 rounded-md hover:bg-accent/50 transition-colors"
                    aria-label="Afegir assignació"
                  >
                    <PersonAddIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip text={isExpanded ? "Col·lapsar secció" : "Expandir secció"}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  logger.info(`[EventFrameCard] Chevron clicked for ${eventFrame.name}. Calling onToggleExpand.`); 
                  onToggleExpand(eventFrame.id); 
                }} 
                className="p-2.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 transition-colors"
                aria-label={isExpanded ? "Contraure" : "Expandir"}
              >
                {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 bg-card">
          {eventFrame.generalNotes && (
            <div className="mb-4">
              <h5 className="font-medium text-lg mb-1">Notes Generals</h5>
              <p className="text-base text-muted-foreground whitespace-pre-wrap">{eventFrame.generalNotes}</p>
            </div>
          )}
          <h5 className="font-medium text-lg mb-3">Assignacions</h5>
          {filteredAssignments.length === 0 ? (
            <p className="text-base text-muted-foreground">No hi ha assignacions que coincideixin amb els filtres.</p>
          ) : (
            <ul className="space-y-2">
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