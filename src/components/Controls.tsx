import { useState } from 'react';
import { useEventDataStore, useTemporalStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { startGoogleAuthFlow } from '../stores/googleConfigStore';
import { ShowToastFunction } from '../types';
import { SunIcon, MoonIcon, InfoIcon, GoogleIcon, SyncIcon, ChevronDownIcon, ChevronUpIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, DocumentArrowDownIcon, ClockIcon } from '../constants';
import { exportEventListToPdf } from '../utils/pdfGenerator';
import { exportEventListToCsv } from '../utils/csvUtils';
import { selectFilteredEventFrames } from '../utils/selectors';
import Tooltip from './ui/Tooltip';

interface ControlsProps {
  theme: string;
  toggleTheme: () => void;
  showToast: ShowToastFunction;
  currentFilePath: string | null;
}

const Controls: React.FC<ControlsProps> = ({
    theme,
    toggleTheme,
    showToast,
    currentFilePath,
}) => {
  const { syncWithGoogle } = useEventDataStore.getState();
  const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);
  const isSyncing = useEventDataStore(state => state.isSyncing);
  const { canUndo, canRedo, undo, redo } = useTemporalStore(state => ({
    canUndo: state.pastStates.length > 0,
    canRedo: state.futureStates.length > 0,
    undo: state.undo,
    redo: state.redo,
  }));
  const { openModal } = useModalStore.getState();

  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpansion = () => setIsExpanded(prev => !prev);

  return (
    <div className="p-1 bg-gray-100 dark:bg-gray-800 shadow-md rounded-lg w-full">
      <div className="flex justify-between items-center w-full">
        <Tooltip text={currentFilePath || 'Cap fitxer carregat'}>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Fitxer de dades: <strong>{currentFilePath || 'Document nou sense desar'}</strong>
          </div>
        </Tooltip>
        <Tooltip text={isExpanded ? "Col·lapsar controls" : "Expandir controls"}>
          <button
            onClick={toggleExpansion}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </Tooltip>
      </div>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Tooltip text="Desfer (Ctrl+Z)">
                <button onClick={() => undo()} disabled={!canUndo} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Refer (Ctrl+Y)">
                <button onClick={() => redo()} disabled={!canRedo} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnRightIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Historial de canvis">
                <button onClick={() => openModal('history')} disabled={!canUndo && !canRedo} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ClockIcon className="w-5 h-5" />
                </button>
              </Tooltip>

              <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-1"></div>

              <Tooltip text="Exportar la llista d'esdeveniments i assignacions a PDF">
                <button
                  onClick={() => {
                    const state = useEventDataStore.getState();
                    const filteredEventFrames = selectFilteredEventFrames({
                      eventFrames: state.eventFrames,
                      peopleGroups: state.peopleGroups,
                      filterText: state.filterText,
                      filterStatus: state.filterStatus,
                      filterDate: state.filterDate,
                      localFilterUIPerson: state.localFilterUIPerson,
                      filterPlace: state.filterPlace,
                      filterUIEventFrame: state.filterUIEventFrame
                    });
                    exportEventListToPdf(filteredEventFrames, state.peopleGroups, showToast);
                  }}
                  className="flex items-center justify-center gap-1 bg-red-700 hover:bg-red-800 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> PDF
                </button>
              </Tooltip>
              <Tooltip text="Exportar la llista d'esdeveniments i assignacions a CSV">
                <button
                  onClick={() => {
                    const state = useEventDataStore.getState();
                    const filteredEventFrames = selectFilteredEventFrames({
                      eventFrames: state.eventFrames,
                      peopleGroups: state.peopleGroups,
                      filterText: state.filterText,
                      filterStatus: state.filterStatus,
                      filterDate: state.filterDate,
                      localFilterUIPerson: state.localFilterUIPerson,
                      filterPlace: state.filterPlace,
                      filterUIEventFrame: state.filterUIEventFrame
                    });
                    exportEventListToCsv(filteredEventFrames, state.peopleGroups, showToast);
                  }}
                  className="flex items-center justify-center gap-1 bg-green-700 hover:bg-green-800 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> CSV
                </button>
              </Tooltip>
            </div>

            {hasUnsavedChanges && (
              <div className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1 font-semibold animate-pulse">
                <InfoIcon className="w-4 h-4" /> Canvis sense desar
              </div>
            )}

            <Tooltip text={theme === 'dark' ? 'Canviar a tema clar' : 'Canviar a tema fosc'}>
              <button onClick={toggleTheme} className="rounded-full p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-gray-700" />}
              </button>
            </Tooltip>
          </div>

          <div className="flex items-center justify-end w-full">
            <div className="flex items-center gap-1">
              <Tooltip text="Sincronitzar manualment amb Google Calendar">
                <button
                  onClick={syncWithGoogle}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait w-40"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <button onClick={() => openModal('googleSettings')} className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <GoogleIcon /> Configurar
                </button>
              </Tooltip>
              <Tooltip text="Connectar amb Google Calendar">
                <button
                    onClick={startGoogleAuthFlow}
                    className="flex items-center justify-center gap-1 bg-white hover:bg-gray-200 text-gray-800 font-semibold py-1 px-2 rounded-md transition-colors text-sm border border-gray-300"
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
