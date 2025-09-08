import { ChangeEvent, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { PersonGroup, ShowToastFunction } from '../types';
import logger from '../utils/logger';
import { SaveIcon, LoadIcon, SunIcon, MoonIcon, InfoIcon, TrashIcon, GoogleIcon, SyncIcon, ChevronDownIcon, ChevronUpIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '../constants';
import { migrateData, validateMigratedData } from '../utils/dataMigration';
import Tooltip from './ui/Tooltip';

interface ControlsProps {
  theme: string;
  toggleTheme: () => void;
  showToast: ShowToastFunction;
  currentDataPath: string;
  setCurrentDataPath: (path: string) => void;
}

const Controls = forwardRef<any, ControlsProps>(({
    theme,
    toggleTheme,
    showToast,
    currentDataPath,
    setCurrentDataPath
}, ref) => {
  const {
    loadData, exportData, setHasUnsavedChanges, undo, redo, canUndo, canRedo,
    syncWithGoogle, isSyncing
  } = useEventDataStore.getState();
  const hasUnsavedChanges = useEventDataStore(state => state.hasUnsavedChanges);
  const { openModal } = useModalStore.getState();

  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const peopleFileInputRef = useRef<HTMLInputElement>(null);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpansion = () => setIsExpanded(prev => !prev);

  const processAllData = (fileContent: string, fileName: string) => {
    try {
      if (!fileContent) {
        showToast("Error: El contingut del fitxer està buit.", 'error');
        return;
      }
      const jsonData = JSON.parse(fileContent);
      if (jsonData.eventFrames && jsonData.peopleGroups && jsonData.assignments !== undefined) {
        loadData(jsonData, showToast);
        showToast("Totes les dades carregades correctament.", 'success');
        setHasUnsavedChanges(true);
        setCurrentDataPath(fileName);
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
        loadData(migratedData, showToast);
        showToast("Dades antigues migrades i carregades correctament.", 'success');
        setHasUnsavedChanges(true);
        setCurrentDataPath(fileName);
      } else {
        showToast("Error: El format del fitxer JSON no és vàlid.", 'error');
      }
    } catch (error) {
      showToast(`Error en processar les dades: ${(error as Error).message}`, 'error');
    }
  };

  const processMaterialData = (fileContent: string) => {
    try {
      const jsonData = JSON.parse(fileContent);
      if (Array.isArray(jsonData.materialItems)) {
        openModal('mergeOrReplace', {
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

  const handleLoadAllData = (event: ChangeEvent<HTMLInputElement>) => {
    logger.info('[UI] Iniciant càrrega de fitxer', { tipus: 'tot' });
    const file = event.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      processAllData(fileContent, fileName);
      if (event.target) event.target.value = "";
    };
    reader.readAsText(file);
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

      openModal('mergeOrReplace', {
        itemType: 'persones',
        newData: newPeople,
      });

    } catch (error) {
      showToast(`Error en carregar les dades de persones: ${(error as Error).message}`, 'error');
    }
  };

  const handleLoadPeopleData = (event: ChangeEvent<HTMLInputElement>) => {
    logger.info('[UI] Iniciant càrrega de fitxer', { tipus: 'persones' });
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      processPeopleData(fileContent);
      if (event.target) event.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleLoadMaterialData = (event: ChangeEvent<HTMLInputElement>) => {
    logger.info('[UI] Iniciant càrrega de fitxer', { tipus: 'material' });
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processMaterialData(content);
      if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };

  const triggerLoadFile = () => fileInputRef.current?.click();
  const triggerLoadPeopleFile = () => peopleFileInputRef.current?.click();
  const triggerLoadMaterialFile = () => materialFileInputRef.current?.click();

  const handleSaveData = async (type: 'all' | 'people' | 'material') => {
    try {
      let dataToSave: any;
      let filename: string;
      const fullData = await exportData();

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
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (type === 'all') {
          setHasUnsavedChanges(false);
        }
        showToast(`Dades de ${type === 'all' ? 'l\'aplicació' : type} desades correctament.`, 'success');
      }
    } catch (error) {
      console.error(`Error saving ${type} data:`, error);
      showToast(`Error en desar les dades: ${(error as Error).message}`, 'error');
    }
  };
  // <<< NOU FLUX PER AL RESET >>>
  const handleConnectGoogle = async () => {
    logger.info('[UI] Iniciant flux d\'autenticació amb Google.');
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

  useImperativeHandle(ref, () => ({
    triggerLoadFile,
    handleSaveData,
    triggerLoadMaterialFile,
    handleRequestHardReset,
    triggerLoadPeopleFile,
    handleConnectGoogle,
    processAllData,
    processMaterialData,
    processPeopleData,
  }));

  const handleRequestHardReset = () => {
    openModal('confirmHardReset', {
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
                // El backend ha esborrat els fitxers, ara el frontend neteja el seu estat.
                loadData(null, showToast);
                setHasUnsavedChanges(false);
                showToast("L'aplicació s'ha restablert a l'estat de fàbrica.", 'success', true);
              } else {
                showToast(result.message || "Error durant el reset de fàbrica.", 'error', true);
              }
          } catch (error) {
            console.error("Error cridant performHardReset:", error);
            showToast(`Error greu durant el reset de fàbrica: ${(error as Error).message}`, 'error', true);
          }
        } else {
          showToast("La funcionalitat de reset no està disponible.", 'error');
        }
      },
    });
  };

  return (
    <div className="p-1 bg-gray-100 dark:bg-gray-800 shadow-md rounded-lg w-full">
      <div className="flex justify-between items-center w-full">
        <Tooltip text={currentDataPath}>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Fitxer de dades: <strong>{currentDataPath}</strong>
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
          {/* Fila Superior */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Tooltip text="Carregar totes les dades des d'un fitxer JSON">
                <button onClick={triggerLoadFile} className="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <LoadIcon /> Carregar Tot
                </button>
              </Tooltip>
              <input type="file" ref={fileInputRef} onChange={handleLoadAllData} accept=".json" className="hidden" aria-hidden="true" />
              <Tooltip text="Guardar totes les dades a un fitxer JSON">
                <button onClick={() => handleSaveData('all')} className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <SaveIcon /> Guardar Tot
                </button>
              </Tooltip>

              <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-1"></div>

              <Tooltip text="Desfer (Ctrl+Z)">
                <button onClick={undo} disabled={!canUndo} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Refer (Ctrl+Y)">
                <button onClick={redo} disabled={!canRedo} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ArrowUturnRightIcon className="w-5 h-5" />
                </button>
              </Tooltip>

              <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-1"></div>

              <Tooltip text="Afegir material des d'un fitxer JSON">
                <button onClick={triggerLoadMaterialFile} className="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <LoadIcon /> Carregar Material
                </button>
              </Tooltip>
              <input type="file" ref={materialFileInputRef} onChange={handleLoadMaterialData} accept=".json" className="hidden" />

              <Tooltip text="Començar de zero (esborra totes les dades actuals)">
                <button onClick={handleRequestHardReset} className="flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <TrashIcon className="w-4 h-4" /> Començar de Zero
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

          {/* Fila Inferior */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Tooltip text="Carregar només dades de persones">
                <button onClick={triggerLoadPeopleFile} className="flex items-center justify-center gap-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <LoadIcon /> Carregar Persones
                </button>
              </Tooltip>
              <input type="file" ref={peopleFileInputRef} onChange={handleLoadPeopleData} accept=".json" className="hidden" />
              <Tooltip text="Guardar només les dades de persones">
                <button onClick={() => handleSaveData('people')} className="flex items-center justify-center gap-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <SaveIcon /> Guardar Persones
                </button>
              </Tooltip>
              <Tooltip text="Guardar només les dades de material">
                <button onClick={() => handleSaveData('material')} className="flex items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                    <SaveIcon /> Guardar Material
                </button>
              </Tooltip>
            </div>

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
                    onClick={handleConnectGoogle}
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
});

export default Controls;
