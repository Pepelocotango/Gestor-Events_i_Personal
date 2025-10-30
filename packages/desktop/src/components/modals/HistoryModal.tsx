import React from 'react';
import { useTemporalStore, useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { XMarkIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/solid';

const HistoryModal: React.FC = () => {
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

  // Obtenim la descripció de l'acció de l'estat actual directament des de l'store.
  const currentActionDescription = useEventDataStore.getState().lastActionDescription;

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Historial de Canvis</h2>
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
                  {state.lastActionDescription || 'Acció sense nom'}
                </span>
              </button>
            </li>
          ))}
          <li>
            <div className="w-full text-left p-2 rounded-md bg-primary/10 flex items-center gap-2">
              <span className="font-bold text-primary">Estat Actual</span>
            </div>
          </li>
          {reversedPastStates.map((_, index) => {
            const description = index === 0
              ? currentActionDescription
              : reversedPastStates[index - 1].lastActionDescription;

            return (
              <li key={`past-${index}`}>
                <button
                  onClick={() => handleUndo(index + 1)}
                  className="w-full text-left p-2 rounded-md hover:bg-accent flex items-center gap-2"
                >
                  <ArrowUturnLeftIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">
                    {description || 'Acció inicial'}
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
