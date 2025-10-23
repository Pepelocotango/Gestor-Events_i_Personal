import { useState } from 'react';
import { useEventDataStore, useTemporalStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { startGoogleAuthFlow } from '../stores/googleConfigStore';
import { SunIcon, MoonIcon, InfoIcon, GoogleIcon, SyncIcon, ChevronDownIcon, ChevronUpIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ClockIcon } from '../constants';
import Tooltip from './ui/Tooltip';

interface ControlsProps {
  theme: string;
  toggleTheme: () => void;
  currentFilePath: string | null;
}

const Controls: React.FC<ControlsProps> = ({
    theme,
    toggleTheme,
    currentFilePath,
}) => {
  const { syncWithGoogle } = useEventDataStore.getState();
  const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);
  const isSyncing = useEventDataStore(state => state.isSyncing);
  const canUndo = useTemporalStore(state => state.pastStates.length > 0);
  const canRedo = useTemporalStore(state => state.futureStates.length > 0);
  const { undo, redo } = useEventDataStore.temporal.getState();
  const { openModal } = useModalStore.getState();

  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpansion = () => setIsExpanded(prev => !prev);

  return (
    <div className="bg-card text-card-foreground rounded-lg w-full p-2">
      <Tooltip text={isExpanded ? "Col·lapsar controls" : "Expandir controls"}>
        <div
          onClick={toggleExpansion}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpansion();
            }
          }}
          role="button"
          tabIndex={0}
          className="flex justify-between items-center w-full cursor-pointer"
        >
          {/* Aquest div atura la propagació de l'esdeveniment onMouseEnter per evitar que es mostrin dos tooltips alhora */}
          <div onMouseEnter={(e) => e.stopPropagation()}>
            <Tooltip text={currentFilePath || 'Cap fitxer carregat'}>
              <div className="text-xs text-muted-foreground truncate">
                Fitxer de dades: <strong>{currentFilePath || 'Document nou sense desar'}</strong>
              </div>
            </Tooltip>
          </div>

          <div>
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </div>
        </div>
      </Tooltip>

      {isExpanded && (
        <div className="pt-2 mt-2 border-t border-border flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-0.5">
              <Tooltip text="Desfer (Ctrl+Z)">
                <button onClick={() => undo()} disabled={!canUndo} className="p-1 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Refer (Ctrl+Y)">
                <button onClick={() => redo()} disabled={!canRedo} className="p-1 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnRightIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Historial de canvis">
                <button onClick={() => openModal('history')} disabled={!canUndo && !canRedo} className="p-1 rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
                  <ClockIcon className="w-5 h-5" />
                </button>
              </Tooltip>

            </div>

            {hasUnsavedChanges && (
              <div className="text-sm text-warning flex items-center gap-1 font-semibold animate-pulse">
                <InfoIcon className="w-4 h-4" /> Canvis sense desar
              </div>
            )}

            <Tooltip text={theme === 'dark' ? 'Canviar a tema clar' : 'Canviar a tema fosc'}>
              <button data-testid="theme-toggle" onClick={toggleTheme} className="rounded-full p-1 bg-secondary hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                  {theme === 'dark' ? <SunIcon className="w-5 h-5 text-warning" /> : <MoonIcon className="w-5 h-5 text-foreground" />}
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center justify-end w-full">
            <div className="border border-border rounded-lg p-1 flex items-center gap-0.5">
              <Tooltip text="Sincronitzar manualment amb Google Calendar">
                <button
                  onClick={syncWithGoogle}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1 bg-warning hover:bg-warning/90 text-warning-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait w-40"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sincronitzant...</span>
                    </>
                  ) : (
                    <>
                      <SyncIcon />
                      <span>Sincronitzar</span>
                    </>
                  )}
                </button>
              </Tooltip>
              <Tooltip text="Configurar la connexió amb Google">
                <button onClick={() => openModal('googleSettings')} className="flex items-center justify-center gap-1 bg-secondary hover:bg-accent text-secondary-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <GoogleIcon /> Configurar
                </button>
              </Tooltip>
              <Tooltip text="Connectar amb Google Calendar">
                <button
                    onClick={startGoogleAuthFlow}
                    className="flex items-center justify-center gap-1 bg-background hover:bg-accent text-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm border border-border"
                >
                    <GoogleIcon />
                    <span>Connectar Google</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;