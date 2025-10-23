import { generateDefaultFileName } from './utils/dateFormat';
import { initializeGoogleAuthListeners } from './stores/googleConfigStore';
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import logger from './utils/logger';
import { THEME_STORAGE_KEY } from './constants';
import Modal from './components/ui/Modal';
import { ShowToastFunction, PersonGroup, MaterialItem } from './types';
import { useModalStore } from './stores/modalStore';
import { useEventDataStore } from './stores/eventDataStore';
import { useStore } from 'zustand';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { notificationService } from './utils/notificationService';

const MainDisplay = lazy(() => import('./components/MainDisplay'));
const Controls = lazy(() => import('./components/Controls'));
const Navigation = lazy(() => import('./components/Navigation'));
const TechSheetsDisplay = lazy(() => import('./components/TechSheetsDisplay'));
const SyncProgressOverlay = lazy(() => import('./components/ui/SyncProgressOverlay'));
import CustomMenuBar from './components/ui/CustomMenuBar';
import SplashScreen from './components/ui/SplashScreen';
import WelcomeScreen from './components/ui/WelcomeScreen';

const PeopleDisplay = lazy(() => import('./components/PeopleDisplay'));
const MaterialDisplay = lazy(() => import('./components/MaterialDisplay'));

const EventFrameFormModal = lazy(() => import('./components/modals/EventFrameFormModal'));
const AssignmentFormModal = lazy(() => import('./components/modals/AssignmentFormModal'));
const AddMaterialFromTechSheetModal = lazy(() => import('./components/modals/AddMaterialFromTechSheetModal'));

const ConfirmDeleteModal = lazy(() => import('./components/modals/ConfirmDeleteModal'));
const ConfirmDuplicateModal = lazy(() => import('./components/modals/ConfirmDuplicateModal'));
const EventFrameDetailsModal = lazy(() => import('./components/modals/EventFrameDetailsModal'));
const GoogleSettingsModal = lazy(() => import('./components/modals/GoogleSettingsModal'));
const MergeOrReplaceModal = lazy(() => import('./components/modals/MergeOrReplaceModal'));
const SelectSyncCalendarModal = lazy(() => import('./components/modals/SelectSyncCalendarModal'));
const CreateCalendarModal = lazy(() => import('./components/modals/CreateCalendarModal'));
const UpdateFromAssignmentsModal = lazy(() => import('./components/modals/UpdateFromAssignmentsModal'));
const ConfirmRepairModal = lazy(() => import('./components/modals/ConfirmRepairModal'));
const HistoryModal = lazy(() => import('./components/modals/HistoryModal'));
const GoogleEventDetailsModal = lazy(() => import('./components/modals/GoogleEventDetailsModal'));


import { useRef } from 'react';

let globalInitialLoadAttempted = false;

const App: React.FC = () => {
  const mainDisplayRef = useRef<{ resize: () => void }>(null);
  
  const [showSplash, setShowSplash] = useState(true);
  const [splashScreenEnabled, setSplashScreenEnabled] = useState(true);
  const [splashConfigLoaded, setSplashConfigLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  const [isDocumentOpen, setIsDocumentOpen] = useState<boolean>(false);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const { openModal: openModalFromStore, closeModal } = useModalStore.getState();
  const isOpen = useModalStore(state => state.isOpen);
  const type = useModalStore(state => state.type);
  const data = useModalStore(state => state.data);

  // --- State from Zustand Store (Reactive) ---
  // Subscribe to only the pieces of state that cause re-renders.
  const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);

  // Ref to track the latest state of hasUnsavedChanges to avoid stale state in listeners.
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const isSyncing = useEventDataStore(state => state.isSyncing);
  const isUpdatingMaterial = useEventDataStore(state => state.isUpdatingMaterial);
  const syncProgress = useEventDataStore(state => state.syncProgress);
  const canUndo = useStore(useEventDataStore.temporal, state => state.pastStates.length > 0);
  const canRedo = useStore(useEventDataStore.temporal, state => state.futureStates.length > 0);

  // --- Actions from Zustand Store (Non-reactive) ---
  // Actions are stable functions, so we can get them once with getState().
  // This avoids re-running useEffects that depend on them.
  const {
    loadData: loadDataFromManager,
    exportData: exportDataFromManager,
    setHasUnsavedChanges,
    getPersonGroupById,
    deleteEventFrame,
    deleteAssignment,
    mergePeopleGroups,
    addMaterialItemsFromFile,
    replacePeopleGroups,
    replaceMaterialItems,
    loadGoogleConfigFromDataFile,
  } = useEventDataStore.getState();

  const showToast: ShowToastFunction = useCallback((message, type = 'success') => {
    switch (type) {
      case 'success':
        notificationService.success(message);
        break;
      case 'error':
        notificationService.error(message);
        break;
      case 'info':
        notificationService.info(message);
        break;
      case 'warning':
        notificationService.warning(message);
        break;
      default:
        notificationService.success(message);
    }
  }, []);

  useEffect(() => {
    // Inicialitza els listeners de la store de Google un sol cop
    initializeGoogleAuthListeners();
  }, []);




  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 12500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const { undoWithToast, redoWithToast } = useEventDataStore.getState();
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }
        if (event.ctrlKey || event.metaKey) {
            if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoWithToast();
            } else if (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z')) {
                event.preventDefault();
                redoWithToast();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // --- Document Management ---

  const handleSaveAsDocument = async (): Promise<boolean> => {
    if (!window.electronAPI) {
      showToast('Aquesta funció només està disponible a l\'aplicació d\'escriptori.', 'warning');
      return false;
    }
    try {
        const dataToSave = await exportDataFromManager();
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const fileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'document.json';

        const result = await window.electronAPI.showSaveDialog({
            title: 'Guardar com...',
            defaultPath: fileName || 'document.json',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            data: jsonString,
        });

        if (result.success && result.filePath) {
            setHasUnsavedChanges(false);
            setCurrentFilePath(result.filePath);
            const recentFilesResult = await window.electronAPI.addRecentFile(result.filePath);
            if(recentFilesResult.success) {
                setRecentFiles(recentFilesResult.recentFiles);
            }
            showToast('Document desat correctament.', 'success');
            return true;
        } else if (!result.canceled) {
            showToast(`Error en desar: ${result.message}`, 'error');
        }
    } catch (error) {
        showToast(`Error en desar: ${(error as Error).message}`, 'error');
    }
    return false;
};

const handleSaveDocument = async (): Promise<boolean> => {
    if (!currentFilePath) {
        return handleSaveAsDocument();
    }
    if (!window.electronAPI) {
      showToast('Aquesta funció només està disponible a l\'aplicació d\'escriptori.', 'warning');
      return false;
    }
    try {
        const dataToSave = await exportDataFromManager();
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const result = await window.electronAPI.saveFile({
            filePath: currentFilePath,
            data: jsonString,
        });

        if (result.success) {
            setHasUnsavedChanges(false);
            showToast('Document desat.', 'success');
            return true;
        } else {
            showToast(`Error en desar: ${result.message}`, 'error');
        }
    } catch (error) {
        showToast(`Error en desar: ${(error as Error).message}`, 'error');
    }
    return false;
};

  const confirmContinueWithUnsavedChanges = async (): Promise<boolean> => {
    if (!hasUnsavedChangesRef.current) {
        return true; // No unsaved changes, can continue
    }

    if (window.electronAPI?.showUnsavedChangesDialog) {
        const message = 'Teniu canvis sense desar. Voleu desar-los abans de continuar?';
        const buttons = ['Desa', 'No desis', 'Cancel·la'];

        const { response } = await window.electronAPI.showUnsavedChangesDialog({ message, buttons });
        // 0: Desa, 1: No desis, 2: Cancel·la
        switch (response) {
            case 0: // Desa
                const saved = await handleSaveDocument();
                return saved;
            case 1: // No desis
                return true;
            case 2: // Cancel·la
            default:
                return false;
        }
    }
    // Fallback for web or if API is not available
    return confirm('You have unsaved changes. Are you sure you want to continue?');
  };

  const handleNewDocument = async () => {
      const canContinue = await confirmContinueWithUnsavedChanges();
      if (!canContinue) return;

      loadDataFromManager(null);
      setCurrentFilePath(null);
      setIsDocumentOpen(true);
      setHasUnsavedChanges(false);
      showToast('Nou espai de treball creat.', 'success');
  };

  const handleOpenDocument = async (filePathToOpen?: string) => {
    const canContinue = await confirmContinueWithUnsavedChanges();
    if (!canContinue) return;

    let filePath = filePathToOpen;
    if (!filePath && window.electronAPI) {
        const dialogResult = await window.electronAPI.openFileDialog();
        if (!dialogResult.success || !dialogResult.filePath) {
            return; // User cancelled or error
        }
        filePath = dialogResult.filePath;
    }

    if (!filePath) {
        showToast('Aquesta funció només està disponible a l\'aplicació d\'escriptori.', 'warning');
        return;
    }

    try {
        if (window.electronAPI) {
            const fileReadResult = await window.electronAPI.readFile(filePath);
            if (!fileReadResult.success || typeof fileReadResult.content !== 'string') {
                showToast(`Error en llegir el fitxer: ${fileReadResult.message}`, 'error');
                return;
            }


            const data = JSON.parse(fileReadResult.content);
            const loadResult = await loadDataFromManager(data);

            if (loadResult.status === 'error') {
                showToast(loadResult.message || 'Hi ha hagut un error en carregar les dades.', 'error');
                return;
            }

            if (data.googleConfig) {
                logger.info("Trobada configuració de Google al fitxer, restaurant-la...");
                await loadGoogleConfigFromDataFile(data);
            }

            setCurrentFilePath(filePath);
            setIsDocumentOpen(true);
            const recentFilesResult = await window.electronAPI.addRecentFile(filePath);
            if(recentFilesResult.success) {
                setRecentFiles(recentFilesResult.recentFiles);
            }

            const fileName = filePath.split(/[/\\]/).pop() || filePath;
            showToast(`Document "${fileName}" carregat.`, 'success');
        }
    } catch (error) {
        showToast(`Error en processar el fitxer: ${(error as Error).message}`, 'error');
    }
  };

  const handleOpenRecent = (filePath: string) => {
    handleOpenDocument(filePath);
  };

  const handleExportData = async (type: 'people' | 'material') => {
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
      }
      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (window.electronAPI?.showSaveDialog) {
        const result = await window.electronAPI.showSaveDialog({
          title: `Exportar ${type} a JSON`,
          defaultPath: filename,
          filters: [{ name: 'JSON', extensions: ['json'] }],
          data: jsonString,
        });
        if (result.success) {
          showToast(`Dades de ${type} exportades correctament.`, 'success');
        } else if (!result.canceled) {
          showToast(`Error en exportar les dades: ${result.message}`, 'error');
        }
      }
    } catch (error) {
      showToast(`Error en exportar les dades: ${(error as Error).message}`, 'error');
    }
  };

  const handleImportPeople = async () => {
    if (!window.electronAPI) {
      showToast('Aquesta funció només està disponible a l\'aplicació d\'escriptori.', 'warning');
      return;
    }
    const dialogResult = await window.electronAPI.openFileDialog();
    if (!dialogResult.success || !dialogResult.filePath) return;

    const fileReadResult = await window.electronAPI.readFile(dialogResult.filePath);
    if (!fileReadResult.success || typeof fileReadResult.content !== 'string') {
        showToast(`Error en llegir el fitxer: ${fileReadResult.message}`, 'error');
        return;
    }

    try {
        const jsonData = JSON.parse(fileReadResult.content);
        let newPeople: PersonGroup[] = [];
        if (Array.isArray(jsonData.peopleGroups)) {
            newPeople = jsonData.peopleGroups;
        } else {
            showToast("Error: El format del fitxer JSON de persones no és vàlid.", 'error');
            return;
        }
        openModalFromStore('mergeOrReplace', { itemType: 'persones', newData: newPeople });
    } catch (error) {
        showToast(`Error en processar el fitxer de persones: ${(error as Error).message}`, 'error');
    }
  };

  const handleImportMaterial = async () => {
    if (!window.electronAPI) {
      showToast('Aquesta funció només està disponible a l\'aplicació d\'escriptori.', 'warning');
      return;
    }
    const dialogResult = await window.electronAPI.openFileDialog();
    if (!dialogResult.success || !dialogResult.filePath) return;

    const fileReadResult = await window.electronAPI.readFile(dialogResult.filePath);
    if (!fileReadResult.success || typeof fileReadResult.content !== 'string') {
        showToast(`Error en llegir el fitxer: ${fileReadResult.message}`, 'error');
        return;
    }

    try {
      const jsonData = JSON.parse(fileReadResult.content);
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

  const handleFactoryReset = () => {
    openModalFromStore('confirmHardReset', {
      titleOverride: "Restaurar Configuració de Fàbrica",
      itemName: "Estàs segur que vols restaurar la configuració de fàbrica? Aquesta acció esborrarà la teva connexió amb Google i la llista de fitxers recents. Els teus documents desats no seran afectats. Aquesta acció és irreversible.",
      confirmButtonText: "Sí, Restaurar",
      cancelButtonText: "Cancel·lar",
      onConfirmSpecial: async () => {
        if (window.electronAPI?.factoryReset) {
          try {
            const result = await window.electronAPI.factoryReset();
              if (result.success) {
                showToast("Configuració restaurada. L'aplicació es reiniciarà.", 'success');
                setTimeout(() => window.location.reload(), 2000);
              } else {
                showToast(result.message || "Error durant la restauració.", 'error');
              }
          } catch (error) {
            showToast(`Error greu durant la restauració: ${(error as Error).message}`, 'error');
          }
        } else {
          showToast("La funcionalitat de restauració no està disponible.", 'error');
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
    const initializeApp = async () => {
        logger.info('[Startup] App.tsx: Iniciant la càrrega de la sessió.');
        if (window.electronAPI) {
            if (window.electronAPI.getRecentFiles) {
                const files = await window.electronAPI.getRecentFiles();
                setRecentFiles(files);
                logger.info('[Startup] Fitxers recents carregats:', files);
            }
            if (window.electronAPI.getSessionData) {
                const sessionData = await window.electronAPI.getSessionData();
                setSplashScreenEnabled(sessionData.splashScreenEnabled !== false);
                logger.info('[Startup] Configuració del splash screen carregada.');
            }
        }
        setSplashConfigLoaded(true);
        globalInitialLoadAttempted = true;
        logger.info('[Startup] App.tsx: Marcat initialLoadAttempted com a true.');
    };

    if (!globalInitialLoadAttempted) {
        logger.info('[Startup] App.tsx: Primer render, cridant a initializeApp.');
        initializeApp();
    }
  }, []);

  // Lògica de sortida refactoritzada per eliminar el backup de sessió.
  // El tancament ara és gestionat per un IPC handler simple que no crea backups.
  const quitLogicRef = useRef<() => Promise<void>>();
  useEffect(() => {
    quitLogicRef.current = async () => {
      logger.info("[Exit Flow] Executant la lògica de sortida refactoritzada.");

      const quitApp = () => {
        if (window.electronAPI?.quitApplication) {
          window.electronAPI.quitApplication();
        }
      };

      if (hasUnsavedChangesRef.current) {
        // Cas 1: Hi ha canvis no desats
        if (window.electronAPI?.showUnsavedChangesDialog) {
          const fileName = currentFilePath
            ? currentFilePath.split(/[/\\]/).pop()
            : generateDefaultFileName();

          const message = `Vols desar els canvis fets a '${fileName}'?`;
          const buttons = ['Desa', 'Tanca sense desar', 'Cancel·la'];
          const { response } = await window.electronAPI.showUnsavedChangesDialog({ message, buttons });

          switch (response) {
            case 0: // Desa
              if (await handleSaveDocument()) {
                quitApp();
              } else {
                showToast("El desat ha fallat o ha estat cancel·lat. La sortida s'ha avortat.", "warning");
              }
              break;
            case 1: // Tanca sense desar
              quitApp();
              break;
            case 2: // Cancel·la
            default:
              logger.info("Sortida cancel·lada per l'usuari.");
              break;
          }
        }
      } else {
        // Cas 2: No hi ha canvis, però igualment es demana confirmació
        if (window.electronAPI?.showUnsavedChangesDialog) {
          const { response } = await window.electronAPI.showUnsavedChangesDialog({
            message: 'Estàs segur que vols sortir de l\'aplicació?',
            buttons: ['Sortir', 'Cancel·lar'],
          });
          if (response === 0) { // 0: Sortir
            quitApp();
          } else {
            logger.info("Sortida cancel·lada per l'usuari.");
          }
        }
      }
    };
  });

  // El listener de 'confirm-quit' es registra un sol cop, garantint que no hi ha múltiples listeners.
  // Crida a la versió més recent de la lògica de sortida a través de la ref.
  useEffect(() => {
    if (window.electronAPI?.onConfirmQuit) {
      const cleanup = window.electronAPI.onConfirmQuit(() => {
        quitLogicRef.current?.();
      });

      // Neteja el listener quan el component es desmunta, per higiene.
      return cleanup;
    }
  }, []);

  useEffect(() => {
    logger.info('[Startup] App.tsx: Configurant listeners per a l\'autenticació de Google.');
    if (window.electronAPI?.onGoogleAuthSuccess && window.electronAPI?.onGoogleAuthError) {
      const onSuccess = () => showToast('Connectat a Google Calendar amb èxit!', 'success');
      const onError = (message: string) => showToast(`Error d'autenticació: ${message}`, 'error');

      const cleanupSuccess = window.electronAPI.onGoogleAuthSuccess(onSuccess);
      const cleanupError = window.electronAPI.onGoogleAuthError(onError);

      return () => {
        logger.info('[Cleanup] App.tsx: Netejant listeners d\'autenticació de Google.');
        cleanupSuccess();
        cleanupError();
      };
    }
  }, [showToast]);

  // Listener per al progrés de sincronització
  useEffect(() => {
    if (window.electronAPI?.onSyncProgress) {
      const { setSyncProgress } = useEventDataStore.getState();
      const cleanup = window.electronAPI.onSyncProgress((progress) => {
        setSyncProgress({ ...progress, visible: true });
      });
      return cleanup;
    }
  }, []);

  // Listeners per a notificacions del backend
  useEffect(() => {
    if (window.electronAPI) {
      const cleanupFunctions: (() => void)[] = [];

      // Listener per a l'aplicació que es reiniciarà després del reset
      if (window.electronAPI.onAppWillRelaunchAfterReset) {
        const cleanup = window.electronAPI.onAppWillRelaunchAfterReset(() => {
          showToast('L\'aplicació es reiniciarà després del reset...', 'info');
        });
        cleanupFunctions.push(cleanup);
      }

      // Listener per a errors de sincronització
      if (window.electronAPI.onSyncError) {
        const cleanup = window.electronAPI.onSyncError((error: string) => {
          showToast(`Error de sincronització: ${error}`, 'error');
        });
        cleanupFunctions.push(cleanup);
      }

      // Listener per a èxits de sincronització
      if (window.electronAPI.onSyncSuccess) {
        const cleanup = window.electronAPI.onSyncSuccess((message: string) => {
          showToast(message || 'Sincronització completada', 'success');
        });
        cleanupFunctions.push(cleanup);
      }

      // Listener per a notificacions generals del backend
      if (window.electronAPI.onBackendNotification) {
        const cleanup = window.electronAPI.onBackendNotification((notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => {
          showToast(notification.message, notification.type);
        });
        cleanupFunctions.push(cleanup);
      }

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }
  }, [showToast]);

  // Obsolete functions for file handling have been removed.
  // The new logic is in handleOpenDocument, handleSaveDocument, etc.

  useEffect(() => {
    logger.info('[Startup] App.tsx: Configurant listener per a les accions del menú.');
    const { undoWithToast, redoWithToast } = useEventDataStore.getState();

    if (window.electronAPI) {
      const cleanup = window.electronAPI.onMenuAction((action) => {
        logger.info(`[Menu] Acció rebuda: ${action}`);

        if (action.startsWith('open-recent:')) {
            const filePath = action.substring('open-recent:'.length);
            handleOpenDocument(filePath);
            return;
        }

        switch (action) {
          case 'undo':
            undoWithToast();
            break;
          case 'redo':
            redoWithToast();
            break;
          case 'new-document':
            handleNewDocument();
            break;
          case 'open-document':
            handleOpenDocument();
            break;
          case 'save-document':
            handleSaveDocument();
            break;
          case 'save-as-document':
            handleSaveAsDocument();
            break;
          case 'import-people':
            handleImportPeople();
            break;
          case 'export-people':
            handleExportData('people');
            break;
          case 'import-material':
            handleImportMaterial();
            break;
          case 'export-material':
            handleExportData('material');
            break;
          case 'factory-reset':
            handleFactoryReset();
            break;
          case 'sync-google':
            useEventDataStore.getState().syncWithGoogle();
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
  }, [
    openModalFromStore,
    closeModal,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    currentFilePath, // Added to deps
    isDocumentOpen,  // Added to deps
    recentFiles      // Added to deps
  ]);


  const renderModalContent = () => {
    if (!type) return null;
    switch (type) {
      case 'addEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} />;
      case 'editEventFrame':
        return <EventFrameFormModal onClose={closeModal} showToast={showToast} />;
      case 'addAssignment':
        return <AssignmentFormModal onClose={closeModal} showToast={showToast} />;
      case 'editAssignment':
        return <AssignmentFormModal onClose={closeModal} showToast={showToast} />;
      case 'addMaterialFromTechSheet':
        return <AddMaterialFromTechSheetModal />;
      
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
                  suppressSuccessToast={data?.titleOverride?.includes('Google') || data?.titleOverride?.includes('Calendari')}
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

      case 'confirmDelete':
        return <ConfirmDeleteModal
                  onClose={closeModal}
                  itemType={data!.itemType!}
                  itemName={data!.itemName!}
                  onConfirm={data!.onConfirm!}
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
      case 'history':
        return <HistoryModal />;
      case 'googleEventDetails':
        return <GoogleEventDetailsModal />;
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
      case 'googleEventDetails': return "Detalls de l'Esdeveniment de Google";
      case 'addEventFrame': return "Afegir Nou Marc d'Esdeveniment";
      case 'editEventFrame': return "Editar Marc d'Esdeveniment";
      case 'addAssignment': return `Nova Assignació per a: ${data?.eventFrame?.name || ''}`;
      case 'editAssignment': return `Editar Assignació per a: ${data?.eventFrame?.name || ''}`;
      case 'addMaterialFromTechSheet': return "Afegir Material a l'Inventari";
      case 'selectSyncCalendar': return "Seleccionar Calendari per Sincronitzar";
      case 'createAppCalendar': return "Crear Nou Calendari de l'App";
      case 'confirmDuplicate': return "Conflicte d'Assignació Detectat";
      case 'confirmDataRepair': return "Reparació de Dades";
      
      case 'eventFrameDetails': return `Detalls de: ${data?.eventFrame?.name || ''}`;
      case 'confirmHardReset':
      case 'confirmDeleteEventFrame':
      case 'confirmDeleteAssignment':
      case 'confirmDelete':
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
      case 'googleEventDetails':
        return '2xl';
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
          <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
            {splashConfigLoaded && splashScreenEnabled && showSplash && <SplashScreen />}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border border-border">
            <CustomMenuBar
              canUndo={canUndo}
              canRedo={canRedo}
              splashScreenEnabled={splashScreenEnabled}
              onToggleSplashScreen={handleToggleSplashScreen}
              isDocumentOpen={isDocumentOpen}
              hasUnsavedChanges={hasUnsavedChanges}
              recentFiles={recentFiles}
            />
            <div className="px-1 py-1 border-t border-border">
              <Suspense fallback={<div className="text-center p-4">Carregant controls...</div>}>
                <Controls
                  theme={theme}
                  toggleTheme={toggleTheme}
                  currentFilePath={currentFilePath}
                />
              </Suspense>
              <Suspense fallback={<div className="text-center p-2">Carregant navegació...</div>}>
                <Navigation />
              </Suspense>
            </div>
          </header>

          <main className="flex-grow px-1 pt-2 overflow-y-auto">
            {!isDocumentOpen ? (
              <WelcomeScreen
                recentFiles={recentFiles}
                onNewDocument={handleNewDocument}
                onOpenDocument={() => handleOpenDocument()}
                onOpenRecent={handleOpenRecent}
              />
            ) : (
              <Suspense fallback={<div className="text-center p-8">Carregant vista...</div>}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <MainDisplay
                        ref={mainDisplayRef}
                        setToastMessage={showToast}
                      />
                    }
                  />
                  <Route path="/tech-sheets" element={<TechSheetsDisplay showToast={showToast} />} />
                  <Route path="/people" element={<PeopleDisplay showToast={showToast} />} />
                  <Route path="/material" element={<MaterialDisplay showToast={showToast} />} />
                </Routes>
              </Suspense>
            )}
          </main>


          <footer className="bg-secondary p-4 text-center text-sm text-muted-foreground border-t border-border">

            <span>© {new Date().getFullYear()} (Pëp) Gestor de Esdeveniments i Personal V1.2.0. Llicència MIT (codi lliure). </span>
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

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-popover text-popover-foreground border-border border p-4 rounded-lg shadow-lg',
              duration: 4000,
              success: {
                duration: 3000,
                className: 'bg-success text-success-foreground border-border border p-4 rounded-lg shadow-lg',
              },
              error: {
                duration: 5000,
                className: 'bg-destructive text-destructive-foreground border-border border p-4 rounded-lg shadow-lg',
              },
            }}
          />

          <Suspense fallback={<div></div>}>
            <SyncProgressOverlay progress={syncProgress} />
          </Suspense>

          {isLoadingOverlayVisible && !syncProgress.visible && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col justify-center items-center z-[9998]" aria-live="assertive" role="alert">
              <svg className="animate-spin h-10 w-10 text-foreground mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-foreground text-lg">{loadingOverlayMessage || "Processant..."}</p>
            </div>
          )}
          {isUpdatingMaterial && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col justify-center items-center z-[9999]" aria-live="assertive" role="alert">
              <svg className="animate-spin h-10 w-10 text-foreground mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-foreground text-lg">Actualitzant material a tota l'aplicació...</p>
            </div>
          )}
          </div>
        </ErrorBoundary>
      </HashRouter>
  );
};

export default App;