import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
import logger from './utils/logger';
import { THEME_STORAGE_KEY } from './constants';
import Modal from './components/ui/Modal';
import { ShowToastFunction, PersonGroup, MaterialItem } from './types';
import { useModalStore } from './stores/modalStore';
import { useEventDataStore } from './stores/eventDataStore';
import ErrorBoundary from './components/ErrorBoundary';

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
  
  const [showSplash, setShowSplash] = useState(true);
  const [splashScreenEnabled, setSplashScreenEnabled] = useState(true);
  const [splashConfigLoaded, setSplashConfigLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  const { isOpen, type, data, closeModal, openModal: openModalFromStore } = useModalStore();
  const {
    loadData: loadDataFromManager,
    exportData: exportDataFromManager,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    syncWithGoogle,
    isSyncing,
    undo,
    redo,
    canUndo,
    canRedo,
    getPersonGroupById,
    deleteEventFrame,
    deleteAssignment,
    mergePeopleGroups,
    addMaterialItemsFromFile,
    replacePeopleGroups,
    replaceMaterialItems,
  } = useEventDataStore.getState();

  const [toastState, setToastState] = useState<ToastState | null>(null);
  const [currentDataPath, setCurrentDataPath] = useState<string>('Cap fitxer carregat.');
  const [currentFilterHighlight, setCurrentFilterHighlight] = useState<string>('');
  const [initialLoadAttempted, setInitialLoadAttempted] = useState<boolean>(false);
  const [filterToShowEventFrameId, setFilterToShowEventFrameId] = useState<string | null>(null);

  const controlsRef = useRef<any>(null);
  const mainDisplayRef = useRef<{ exportCurrentViewToCsv: () => void; handleResize: () => void; }>(null);

  const clearToastMessage = (toastId: string) => {
    setToastState(prevState => (prevState?.id === toastId ? null : prevState));
  };
  
  const showToast: ShowToastFunction = useCallback((message, type = 'success', persistent = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastState({ id, message, type: type || 'success', persistent });
    if (!persistent) {
      setTimeout(() => clearToastMessage(id), 2000);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 12500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
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

  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  
  logger.info('App.tsx - Component renderitzat.');

  const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState(false);
  const [loadingOverlayMessage, setLoadingOverlayMessage] = useState('');

  useEffect(() => {
    if (isSyncing && !useEventDataStore.getState().syncProgress.visible) {
      setLoadingOverlayMessage('Sincronitzant amb Google Calendar...');
      setIsLoadingOverlayVisible(true);
    } else if (!isSyncing && !useEventDataStore.getState().syncProgress.visible) {
      setIsLoadingOverlayVisible(false);
      setLoadingOverlayMessage('');
    }
  }, [isSyncing]);

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
    if (isOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    return () => {
      body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
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

  useEffect(() => {
    const attemptInitialLoad = async () => {
      logger.info('[Startup] App.tsx: Executant useEffect d\'inicialització de dades.');
      if (window.electronAPI && typeof window.electronAPI.loadAppData === 'function') {
        try {
          logger.info("[Startup] App.tsx: Cridant a window.electronAPI.loadAppData().");
          const data = await window.electronAPI.loadAppData();
          logger.info("[Startup] App.tsx: Dades rebudes del backend. Cridant a loadDataFromManager.");
          loadDataFromManager(data, showToast);
          setHasUnsavedChanges(false);
          if (data) {
            showToast('Dades de l\'aplicació carregades automàticament.', 'info');
          } else {
            showToast('No s\'han trobat dades anteriors de l\'aplicació per carregar (Electron). Començant buit.', 'info');
          }
        } catch (error) {
          console.error('Error carregant dades de l\'aplicació via Electron:', error);
          showToast(`Error carregant dades (Electron): ${(error as Error).message}`, 'error');
          loadDataFromManager(null, showToast);
          setHasUnsavedChanges(false);
        }
        if (window.electronAPI?.getDefaultDataPath) {
          try {
            const path = await window.electronAPI.getDefaultDataPath();
            setCurrentDataPath(path);
          } catch (e) {
            setCurrentDataPath('Ruta del fitxer per defecte no disponible.');
          }
        }
        if (window.electronAPI?.getSessionData) {
            const sessionData = await window.electronAPI.getSessionData();
            setSplashScreenEnabled(sessionData.splashScreenEnabled !== false);
            setSplashConfigLoaded(true);
        } else {
            setSplashConfigLoaded(true);
        }
      } else {
        console.log("Mode navegador detectat o API d'Electron no disponible. Començant buit.");
        loadDataFromManager(null, showToast);
        setHasUnsavedChanges(false);
        setSplashConfigLoaded(true);
      }
      setInitialLoadAttempted(true);
      logger.info('[Startup] App.tsx: Marcat initialLoadAttempted com a true.');
    };

    if (!initialLoadAttempted) {
      logger.info('[Startup] App.tsx: Primer render, cridant a attemptInitialLoad.');
      attemptInitialLoad();
    }
  }, [initialLoadAttempted, loadDataFromManager, showToast, setHasUnsavedChanges]);

  useEffect(() => {
    if (window.electronAPI?.onConfirmQuit) {
      const handleQuit = async () => {
        logger.info("Renderer va rebre el senyal 'confirm-quit-signal'");
        try {
          if (hasUnsavedChangesRef.current) {
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
      window.electronAPI.onConfirmQuit(handleQuit);
    }
  }, [exportDataFromManager]);

  useEffect(() => {
    logger.info('[Startup] App.tsx: Configurant listeners per a l\'autenticació de Google.');
    if (window.electronAPI) {
      const onSuccess = () => showToast('Connectat a Google Calendar amb èxit!', 'success');
      const onError = (message: string) => showToast(`Error d'autenticació: ${message}`, 'error');
      window.electronAPI.onGoogleAuthSuccess(onSuccess);
      window.electronAPI.onGoogleAuthError(onError);
      return () => {
        logger.info('[Cleanup] App.tsx: Netejant listeners d\'autenticació de Google.');
        if (ipcRenderer) {
          ipcRenderer.removeListener('google-auth-success', onSuccess);
          ipcRenderer.removeListener('google-auth-error', onError);
        }
      };
    }
  }, [showToast]);

  useEffect(() => {
    if (toastState) {
      mainDisplayRef.current?.handleResize();
    }
  }, [toastState]);

  useEffect(() => {
    logger.info('[Startup] App.tsx: Configurant listener per a les accions del menú.');
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onMenuAction((action) => {
        logger.info(`[Menu] Acció rebuda: ${action}`);
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
            openModalFromStore('googleSettings');
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
  }, [syncWithGoogle, openModalFromStore, toggleTheme, undo, redo, canUndo, canRedo]);

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

  const handleExportCurrentViewToCsv = (csvContent: string, fileName: string) => {
    if (!csvContent) {
      showToast("No hi ha dades a la vista actual per exportar.", 'info');
      return;
    }
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
    if (!type) return null;
    switch (type) {
      case 'addEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} />;
      case 'editEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} eventFrameToEdit={data!.eventFrameToEdit} />;
      case 'addAssignment':
        return <AssignmentFormModal onClose={closeModal} eventFrame={data!.eventFrame!} showToast={showToast} setExpandedEventFrameId={setFilterToShowEventFrameId} />;
      case 'editAssignment':
        return <AssignmentFormModal onClose={closeModal} eventFrame={data!.eventFrame!} assignmentToEdit={data!.assignmentToEdit} showToast={showToast} setExpandedEventFrameId={setFilterToShowEventFrameId} />;
      
      case 'eventFrameDetails':
        return <EventFrameDetailsModal onClose={closeModal} eventFrame={data!.eventFrame!} showToast={showToast} onShowOnList={handleShowOnList}/>;
      case 'confirmHardReset':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType={data!.itemType!}
                  itemName={data!.itemName!}
                  onConfirm={data!.onConfirmSpecial!}
                  showToast={showToast}
                  titleOverride={data!.titleOverride}
                  confirmButtonText={data!.confirmButtonText}
                  cancelButtonText={data!.cancelButtonText}
                  requiresInput={data!.requiresInput}
                />;
      case 'confirmDeleteEventFrame':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Marc d'Esdeveniment"
                  itemName={data!.itemName!}
                  onConfirm={() => {
                    deleteEventFrame(data!.itemId!);
                  }}
                  showToast={showToast}
                />;
                
      case 'confirmDeleteAssignment':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Assignació"
                  itemName={data!.itemName!}
                  onConfirm={() => {
                    deleteAssignment(data!.eventFrameId!, data!.assignmentId!);
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
                  onConfirm={data!.onConfirmSync!}
                  managedCalendars={data!.managedCalendars!}
                  activeCalendarId={data!.activeCalendarId!}
                />;
      case 'mergeOrReplace':
        return (
          <MergeOrReplaceModal
            isOpen={true}
            onClose={closeModal}
            itemType={data!.itemType!}
            onMerge={() => {
              if (data?.itemType === 'persones' && data.newData) {
                mergePeopleGroups(data.newData as PersonGroup[], showToast);
              } else if (data?.itemType === 'material' && data.newData) {
                addMaterialItemsFromFile(data.newData as MaterialItem[], showToast);
              }
              closeModal();
            }}
            onReplace={() => {
              if (data?.itemType === 'persones' && data.newData) {
                replacePeopleGroups(data.newData as PersonGroup[]);
              } else if (data?.itemType === 'material' && data.newData) {
                replaceMaterialItems(data.newData as MaterialItem[]);
              }
              closeModal();
            }}
          />
        );
      case 'updateFromAssignments':
        return <UpdateFromAssignmentsModal
                  onClose={closeModal}
                  onConfirm={data!.onConfirm!}
                  toAdd={data!.toAdd || []}
                  toRemove={data!.toRemove || []}
                  toUpdate={data!.toUpdate || []}
                  getPersonGroupById={getPersonGroupById}
                />;
      case 'confirmDuplicate':
        return <ConfirmDuplicateModal
                  onClose={closeModal}
                  onConfirm={() => {
                    if (data?.onConfirm) {
                      (data.onConfirm as () => void)();
                    }
                    closeModal();
                  }}
                  message={data?.message || ''}
                />;
      default:
        return null;
    }
  };

  const getModalTitle = (): string => {
    if (!type) return '';
    if (type === 'confirmDeleteEventFrame' && data?.titleOverride) {
        return data.titleOverride;
    }
    switch (type) {
      case 'addEventFrame': return "Afegir Nou Marc d'Esdeveniment";
      case 'editEventFrame': return "Editar Marc d'Esdeveniment";
      case 'addAssignment': return `Nova Assignació per a: ${data?.eventFrame?.name || ''}`;
      case 'editAssignment': return `Editar Assignació per a: ${data?.eventFrame?.name || ''}`;
      case 'selectSyncCalendar': return "Seleccionar Calendari per Sincronitzar";
      case 'createAppCalendar': return "Crear Nou Calendari de l'App";
      case 'confirmDuplicate': return "Conflicte d'Assignació Detectat";
      
      case 'eventFrameDetails': return `Detalls de: ${data?.eventFrame?.name || ''}`;
      case 'confirmHardReset':
      case 'confirmDeleteEventFrame':
      case 'confirmDeleteAssignment':
        return "Confirmar Eliminació";
      case 'updateFromAssignments': return "Actualitzar Personal des d'Assignacions";
      default: return "Diàleg";
    }
  };

  const getModalSize = (): 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' => {
    if (!type) return 'xl';
    switch (type) {
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

  const handleToggleSplashScreen = async () => {
    const newValue = !splashScreenEnabled;
    setSplashScreenEnabled(newValue);
    if (window.electronAPI?.saveSessionData) {
      await window.electronAPI.saveSessionData('splashScreenEnabled', newValue);
    }
  };

  return (
      <HashRouter>
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {splashConfigLoaded && splashScreenEnabled && showSplash && <SplashScreen />}
            <header className="sticky top-0 z-40 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
            <CustomMenuBar
              canUndo={canUndo}
              canRedo={canRedo}
              splashScreenEnabled={splashScreenEnabled}
              onToggleSplashScreen={handleToggleSplashScreen}
            />
            <div className="container mx-auto p-2">
              <Suspense fallback={<div className="text-center p-4">Carregant controls...</div>}>
                <Controls
                  ref={controlsRef}
                  mainDisplayRef={mainDisplayRef}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  showToast={showToast}
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
                      setToastMessage={showToast}
                      currentFilterHighlight={currentFilterHighlight}
                      setCurrentFilterHighlight={setCurrentFilterHighlight}
                      filterToShowEventFrameId={filterToShowEventFrameId}
                      setFilterToShowEventFrameId={setFilterToShowEventFrameId}
                      onExportCurrentViewToCsv={handleExportCurrentViewToCsv}
                    />
                  }
                />
                <Route path="/tech-sheets" element={<TechSheetsDisplay showToast={showToast} />} />
                <Route path="/people" element={<PeopleDisplay showToast={showToast} />} />
                <Route path="/material" element={<MaterialDisplay showToast={showToast} />} />
              </Routes>
            </Suspense>
          </main>

          <footer className="bg-white dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
            <span>© {new Date().getFullYear()} (Pëp) Gestor de Esdeveniments i Personal V1.0.0. Llicència MIT (codi lliure). </span>
            <span>Si vols col·laborar, pots fer-ho al <a href="https://github.com/Pepelocotango/Gestor-Events_i_Personal" target="_blank" rel="noopener noreferrer" className="underline">projecte de GitHub</a> o amb una aportació a <a href="https://paypal.me/RosePep" target="_blank" rel="noopener noreferrer" className="underline">PayPal</a>.</span>
          </footer>

          <Modal
            isOpen={isOpen}
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
            <SyncProgressOverlay progress={useEventDataStore.getState().syncProgress} />
          </Suspense>

          {isLoadingOverlayVisible && !useEventDataStore.getState().syncProgress.visible && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col justify-center items-center z-[9998]" aria-live="assertive" role="alert">
              <svg className="animate-spin h-10 w-10 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white text-lg">{loadingOverlayMessage || "Processant..."}</p>
            </div>
          )}
          </div>
        </ErrorBoundary>
      </HashRouter>
  );
};

export default App;