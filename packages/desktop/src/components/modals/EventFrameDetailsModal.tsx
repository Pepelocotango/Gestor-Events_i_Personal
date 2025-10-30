import React from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { EventFrame, AssignmentStatus, ShowToastFunction } from '../../types';
import { logger, formatDateDMY, formatDateRangeDMY, getStatusSummaryText } from '@gep/core';
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
          <ul className="list-disc list-inside space-y-1 pl-2 text-sm max-h-60 overflow-y-auto">
            {[...eventFrame.assignments]
              .sort((a, b) => (peopleGroups.find(p => p.id === a.personGroupId)?.name || '').localeCompare(peopleGroups.find(p => p.id === b.personGroupId)?.name || ''))
              .map(assign => {
              const person = peopleGroups.find(p => p.id === assign.personGroupId);
              let statusColor = 'text-warning';
              if (assign.status === AssignmentStatus.Yes) statusColor = 'text-success';
              if (assign.status === AssignmentStatus.No) statusColor = 'text-destructive';
              if (assign.status === AssignmentStatus.Mixed) statusColor = 'text-info';
              return (
                <li key={assign.id} className="text-muted-foreground py-1">
                  <strong className="text-foreground">{person?.name || 'N/A'}</strong>: {assign.startDate === assign.endDate ? formatDateDMY(assign.startDate) : formatDateRangeDMY(assign.startDate, assign.endDate)} <span className={`${statusColor} font-semibold`}>{getStatusSummaryText(assign)}</span>
                  {assign.notes && <span className="block text-xs italic pl-4 text-muted-foreground mt-0.5">Nota: {assign.notes}</span>}
                </li>
              );
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