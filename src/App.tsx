import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
import logger from './utils/logger';
import { EventDataProvider } from './contexts/EventDataContext';
import { useEventDataManager } from './hooks/useEventDataManager';
import { THEME_STORAGE_KEY } from './constants';
import Modal from './components/ui/Modal';
import { ModalState, ModalType, InitialEventFrameData, ModalData, EventDataConteImplicits, EventFrame, SummaryRow, Assignment, AssignmentStatus, ShowToastFunction, PersonGroup, MaterialItem } from './types';
import { formatDateDMY } from './utils/dateFormat';

const MainDisplay = lazy(() => import('./components/MainDisplay'));
const Controls = lazy(() => import('./components/Controls'));
const Navigation = lazy(() => import('./components/Navigation'));
const TechSheetsDisplay = lazy(() => import('./components/TechSheetsDisplay'));
const SyncProgressOverlay = lazy(() => import('./components/ui/SyncProgressOverlay'));
import CustomMenuBar from './components/ui/CustomMenuBar';
import SplashScreen from './components/ui/SplashScreen';

const PeopleDisplay = lazy(() => import('./components/PeopleDisplay'));
const MaterialDisplay = lazy(() => import('./components/MaterialDisplay'));

const EventFrameFormModal = lazy(() => import('./components/modals/EventFrameFormModal'));
const AssignmentFormModal = lazy(() => import('./components/modals/AssignmentFormModal'));

const ConfirmDeleteModal = lazy(() => import('./components/modals/ConfirmDeleteModal'));
const ConfirmDuplicateModal = lazy(() => import('./components/modals/ConfirmDuplicateModal'));
const EventFrameDetailsModal = lazy(() => import('./components/modals/EventFrameDetailsModal'));
const GoogleSettingsModal = lazy(() => import('./components/modals/GoogleSettingsModal'));
const MergeOrReplaceModal = lazy(() => import('./components/modals/MergeOrReplaceModal'));
const SelectSyncCalendarModal = lazy(() => import('./components/modals/SelectSyncCalendarModal'));
const CreateCalendarModal = lazy(() => import('./components/modals/CreateCalendarModal'));
const UpdateFromAssignmentsModal = lazy(() => import('./components/modals/UpdateFromAssignmentsModal'));

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  persistent?: boolean;
}

const App: React.FC = () => {
  
    // --- 1. DECLARACIONS D'ESTAT (useState) ---
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [currentDataPath, setCurrentDataPath] = useState<string>('Cap fitxer carregat.');
  const [currentFilterHighlight, setCurrentFilterHighlight] = useState<string>('');
  const [initialLoadAttempted, setInitialLoadAttempted] = useState<boolean>(false);
  const [filterToShowEventFrameId, setFilterToShowEventFrameId] = useState<string | null>(null);
  const [currentlyDisplayedFrames, setCurrentlyDisplayedFrames] = useState<EventFrame[]>([]);
  const [filterUIPerson, setFilterUIPerson] = useState<string>('');

  const controlsRef = useRef<any>(null);
  const mainDisplayRef = useRef<{ handleResize: () => void }>(null);

  // --- 2. FUNCIONS D'AJUDA (useCallback) ---
  const clearToastMessage = (toastId: string) => {
    setToastState(prevState => (prevState?.id === toastId ? null : prevState));
  };
  
  const showToast: ShowToastFunction = useCallback((message, type = 'success', persistent = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastState({ id, message, type: type || 'success', persistent });
    if (!persistent) {
      setTimeout(() => clearToastMessage(id), 30000);
    }
  }, []);

  const openModal = useCallback((type: ModalType, data?: ModalData | InitialEventFrameData) => {
    logger.info('[UI] Obrint modal', { type, data });
    setModalState({ type, data: data as ModalData | null });
  }, []);

  const closeModal = () => {
    logger.info('[UI] Tancant modal.');
    setModalState({ type: null, data: null });
  };

  // --- 3. INICIALITZACIÓ DEL HOOK DE DADES ---
  const eventDataManagerHookResult = useEventDataManager(showToast, openModal, closeModal);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 12500);
    return () => clearTimeout(timer);
  }, []);

  const { 
    loadData: loadDataFromManager, 
    exportData: exportDataFromManager, 
    setHasUnsavedChanges, 
    hasUnsavedChanges, 
    syncWithGoogle,
    isSyncing,
    syncProgress,
    undo,
    redo,
    canUndo,
    canRedo
  } = eventDataManagerHookResult;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        // No activar dreceres si s'està escrivint en un input, textarea, o contentEditable
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        if (event.ctrlKey) {
            if (event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (canUndo) undo();
            } else if (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z')) {
                event.preventDefault();
                if (canRedo) redo();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // <<<< NOU REF PER A GESTIONAR L'ESTAT DELS CANVIS SENSE DESAR >>>>
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  
  // --- INICI DELS ALTRES EFECTES I FUNCIONS ---
  logger.info('App.tsx - RE-RENDER', { modalType: modalState.type, modalData: modalState.data });

  const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState(false);
  const [loadingOverlayMessage, setLoadingOverlayMessage] = useState('');

  useEffect(() => {
    // This effect can be simplified or removed if syncProgress.visible covers all cases
    if (isSyncing && !syncProgress.visible) {
      setLoadingOverlayMessage('Sincronitzant amb Google Calendar...');
      setIsLoadingOverlayVisible(true);
    } else if (!isSyncing && !syncProgress.visible) {
      setIsLoadingOverlayVisible(false);
      setLoadingOverlayMessage('');
    }
  }, [isSyncing, syncProgress.visible]);


  useEffect(() => {
    let cleanupShowLoading: (() => void) | undefined;
    let cleanupHideLoading: (() => void) | undefined;
    let cleanupAppWillRelaunch: (() => void) | undefined;
    let cleanupDevModeQuit: (() => void) | undefined;

    if (window.electronAPI) {
      if (window.electronAPI.showLoadingOverlay) {
        cleanupShowLoading = window.electronAPI.showLoadingOverlay((message: string) => {
          setLoadingOverlayMessage(message);
          setIsLoadingOverlayVisible(true);
        });
      }
      if (window.electronAPI.hideLoadingOverlay) {
        cleanupHideLoading = window.electronAPI.hideLoadingOverlay(() => {
          setIsLoadingOverlayVisible(false);
          setLoadingOverlayMessage('');
        });
      }
      if (window.electronAPI.onAppWillRelaunchAfterReset) {
        cleanupAppWillRelaunch = window.electronAPI.onAppWillRelaunchAfterReset(() => {
          showToast(`Reset completat:\nL'aplicació es reiniciarà.`, 'info', true);
        });
      }
      if (window.electronAPI.onDevModeQuitAfterReset) {
        cleanupDevModeQuit = window.electronAPI.onDevModeQuitAfterReset(() => {
          showToast("Reset completat en mode desenvolupament. Si us plau, tanca i reinicia l'aplicació manualment.", 'warning', true);
        });
      }
    }
    return () => {
      cleanupShowLoading?.();
      cleanupHideLoading?.();
      cleanupAppWillRelaunch?.();
      cleanupDevModeQuit?.();
    };
  }, [showToast]);

  useEffect(() => {
    const body = document.body;
    if (modalState.type !== null) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    return () => {
      body.style.overflow = 'auto';
    };
  }, [modalState.type]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const Toast: React.FC<{ toast: ToastState }> = ({ toast }) => {
    return (
      <div
        className={`toast toast-${toast.type}`}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          backgroundColor: toast.type === 'success' ? '#4caf50' : toast.type === 'error' ? '#f44336' : '#2196f3',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <span>{toast.message}</span>
        <button
          onClick={() => clearToastMessage(toast.id)}
          style={{
            marginLeft: '1rem',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ×
        </button>
      </div>
    );
  };

  

  const handleShowOnList = (eventFrameId: string) => {
      setFilterToShowEventFrameId(eventFrameId);
      setCurrentFilterHighlight(eventFrameId);
      closeModal();
  };

  const contextValue = useMemo((): EventDataConteImplicits => ({
    ...eventDataManagerHookResult,
    openModal,
    showToast, // <<< LÍNIA AFEGIDA
  }), [eventDataManagerHookResult, openModal, showToast]);

  useEffect(() => {
    const attemptInitialLoad = async () => {
      logger.info('App.tsx - useEffect [initialLoadAttempted, loadDataFromManager, showToast, setHasUnsavedChanges] executant-se.');
      if (window.electronAPI && typeof window.electronAPI.loadAppData === 'function') {
        try {
          logger.info("Intentant carregar dades de l'aplicació via Electron...");
          const data = await window.electronAPI.loadAppData();
          loadDataFromManager(data);
          setHasUnsavedChanges(false); // Important: la càrrega inicial no són "canvis no desats"
          if (data) {
            showToast('Dades de l\'aplicació carregades automàticament.', 'info');
          } else {
            showToast('No s\'han trobat dades anteriors de l\'aplicació per carregar (Electron). Començant buit.', 'info');
          }
        } catch (error) {
          console.error('Error carregant dades de l\'aplicació via Electron:', error);
          showToast(`Error carregant dades (Electron): ${(error as Error).message}`, 'error');
          loadDataFromManager(null);
          setHasUnsavedChanges(false); // Fins i tot si hi ha error, comencem "nets"
        }
        // Després de carregar dades, obtenim la ruta per defecte
        if (window.electronAPI?.getDefaultDataPath) {
          try {
            const path = await window.electronAPI.getDefaultDataPath();
            setCurrentDataPath(path);
          } catch (e) {
            setCurrentDataPath('Ruta del fitxer per defecte no disponible.');
          }
        }
      } else {
        console.log("Mode navegador detectat o API d'Electron no disponible. Començant buit.");
        loadDataFromManager(null);
        setHasUnsavedChanges(false); // Comencem "nets"
      }
      setInitialLoadAttempted(true);
    };

    if (!initialLoadAttempted) {
      attemptInitialLoad();
    }
  }, [initialLoadAttempted, loadDataFromManager, showToast, setHasUnsavedChanges]);

  // <<< USEEFFECT CORREGIT PER AL TANCAMENT >>>
  useEffect(() => {
    if (window.electronAPI?.onConfirmQuit) {
      const handleQuit = async () => {
        logger.info("Renderer va rebre el senyal 'confirm-quit-signal'");
        try {
          if (hasUnsavedChangesRef.current) { // Utilitza la referència
            const dataToSave = await exportDataFromManager();
            logger.info("Renderer: Desant dades abans de sortir...");
            await window.electronAPI?.saveAppData?.(dataToSave);
          } else {
            logger.info("Renderer: No hi ha canvis per desar.");
          }
        } catch (error) {
          logger.error("Renderer: Excepció durant el desat en sortir:", error);
        } finally {
          window.electronAPI?.sendQuitConfirmedByRenderer?.();
        }
      };
      
      // Registrem el listener només un cop
      window.electronAPI.onConfirmQuit(handleQuit);
    }
  }, [exportDataFromManager]); // Array de dependències estable

  useEffect(() => {
    if (window.electronAPI) {
      const onSuccess = () => showToast('Connectat a Google Calendar amb èxit!', 'success');
      const onError = (message: string) => showToast(`Error d'autenticació: ${message}`, 'error');
      window.electronAPI.onGoogleAuthSuccess(onSuccess);
      window.electronAPI.onGoogleAuthError(onError);
      return () => {
        if (ipcRenderer) {
          ipcRenderer.removeListener('google-auth-success', onSuccess);
          ipcRenderer.removeListener('google-auth-error', onError);
        }
      };
    }
  }, [showToast]);
  const escapeCsvCell = (cellData: string | number | undefined | null): string => {
    if (cellData === undefined || cellData === null) return '';
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };

  const generateCsvFileName = () => {
    const date = new Date();
    const formattedDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

    const eventName = filterToShowEventFrameId
      ? currentlyDisplayedFrames.find(ef => ef.id === filterToShowEventFrameId)?.name || "tots"
      : "tots";

    const personName = filterUIPerson
      ? eventDataManagerHookResult.getPersonGroupById(filterUIPerson)?.name || "tots"
      : "tots";

    const status = "tots els estats";

    const location = currentlyDisplayedFrames.length === 1
      ? currentlyDisplayedFrames[0].place || "tots"
      : "tots";

    const textFilter = filterUIPerson ? `filtre_${filterUIPerson.replace(/[^a-zA-Z0-9]/g, '_')}` : "sense_filtre";

    return `llista_${eventName}-${personName}-${status}-${textFilter}-${formattedDate}-${location}.csv`;
  };

  useEffect(() => {
    if (toastState) {
      mainDisplayRef.current?.handleResize();
    }
  }, [toastState]);

  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'undo':
            if (canUndo) undo();
            break;
          case 'redo':
            if (canRedo) redo();
            break;
          case 'save-all':
            controlsRef.current?.handleSaveData('all');
            break;
          case 'hard-reset':
            controlsRef.current?.handleRequestHardReset();
            break;
          case 'save-people':
            controlsRef.current?.handleSaveData('people');
            break;
          case 'save-material':
            controlsRef.current?.handleSaveData('material');
            break;
          case 'sync-google':
            syncWithGoogle();
            break;
          case 'config-google':
            openModal('googleSettings');
            break;
          case 'connect-google':
            controlsRef.current?.handleConnectGoogle();
            break;
          case 'toggle-theme':
            toggleTheme();
            break;
          default:
            break;
        }
      });

      return cleanup;
    }
  }, [syncWithGoogle, openModal, toggleTheme, undo, redo, canUndo, canRedo]);

  useEffect(() => {
    if (window.electronAPI?.onFileDataLoaded) {
      const cleanup = window.electronAPI.onFileDataLoaded((data) => {
        logger.info('[IPC] Dades de fitxer rebudes des del menú', { type: data.type, fileName: data.fileName });
        if (data.type === 'all') {
          controlsRef.current?.processAllData(data.content, data.fileName);
        } else if (data.type === 'material') {
          controlsRef.current?.processMaterialData(data.content);
        } else if (data.type === 'people') {
          controlsRef.current?.processPeopleData(data.content);
        }
      });
      return cleanup;
    }
  }, []);

  const handleExportCurrentViewToCsv = () => {
    const dataToExport: SummaryRow[] = [];

    currentlyDisplayedFrames.forEach(ef => {
      if (ef.assignments.length > 0) {
        ef.assignments.forEach(a => {
          const person = eventDataManagerHookResult.getPersonGroupById(a.personGroupId);
          if (!filterUIPerson || a.personGroupId === filterUIPerson) {
            dataToExport.push({
              id: ef.id + "_" + a.id,
              primaryGrouping: ef.name,
              secondaryGrouping: person?.name || 'N/A',
              eventFrameName: ef.name,
              eventFramePlace: ef.place,
              eventFrameStartDate: formatDateDMY(ef.startDate),
              eventFrameEndDate: formatDateDMY(ef.endDate),
              assignmentPersonName: person?.name || 'N/A',
              assignmentStartDate: formatDateDMY(a.startDate),
              assignmentEndDate: formatDateDMY(a.endDate),
              assignmentStatus: a.status,
              assignmentNotes: a.notes,
              eventFrameGeneralNotes: ef.generalNotes,
              assignmentObject: a,
            });
          }
        });
      } else {
        if (!filterUIPerson) {
          const placeholderAssignment: Assignment = {
              id: `placeholder-no-assignment-${ef.id}`,
              personGroupId: '',
              eventFrameId: ef.id,
              startDate: '',
              endDate: '',
              status: AssignmentStatus.Pending,
              notes: '',
          };
          dataToExport.push({
            id: ef.id,
            primaryGrouping: ef.name,
            secondaryGrouping: "Sense assignacions",
            eventFrameName: ef.name,
            eventFramePlace: ef.place,
            eventFrameStartDate: formatDateDMY(ef.startDate),
            eventFrameEndDate: formatDateDMY(ef.endDate),
            assignmentPersonName: 'N/A',
            assignmentStartDate: 'N/A',
            assignmentEndDate: 'N/A',
            assignmentStatus: '',
            assignmentNotes: '',
            eventFrameGeneralNotes: ef.generalNotes,
            assignmentObject: placeholderAssignment
          });
        }
      }
    });

    if (dataToExport.length === 0) {
      showToast("No hi ha dades a la vista actual per exportar.", 'info');
      return;
    }

    const headers: (keyof SummaryRow)[] = [
      "primaryGrouping", "secondaryGrouping", "eventFrameName", "eventFramePlace",
      "eventFrameStartDate", "eventFrameEndDate", "assignmentPersonName",
      "assignmentStartDate", "assignmentEndDate", "assignmentStatus",
      "assignmentNotes", "eventFrameGeneralNotes"
    ];
    const headerDisplayNames: { [key in keyof SummaryRow]?: string } = {
      primaryGrouping: "Agrupació Principal (Nom Esdeveniment Marc)",
      secondaryGrouping: "Agrupació Secundària (Persona/Grup o 'Sense assignacions')",
      eventFrameName: "Nom Esdeveniment Marc",
      eventFramePlace: "Lloc Esdeveniment Marc",
      eventFrameStartDate: "Inici Esdeveniment Marc",
      eventFrameEndDate: "Fi Esdeveniment Marc",
      assignmentPersonName: "Persona Assignada",
      assignmentStartDate: "Inici Assignació",
      assignmentEndDate: "Fi Assignació",
      assignmentStatus: "Estat Assignació",
      assignmentNotes: "Notes Assignació",
      eventFrameGeneralNotes: "Notes Generals Marc"
    };
    const headerString = headers.map(h => escapeCsvCell(headerDisplayNames[h] || h)).join(',');
    const rows = dataToExport.map(row =>
      headers.map(header => escapeCsvCell(row[header])).join(',')
    );
    const csvContent = [headerString, ...rows].join('\n');
    const fileName = generateCsvFileName();
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Vista actual exportada a CSV.", 'success');
  };


  const renderModalContent = () => {
    if (!modalState.type) return null;
    switch (modalState.type) {
      case 'addEventFrame':
        return <EventFrameFormModal
                  onClose={closeModal}
                  showToast={showToast}
                  initialData={modalState.data ? { startDate: modalState.data.startDate, endDate: modalState.data.endDate } : undefined}
                />;
      case 'editEventFrame':
        return <EventFrameFormModal
                  onClose={closeModal}
                  eventFrameToEdit={modalState.data!.eventFrameToEdit}
                  showToast={showToast}
                />;
      case 'addAssignment':
        return <AssignmentFormModal
                onClose={closeModal}
                eventFrame={modalState.data!.eventFrame!}
                showToast={showToast}
                setExpandedEventFrameId={setFilterToShowEventFrameId} />;
      case 'editAssignment':
        return <AssignmentFormModal
                onClose={closeModal}
                eventFrame={modalState.data!.eventFrame!}
                assignmentToEdit={modalState.data!.assignmentToEdit}
                showToast={showToast}
                setExpandedEventFrameId={setFilterToShowEventFrameId} />;
      
      case 'eventFrameDetails':
        return <EventFrameDetailsModal onClose={closeModal} eventFrame={modalState.data!.eventFrame!} showToast={showToast} onShowOnList={handleShowOnList}/>;
      case 'confirmHardReset':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType={modalState.data!.itemType!}
                  itemName={modalState.data!.itemName!}
                  onConfirm={modalState.data!.onConfirmSpecial!}
                  showToast={showToast}
                  titleOverride={modalState.data!.titleOverride}
                  confirmButtonText={modalState.data!.confirmButtonText}
                  cancelButtonText={modalState.data!.cancelButtonText}
                  requiresInput={modalState.data!.requiresInput}
                />;
      case 'confirmDeleteEventFrame':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Marc d'Esdeveniment"
                  itemName={modalState.data!.itemName!}
                  onConfirm={() => {
                    eventDataManagerHookResult.deleteEventFrame(modalState.data!.itemId!);
                  }}
                  showToast={showToast}
                />;
                
      case 'confirmDeleteAssignment':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Assignació"
                  itemName={modalState.data!.itemName!}
                  onConfirm={() => {
                    eventDataManagerHookResult.deleteAssignment(modalState.data!.eventFrameId!, modalState.data!.assignmentId!);
                  }}
                  showToast={showToast}
                />;
      
      case 'googleSettings':
        return <GoogleSettingsModal onClose={closeModal} showToast={showToast} />;
      case 'createAppCalendar':
        return <CreateCalendarModal onClose={closeModal} showToast={showToast} />;
      case 'selectSyncCalendar':
        return <SelectSyncCalendarModal
                  onClose={closeModal}
                  onConfirm={modalState.data!.onConfirmSync!}
                  managedCalendars={modalState.data!.managedCalendars!}
                  activeCalendarId={modalState.data!.activeCalendarId!}
                />;
      case 'mergeOrReplace':
        return (
          <MergeOrReplaceModal
            isOpen={true}
            onClose={closeModal}
            itemType={modalState.data!.itemType!}
            onMerge={() => {
              if (modalState.data?.itemType === 'persones' && modalState.data.newData) {
                contextValue.mergePeopleGroups(modalState.data.newData as PersonGroup[]);
              } else if (modalState.data?.itemType === 'material' && modalState.data.newData) {
                contextValue.addMaterialItemsFromFile(modalState.data.newData as MaterialItem[]);
              }
              closeModal();
            }}
            onReplace={() => {
              if (modalState.data?.itemType === 'persones' && modalState.data.newData) {
                contextValue.replacePeopleGroups(modalState.data.newData as PersonGroup[]);
              } else if (modalState.data?.itemType === 'material' && modalState.data.newData) {
                contextValue.replaceMaterialItems(modalState.data.newData as MaterialItem[]);
              }
              closeModal();
            }}
          />
        );
      case 'updateFromAssignments':
        return <UpdateFromAssignmentsModal
                  onClose={closeModal}
                  onConfirm={modalState.data!.onConfirm!}
                  toAdd={modalState.data!.toAdd || []}
                  toRemove={modalState.data!.toRemove || []}
                  toUpdate={modalState.data!.toUpdate || []}
                  getPersonGroupById={eventDataManagerHookResult.getPersonGroupById}
                />;
      case 'confirmDuplicate':
        return <ConfirmDuplicateModal
                  onClose={closeModal}
                  onConfirm={() => {
                    if (modalState.data?.onConfirm) {
                      (modalState.data.onConfirm as () => void)();
                    }
                    closeModal();
                  }}
                  message={modalState.data?.message || ''}
                />;
      default:
        return null;
    }
  };

  const getModalTitle = (): string => {
    if (!modalState.type) return '';
    if (modalState.type === 'confirmDeleteEventFrame' && modalState.data?.titleOverride) {
        return modalState.data.titleOverride;
    }
    switch (modalState.type) {
      case 'addEventFrame': return "Afegir Nou Marc d'Esdeveniment";
      case 'editEventFrame': return "Editar Marc d'Esdeveniment";
      case 'addAssignment': return `Nova Assignació per a: ${modalState.data?.eventFrame?.name || ''}`;
      case 'editAssignment': return `Editar Assignació per a: ${modalState.data?.eventFrame?.name || ''}`;
      case 'selectSyncCalendar': return "Seleccionar Calendari per Sincronitzar";
      case 'createAppCalendar': return "Crear Nou Calendari de l'App";
      case 'confirmDuplicate': return "Conflicte d'Assignació Detectat";
      
      case 'eventFrameDetails': return `Detalls de: ${modalState.data?.eventFrame?.name || ''}`;
      case 'confirmHardReset':
      case 'confirmDeleteEventFrame':
      case 'confirmDeleteAssignment':
        return "Confirmar Eliminació";
      case 'updateFromAssignments': return "Actualitzar Personal des d'Assignacions";
      default: return "Diàleg";
    }
  };

  const getModalSize = (): 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' => {
    if (!modalState.type) return 'xl';
    switch (modalState.type) {
      case 'addEventFrame':
      case 'editEventFrame':
      case 'addAssignment':
      case 'editAssignment':
      case 'eventFrameDetails':
        return '4xl';
      case 'confirmDeleteEventFrame':
      case 'confirmDeleteAssignment':
      case 'confirmHardReset':
        return 'xl';
      case 'googleSettings':
        return '2xl';
      case 'selectSyncCalendar':
      case 'createAppCalendar':
          return 'xl';
      case 'mergeOrReplace':
        return 'lg';
      default: return 'xl';
    }
  }

  return (
    <EventDataProvider value={contextValue}>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {showSplash && <SplashScreen />}
          <header className="sticky top-0 z-40 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
            <CustomMenuBar canUndo={canUndo} canRedo={canRedo} />
            <div className="container mx-auto p-2">
              <Suspense fallback={<div className="text-center p-4">Carregant controls...</div>}>
                <Controls
                  ref={controlsRef}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onOpenModal={openModal}
                  peopleGroups={eventDataManagerHookResult.peopleGroups}
                  showToast={showToast}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSyncWithGoogle={syncWithGoogle}
                  isSyncing={isSyncing}
                  currentDataPath={currentDataPath}
                  setCurrentDataPath={setCurrentDataPath}
                />
              </Suspense>
              <Suspense fallback={<div className="text-center p-2">Carregant navegació...</div>}>
                <Navigation />
              </Suspense>
            </div>
          </header>

          <main className="container mx-auto p-1 flex-grow">
            <Suspense fallback={<div className="text-center p-8">Carregant vista...</div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <MainDisplay
                      ref={mainDisplayRef}
                      openModal={openModal}
                      setToastMessage={showToast}
                      currentFilterHighlight={currentFilterHighlight}
                      setCurrentFilterHighlight={setCurrentFilterHighlight}
                      filterToShowEventFrameId={filterToShowEventFrameId}
                      setFilterToShowEventFrameId={setFilterToShowEventFrameId}
                      setCurrentlyDisplayedFrames={setCurrentlyDisplayedFrames}
                      onExportCurrentViewToCsv={handleExportCurrentViewToCsv}
                      setFilterUIPerson={setFilterUIPerson}
                    />
                  }
                />
                <Route path="/tech-sheets" element={<TechSheetsDisplay />} />
                <Route path="/people" element={<PeopleDisplay />} />
                <Route path="/material" element={<MaterialDisplay />} />
              </Routes>
            </Suspense>
          </main>


          <footer className="bg-white dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
            <span>© {new Date().getFullYear()} (Pëp) Gestor de Esdeveniments i Personal V1.0.0. Llicència MIT (codi lliure). </span>
            <span>Si vols col·laborar, pots fer-ho al <a href="https://github.com/Pepelocotango/Gestor-Events_i_Personal" target="_blank" rel="noopener noreferrer" className="underline">projecte de GitHub</a> o amb una aportació a <a href="https://paypal.me/RosePep" target="_blank" rel="noopener noreferrer" className="underline">PayPal</a>.</span>
          </footer>

          <Modal
            isOpen={modalState.type !== null}
            onClose={closeModal}
            title={getModalTitle()}
            size={getModalSize()}
          >
            <Suspense fallback={<div className="p-8 text-center">Carregant...</div>}>
              {renderModalContent()}
            </Suspense>
          </Modal>

          {toastState && <Toast toast={toastState} />}

          <Suspense fallback={<div></div>}>
            <SyncProgressOverlay progress={syncProgress} />
          </Suspense>

          {isLoadingOverlayVisible && !syncProgress.visible && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col justify-center items-center z-[9998]" aria-live="assertive" role="alert">
              <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white text-lg">{loadingOverlayMessage || "Processant..."}</p>
            </div>
          )}
        </div>
      </HashRouter>
    </EventDataProvider>
  );
};

export default App;