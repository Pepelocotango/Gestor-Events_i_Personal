import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTemporalStore, useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { XMarkIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/solid';

const HistoryModal: React.FC = () => {
  const { t } = useTranslation();
  const pastStates = useTemporalStore(state => state.pastStates);
  const futureStates = useTemporalStore(state => state.futureStates);
  const { undo, redo } = useEventDataStore.temporal.getState();
  const { closeModal } = useModalStore.getState();

  const handleUndo = (steps: number) => {
    undo(steps);
    closeModal();
  };

  const handleRedo = (steps: number) => {
    redo(steps);
    closeModal();
  };

  const reversedFutureStates = [...futureStates].reverse();
  const reversedPastStates = [...pastStates].reverse();

  // Obtenim l'acció de l'estat actual directament des de l'store.
  const currentState = useEventDataStore.getState();
  const currentLastAction = (currentState as any).lastAction;
  const currentActionDescription = currentState.lastActionDescription; // Fallback

  // Helper to resolve action to translated string
  const resolveActionDescription = (lastAction: any): string => {
    if (!lastAction) {
      return t('modals.history.no_name_action') as string;
    }
    if (lastAction.type) {
      // New structure: { type: 'actions.create_event', params: {...} }
      const translated = t(lastAction.type, lastAction.params || {});
      // Handle case where t() returns an object
      return typeof translated === 'string' ? translated : lastAction.type;
    }
    // Fallback to old string format
    return (lastAction as string) || (t('modals.history.no_name_action') as string);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">{t('modals.history.title')}</h2>
        <button
          onClick={closeModal}
          className="p-1 rounded-full hover:bg-accent"
        >
          <XMarkIcon className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto pr-2">
        <ul className="space-y-2">
          {reversedFutureStates.map((state, index) => (
            <li key={`future-${index}`}>
              <button
                onClick={() => handleRedo(index + 1)}
                className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-2"
              >
                <ArrowUturnRightIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground italic">
                  {resolveActionDescription(state.lastAction || state.lastActionDescription)}
                </span>
              </button>
            </li>
          ))}
          <li>
            <div className="w-full text-left p-2 rounded-md bg-primary/10 flex items-center gap-2">
              <span className="font-bold text-primary">{t('modals.history.current_state')}</span>
            </div>
          </li>
          {reversedPastStates.map((pastState, index) => {
            const description = index === 0
              ? resolveActionDescription(currentLastAction || currentActionDescription)
              : resolveActionDescription((pastState as any)?.lastAction || (pastState as any)?.lastActionDescription);

            return (
              <li key={`past-${index}`}>
                <button
                  onClick={() => handleUndo(index + 1)}
                  className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-2"
                >
                  <ArrowUturnLeftIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">
                    {description || (t('modals.history.initial_action') as string)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default HistoryModal;
