import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };
import logger from './utils/logger';
import { THEME_STORAGE_KEY } from './constants';
import Modal from './components/ui/Modal';
import { ShowToastFunction, PersonGroup, MaterialItem } from './types';
import { useModalStore } from './stores/modalStore';
import { useEventDataStore } from './stores/eventDataStore';
import ErrorBoundary from './components/ErrorBoundary';
import { migrateData, validateMigratedData } from './utils/dataMigration';

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
const ConfirmRepairModal = lazy(() => import('./components/modals/ConfirmRepairModal'));


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
  const { openModal: openModalFromStore, closeModal } = useModalStore.getState();
  const isOpen = useModalStore(state => state.isOpen);
  const type = useModalStore(state => state.type);
  const data = useModalStore(state => state.data);

  // --- State from Zustand Store (Reactive) ---
  // Subscribe to only the pieces of state that cause re-renders.
  const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);
  const isSyncing = useEventDataStore(state => state.isSyncing);
  const canUndo = useEventDataStore(state => state.canUndo);
  const canRedo = useEventDataStore(state => state.canRedo);
  const syncProgress = useEventDataStore(state => state.syncProgress);

  // --- Actions from Zustand Store (Non-reactive) ---
  // Actions are stable functions, so we can get them once with getState().
  // This avoids re-running useEffects that depend on them.
  const {
    loadData: loadDataFromManager,
    exportData: exportDataFromManager,
    setHasUnsavedChanges,
    undo,
    redo,
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
  const [initialLoadAttempted, setInitialLoadAttempted] = useState<boolean>(false);

  const clearToastMessage = (toastId: string) => {
    console.log(`[TOAST] Clear message with ID: ${toastId}`);
    setToastState(prevState => (prevState?.id === toastId ? null : prevState));
  };
  
  const showToast: ShowToastFunction = useCallback((message, type = 'success', persistent = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    console.log(`[TOAST] Show message: ${message}, Type: ${type}, Persistent: ${persistent}`);
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

  logger.info('App.tsx - Component renderitzat.');

  const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState(false);
  const [loadingOverlayMessage, setLoadingOverlayMessage] = useState('');

  useEffect(() => {
    if (isSyncing && !syncProgress.visible) {
      setLoadingOverlayMessage('Sincronitzant amb Google Calendar...');
      setIsLoadingOverlayVisible(true);
    } else if (!isSyncing && !syncProgress.visible) {
      setIsLoadingOverlayVisible(false);
      setLoadingOverlayMessage('');
    }
  }, [isSyncing, syncProgress.visible]);


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

  const handleSaveData = async (type: 'all' | 'people' | 'material') => {
    try {
      let dataToSave: any;
      let filename: string;
      const fullData = await exportDataFromManager();

      switch (type) {
        case 'people':
          dataToSave = { peopleGroups: fullData.peopleGroups };
          filename = 'persones_grups_dades.json';
          break;
        case 'material':
          dataToSave = { materialItems: fullData.materialItems };
          filename = 'material_dades.json';
          break;
        case 'all':
        default:
          dataToSave = fullData;
          filename = 'gestio_esdeveniments_dades.json';
          break;
      }
      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (window.electronAPI?.showSaveDialog) {
        const result = await window.electronAPI.showSaveDialog({
          title: `Desar ${type} a JSON`,
          defaultPath: filename,
          filters: [{ name: 'JSON', extensions: ['json'] }],
          data: jsonString,
        });
        if (result.success) {
          if (type === 'all') setHasUnsavedChanges(false);
          showToast(`Dades de ${type} desades correctament.`, 'success');
        } else if (!result.canceled) {
          showToast(`Error en desar les dades: ${result.message}`, 'error');
        }
      } else {
        // Fallback for web version
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (type === 'all') setHasUnsavedChanges(false);
        showToast(`Dades de ${type} desades correctament.`, 'success');
      }
    } catch (error) {
      console.error(`Error saving ${type} data:`, error);
      showToast(`Error en desar les dades: ${(error as Error).message}`, 'error');
    }
  };

  const handleRequestHardReset = () => {
    openModalFromStore('confirmHardReset', {
      titleOverride: "Confirmar Reset de Fàbrica",
      itemType: "Reset de Fàbrica",
      itemName: "Estàs segur que vols restablir l'aplicació? S'esborraran <b>TOTES</b> les dades locals de l'aplicació (esdeveniments, persones, assignacions) i la configuració de Google. <br><br><b>Aquesta acció és irreversible.</b>",
      confirmButtonText: "Sí, Resetejar Ara",
      cancelButtonText: "Cancel·lar",
      onConfirmSpecial: async () => {
        if (window.electronAPI?.performHardReset) {
          try {
            const result = await window.electronAPI.performHardReset();
              if (result.success) {
                loadDataFromManager(null, showToast);
                setHasUnsavedChanges(false);
                showToast("L'aplicació s'ha restablert a l'estat de fàbrica.", 'success', true);
              } else {
                showToast(result.message || "Error durant el reset de fàbrica.", 'error', true);
              }
          } catch (error) {
            showToast(`Error greu durant el reset de fàbrica: ${(error as Error).message}`, 'error', true);
          }
        } else {
          showToast("La funcionalitat de reset no està disponible.", 'error');
        }
      },
    });
  };

  const handleConnectGoogle = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.startGoogleAuth();
      if (result.success) {
        showToast('Obrint el navegador per autenticar-se amb Google...', 'info');
      } else {
        showToast(result.message || 'No s\'ha pogut iniciar l\'autenticació.', 'error');
      }
    } else {
      showToast('Aquesta funcionalitat només està disponible a l\'aplicació d\'escriptori.', 'warning');
    }
  };

  useEffect(() => {
    const attemptInitialLoad = async () => {
      const { loadData, _applyDataToState, clearDataRepairInfo, setHasUnsavedChanges } = useEventDataStore.getState();
      const { openModal, closeModal } = useModalStore.getState();

      logger.info('[Startup] App.tsx: Executant useEffect d\'inicialització de dades.');
      if (window.electronAPI && typeof window.electronAPI.loadAppData === 'function') {
        try {
          logger.info("[Startup] App.tsx: Cridant a window.electronAPI.loadAppData().");
          const data = await window.electronAPI.loadAppData();
          logger.info("[Startup] App.tsx: Dades rebudes del backend. Cridant a loadDataFromManager.");
          const result = await loadData(data);

          if (result.status === 'ok' && result.message) {
            showToast(result.message, result.type);
          } else if (result.status === 'needs_confirmation') {
            const dataRepairInfo = useEventDataStore.getState().dataRepairInfo;
            if (dataRepairInfo) {
                openModal('confirmDataRepair', {
                    onConfirm: () => {
                        _applyDataToState(dataRepairInfo.repairedData);
                        showToast("Dades reparades i carregades.", 'success');
                        closeModal();
                        clearDataRepairInfo();
                    },
                    onCancel: () => {
                        closeModal();
                        clearDataRepairInfo();
                    },
                    fixes: result.fixes,
                });
            }
          } else if (result.status === 'error' && result.message) {
            showToast(result.message, result.type);
          }
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Error carregant dades de l\'aplicació via Electron:', error);
          showToast(`Error carregant dades (Electron): ${(error as Error).message}`, 'error');
          await loadData(null);
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
        await loadData(null);
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
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onConfirmQuit) {
      const handleQuit = async () => {
        logger.info("Renderer va rebre el senyal 'confirm-quit-signal'");
        try {
          if (hasUnsavedChanges) {
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
  }, [exportDataFromManager, hasUnsavedChanges]);

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

  const processAllData = async (fileContent: string, fileName: string) => {
    try {
      if (!fileContent) {
        showToast("Error: El contingut del fitxer està buit.", 'error');
        return;
      }
      const jsonData = JSON.parse(fileContent);
      let dataToLoad = null;
      let isMigrated = false;

      if (jsonData.eventFrames && jsonData.peopleGroups && jsonData.assignments !== undefined) {
        dataToLoad = jsonData;
      } else if (jsonData.eventFrames || jsonData.people || jsonData.assignments) {
        const migratedData = migrateData(
          { people: jsonData.people || [] },
          { eventFrames: jsonData.eventFrames || [] },
          { assignments: jsonData.assignments || [] }
        );
        const validation = validateMigratedData(migratedData);
        if (!validation.isValid) {
          showToast(`Error en la migració de dades: ${validation.errors.join(', ')}`, 'error');
          return;
        }
        dataToLoad = migratedData;
        isMigrated = true;
      } else {
        showToast("Error: El format del fitxer JSON no és vàlid.", 'error');
        return;
      }

      if (dataToLoad) {
        const result = await loadDataFromManager(dataToLoad);
        if (result.status === 'ok') {
          const message = isMigrated ? "Dades antigues migrades i carregades correctament." : "Totes les dades carregades correctament.";
          showToast(message, 'success');
          setHasUnsavedChanges(true);
          setCurrentDataPath(fileName);
        } else if (result.status === 'error') {
          showToast(result.message || 'Error desconegut durant la càrrega.', result.type || 'error');
        }
        // El cas 'needs_confirmation' ja el gestiona el listener de l'efecte inicial, si s'escau
      }
    } catch (error) {
      showToast(`Error en processar les dades: ${(error as Error).message}`, 'error');
    }
  };

  const processMaterialData = (fileContent: string) => {
    try {
      const jsonData = JSON.parse(fileContent);
      if (Array.isArray(jsonData.materialItems)) {
        openModalFromStore('mergeOrReplace', {
          itemType: 'material',
          newData: jsonData.materialItems,
        });
      } else {
        showToast("Error: El fitxer JSON de material ha de contenir un array anomenat 'materialItems'.", 'error');
      }
    } catch (error) {
      showToast(`Error en processar el fitxer de material: ${(error as Error).message}`, 'error');
    }
  };

  const processPeopleData = (fileContent: string) => {
    try {
      if (!fileContent) {
        showToast("Error: El fitxer de persones està buit.", 'error');
        return;
      }
      const jsonData = JSON.parse(fileContent);
      let newPeople: PersonGroup[] = [];
      if (Array.isArray(jsonData.peopleGroups)) {
        newPeople = jsonData.peopleGroups;
      } else if (Array.isArray(jsonData.people)) {
        const migratedData = migrateData({ people: jsonData.people });
        const validation = validateMigratedData(migratedData);
        if (!validation.isValid) {
          showToast(`Error en la migració de dades: ${validation.errors.join(', ')}`, 'error');
          return;
        }
        newPeople = migratedData.peopleGroups;
      } else {
        showToast("Error: El format del fitxer JSON de persones no és vàlid.", 'error');
        return;
      }

      openModalFromStore('mergeOrReplace', {
        itemType: 'persones',
        newData: newPeople,
      });

    } catch (error) {
      showToast(`Error en carregar les dades de persones: ${(error as Error).message}`, 'error');
    }
  };

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
            handleSaveData('all');
            break;
          case 'hard-reset':
            handleRequestHardReset();
            break;
          case 'save-people':
            handleSaveData('people');
            break;
          case 'save-material':
            handleSaveData('material');
            break;
          case 'sync-google':
            const handleSync = async () => {
              if (!window.electronAPI?.loadGoogleConfig) return;
              const config = await window.electronAPI.loadGoogleConfig();
              if (!config || !config.managedAppCalendars || config.managedAppCalendars.length === 0) {
                  openModalFromStore('googleSettings');
                  return;
              }
              openModalFromStore('selectSyncCalendar', {
                  managedCalendars: config.managedAppCalendars,
                  activeCalendarId: config.activeAppCalendarId,
                  onConfirmSync: (targetCalendarId: string) => {
                      closeModal();
                      useEventDataStore.getState().executeSync(targetCalendarId);
                  }
              });
            };
            handleSync();
            break;
          case 'config-google':
            openModalFromStore('googleSettings');
            break;
          case 'connect-google':
            handleConnectGoogle();
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
  }, [openModalFromStore, closeModal, undo, redo, canUndo, canRedo, hasUnsavedChanges]);

  useEffect(() => {
    if (window.electronAPI?.onFileDataLoaded) {
      const cleanup = window.electronAPI.onFileDataLoaded((data) => {
        logger.info('[IPC] Dades de fitxer rebudes des del menú', { type: data.type, fileName: data.fileName });
        const { content, fileName } = data;
        if (typeof content === 'string' && typeof fileName === 'string') {
            processAllData(content, fileName);
            processMaterialData(content);
            processPeopleData(content);
          } else {
            console.error('Data content or fileName is undefined or not a string.');
          }
      });
      return cleanup;
    }
  }, []);

  const renderModalContent = () => {
    if (!type) return null;
    switch (type) {
      case 'addEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} />;
      case 'editEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} eventFrameToEdit={data!.eventFrameToEdit} />;
      case 'addAssignment':
        return <AssignmentFormModal onClose={closeModal} eventFrame={data!.eventFrame!} showToast={showToast} />;
      case 'editAssignment':
        return <AssignmentFormModal onClose={closeModal} eventFrame={data!.eventFrame!} assignmentToEdit={data!.assignmentToEdit} showToast={showToast} />;
      
      case 'eventFrameDetails':
        return <EventFrameDetailsModal onClose={closeModal} eventFrame={data!.eventFrame!} showToast={showToast} />;
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
      case 'confirmDataRepair':
          return <ConfirmRepairModal
                    isOpen={true}
                    onClose={data!.onCancel!}
                    onConfirm={data!.onConfirm!}
                    fixes={data!.fixes!}
                  />;
      case 'confirmDeleteEventFrame':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Marc d'Esdeveniment"
                  itemName={data!.itemName!}
                  onConfirm={() => {
                    if (data?.itemId) deleteEventFrame(data.itemId);
                  }}
                  showToast={showToast}
                />;
                
      case 'confirmDeleteAssignment':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType="Assignació"
                  itemName={data!.itemName!}
                  onConfirm={() => {
                    if (data?.eventFrameId && data?.assignmentId) deleteAssignment(data.eventFrameId, data.assignmentId);
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
              let result;
              if (data?.itemType === 'persones' && data.newData) {
                result = mergePeopleGroups(data.newData as PersonGroup[]);
              } else if (data?.itemType === 'material' && data.newData) {
                result = addMaterialItemsFromFile(data.newData as MaterialItem[]);
              }
              if (result) {
                showToast(result.message, result.type);
              }
              closeModal();
            }}
            onReplace={() => {
              if (data?.itemType === 'persones' && data.newData) {
                replacePeopleGroups(data.newData as PersonGroup[]);
                showToast('Llista de persones reemplaçada.', 'success');
              } else if (data?.itemType === 'material' && data.newData) {
                replaceMaterialItems(data.newData as MaterialItem[]);
                showToast('Inventari de material reemplaçat.', 'success');
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
      case 'confirmDataRepair': return "Reparació de Dades";
      
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
      case 'confirmDataRepair':
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
                      setToastMessage={showToast}
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
        </ErrorBoundary>
      </HashRouter>
  );
};

export default App;