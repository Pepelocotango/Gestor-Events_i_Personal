import { useState, useCallback, useEffect, useRef } from 'react';
import { EventFrame, PersonGroup, Assignment, AppData, EventFrameForExport, EventDataManagerReturn, AssignmentStatus, ShowToastFunction, TechSheetData, MaterialItem, ModalType, ModalData, SyncProgressState } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import { migrateTechSheetData } from '../utils/techSheetMigration';
import { validateData, repairData } from '../utils/dataIntegrity';
import logger from '../utils/logger';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const createDefaultTechSheet = (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): TechSheetData => {
  const defaultConditional = () => ({ status: 'unset' as const, details: '', needs: [] });
  return {
    eventName: eventFrame.name,
    location: eventFrame.place || '',
    date: formatDateDMY(eventFrame.startDate),
    showTime: '',
    showDuration: '',
    technicalProviders: [],
    generalNotes: `Notes generals per a ${eventFrame.name}`,
    parking: { status: 'unset', details: '' },
    preAssembly: { status: 'unset', details: '' },
    schedule: { status: 'unset', details: '', data: [] },
    dressingRooms: '',
    actorsNumber: 0,
    actors: '',
    companyTechniciansNumber: 0,
    companyTechnicians: '',
    lighting: defaultConditional(),
    sound: defaultConditional(),
    video: defaultConditional(),
    machinery: defaultConditional(),
    rentals: defaultConditional(),
    otherEquipment: defaultConditional(),
    electrical: defaultConditional(),
    structures: defaultConditional(),
    platforms: defaultConditional(),
    consumables: defaultConditional(),
    curtains: defaultConditional(),
    transport: defaultConditional(),
    controlLocation: '',
    blueprints: '',
    contacts: [],
    observations: '',
    showLogistics: true,
    showPreAssembly: true,
    showSchedule: true,
    showNeeds: true,
    showOther: true,
    showGeneralNotesInPdf: true,
  };
};

type AssignmentOperationResult = { success: boolean; message?: string; warningMessage?: string };

export const useEventDataManager = (
  showToast: ShowToastFunction,
  openModal: (type: ModalType, data?: ModalData) => void,
  closeModal: () => void,
): EventDataManagerReturn => {
  const [eventFrames, setEventFrames] = useState<EventFrame[]>([]);
  const [peopleGroups, setPeopleGroups] = useState<PersonGroup[]>([]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState>({
    current: 0,
    total: 0,
    message: '',
    visible: false,
  });
  
  const eventFramesRef = useRef(eventFrames);
  const peopleGroupsRef = useRef(peopleGroups);
  const materialItemsRef = useRef(materialItems);

  useEffect(() => { eventFramesRef.current = eventFrames; }, [eventFrames]);
  useEffect(() => { peopleGroupsRef.current = peopleGroups; }, [peopleGroups]);
  useEffect(() => { materialItemsRef.current = materialItems; }, [materialItems]);

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const refreshGoogleEvents = useCallback(async () => {
    if (window.electronAPI?.getGoogleEvents) {
      const result = await window.electronAPI.getGoogleEvents();
      if (result.success && result.events) {
        setGoogleEvents(result.events);
      } else if (result.message) {
        logger.error("Error refrescant esdeveniments de Google:", { message: result.message });
        showToast(result.message, 'error');
      }
    } else {
      logger.warn("La funció 'getGoogleEvents' no està disponible fora d'Electron.");
    }
  }, [showToast]);

  const addEventFrame = useCallback((newEventFrameData: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): EventFrame => {
    logger.info('[ACTION] addEventFrame', { name: newEventFrameData.name });
    const newEventFrame: EventFrame = {
      ...newEventFrameData,
      id: generateId(),
      assignments: [],
      personnelComplete: false,
      techSheet: createDefaultTechSheet(newEventFrameData),
    };
    setEventFrames(prev => [...prev, newEventFrame].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)));
    markUnsaved();
    return newEventFrame;
  }, [markUnsaved]);
  
  const updateEventFrame = useCallback((updatedEventFrame: EventFrame) => {
    logger.info('[ACTION] updateEventFrame', { id: updatedEventFrame.id, name: updatedEventFrame.name });

    let finalUpdatedEventFrame = { ...updatedEventFrame };
    if (!finalUpdatedEventFrame.techSheet) {
      logger.info(`Generant fitxa tècnica per a l'esdeveniment antic: ${finalUpdatedEventFrame.name}`);
      finalUpdatedEventFrame.techSheet = createDefaultTechSheet(finalUpdatedEventFrame);
    }

    setEventFrames(prev => prev.map(ef => ef.id === finalUpdatedEventFrame.id ? finalUpdatedEventFrame : ef)
      .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name))
    );
    markUnsaved();
  }, [markUnsaved]);
  
  const addOrUpdateTechSheet = useCallback((eventFrameId: string, techSheetData: TechSheetData) => {
    setEventFrames(prevFrames => 
      prevFrames.map(ef => {
        if (ef.id === eventFrameId) {
          return { ...ef, techSheet: techSheetData };
        }
        return ef;
      })
    );
    markUnsaved();
  }, [markUnsaved]);


 const deleteEventFrame = useCallback((eventFrameId: string) => {
    logger.info('[ACTION] deleteEventFrame', { id: eventFrameId });
    setEventFrames(prev => prev.filter(ef => ef.id !== eventFrameId));
    markUnsaved();
  }, [markUnsaved]);

  const getEventFrameById = useCallback((eventFrameId: string): EventFrame | undefined => {
    return eventFrames.find(ef => ef.id === eventFrameId);
  }, [eventFrames]);

  const addPersonGroup = useCallback((newPersonGroupData: Omit<PersonGroup, 'id'>) => {
    logger.info('[ACTION] addPersonGroup', { name: newPersonGroupData.name });
    const newPersonGroup: PersonGroup = {
        id: generateId(),
        name: newPersonGroupData.name,
        role: newPersonGroupData.role || '',
        tel1: newPersonGroupData.tel1 || '',
        tel2: newPersonGroupData.tel2 || '',
        email: newPersonGroupData.email || '',
        web: newPersonGroupData.web || '',
        notes: newPersonGroupData.notes || ''
    };
    setPeopleGroups(prev => [...prev, newPersonGroup].sort((a,b) => a.name.localeCompare(b.name)));
    markUnsaved();
  }, [markUnsaved]);

  const updatePersonGroup = useCallback((updatedPersonGroup: PersonGroup) => {
    logger.info('[ACTION] updatePersonGroup', { id: updatedPersonGroup.id, name: updatedPersonGroup.name });
    setPeopleGroups(prev => prev.map(pg => pg.id === updatedPersonGroup.id ? updatedPersonGroup : pg)
      .sort((a,b) => a.name.localeCompare(b.name))
    );
    markUnsaved();
  }, [markUnsaved]);

  const deletePersonGroup = useCallback((personGroupId: string) => {
    logger.info('[ACTION] deletePersonGroup', { id: personGroupId });
    setPeopleGroups(prev => prev.filter(pg => pg.id !== personGroupId));
    setEventFrames(prevFrames => prevFrames.map(ef => ({
      ...ef,
      assignments: ef.assignments.filter(a => a.personGroupId !== personGroupId)
    })));
    markUnsaved();
  }, [markUnsaved]);

  const addMaterialItem = useCallback((newItemData: Omit<MaterialItem, 'id'>) => {
    logger.info('[ACTION] addMaterialItem', { name: newItemData.name });
    const newItem: MaterialItem = { ...newItemData, id: generateId() };
    setMaterialItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
  }, [markUnsaved]);

  const updateMaterialItem = useCallback((updatedItem: MaterialItem) => {
    logger.info('[ACTION] updateMaterialItem', { id: updatedItem.id, name: updatedItem.name });
    setMaterialItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
  }, [markUnsaved]);

  const deleteMaterialItem = useCallback((itemId: string) => {
    logger.info('[ACTION] deleteMaterialItem', { id: itemId });
    setMaterialItems(prev => prev.filter(item => item.id !== itemId));
    markUnsaved();
  }, [markUnsaved]);

  const getMaterialAvailability = useCallback((materialId: string, startDate: string, endDate: string, currentEventFrameId: string): { available: number, total: number } => {
    const materialItem = materialItemsRef.current.find(item => item.id === materialId);
    if (!materialItem) return { available: 0, total: 0 };

    const start = new Date(startDate);
    const end = new Date(endDate);
    let minAvailable = materialItem.stock;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      let dailyCommittedStock = 0;

      eventFramesRef.current.forEach(ef => {
        if (ef.id === currentEventFrameId) return;

        const efStart = new Date(ef.startDate);
        const efEnd = new Date(ef.endDate);

        if (currentDate >= efStart && currentDate <= efEnd) {
          const needsLists: (keyof TechSheetData)[] = ['lightingNeeds', 'soundNeeds', 'videoNeeds', 'machineryNeeds'];
          needsLists.forEach(listKey => {
            const needs = ef.techSheet?.[listKey];
            if (Array.isArray(needs)) {
              needs.forEach(need => {
                if (typeof need === 'object' && need !== null && 'materialItemId' in need && 'quantity' in need && need.materialItemId === materialId) {
                  dailyCommittedStock += Number(need.quantity) || 0;
                }
              });
            }
          });
        }
      });

      const availableOnDay = materialItem.stock - dailyCommittedStock;
      if (availableOnDay < minAvailable) {
        minAvailable = availableOnDay;
      }
    }

    return {
      total: materialItem.stock,
      available: minAvailable,
    };
  }, [eventFramesRef, materialItemsRef]);

  const addMaterialItemsFromFile = useCallback((newItems: MaterialItem[]) => {
    const existingNames = new Set(materialItemsRef.current.map(item => item.name.toLowerCase()));
    const itemsToAdd = newItems.filter(newItem => !existingNames.has(newItem.name.toLowerCase()));
    
    if (itemsToAdd.length === 0) {
      showToast("Tots els articles del fitxer ja existeixen a l'inventari.", 'info');
      return;
    }
    
    setMaterialItems(prev => [...prev, ...itemsToAdd].sort((a,b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast(`${itemsToAdd.length} nous articles de material afegits a l'inventari.`, 'success');
  }, [markUnsaved, showToast]);

  const mergePeopleGroups = useCallback((newPeople: PersonGroup[]) => {
    logger.info('[ACTION] mergePeopleGroups', { count: newPeople.length });
    const existingNames = new Set(peopleGroupsRef.current.map(p => p.name.toLowerCase()));
    const peopleToAdd = newPeople.filter(p => !existingNames.has(p.name.toLowerCase()));

    if (peopleToAdd.length === 0) {
      showToast("Totes les persones del fitxer ja existeixen.", 'info');
      return;
    }

    setPeopleGroups(prev => [...prev, ...peopleToAdd].sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast(`${peopleToAdd.length} noves persones afegides.`, 'success');
  }, [markUnsaved, showToast]);

  const replacePeopleGroups = useCallback((newPeople: PersonGroup[]) => {
    logger.info('[ACTION] replacePeopleGroups', { count: newPeople.length });
    setPeopleGroups(newPeople.sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast("La llista de persones ha estat reemplaçada.", 'success');
  }, [markUnsaved, showToast]);

  const replaceMaterialItems = useCallback((newItems: MaterialItem[]) => {
    logger.info('[ACTION] replaceMaterialItems', { count: newItems.length });
    setMaterialItems(newItems.sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast("L'inventari de material ha estat reemplaçat.", 'success');
  }, [markUnsaved, showToast]);

  const getPersonGroupById = useCallback((personGroupId: string): PersonGroup | undefined => {
    return peopleGroups.find(pg => pg.id === personGroupId);
  }, [peopleGroups]);

  const addAssignment = useCallback((eventFrameId: string, newAssignmentData: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>, force = false): AssignmentOperationResult => {
    logger.info('[ACTION] addAssignment', { eventFrameId: eventFrameId, personGroupId: newAssignmentData.personGroupId, force });
    const eventFrame = eventFrames.find(ef => ef.id === eventFrameId);
    if (!eventFrame) return { success: false, message: "Marc d'esdeveniment no trobat." };

    if (!force && (newAssignmentData.status === AssignmentStatus.Yes || newAssignmentData.status === AssignmentStatus.Pending)) {
      const allOtherAssignments = eventFrames.flatMap(ef => ef.assignments.filter(a => a.personGroupId === newAssignmentData.personGroupId));
      
      const newStartDate = new Date(newAssignmentData.startDate);
      const newEndDate = new Date(newAssignmentData.endDate);
      
      for (let d = newStartDate; d <= newEndDate; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toISOString().split('T')[0];
        
        const conflictingAssignments = allOtherAssignments.filter(existing => {
            const existingStart = new Date(existing.startDate);
            const existingEnd = new Date(existing.endDate);
            if (d < existingStart || d > existingEnd) return false;

            if(existing.status === AssignmentStatus.Yes || existing.status === AssignmentStatus.Pending) return true;
            if(existing.status === AssignmentStatus.Mixed && existing.dailyStatuses?.[currentDateStr] && existing.dailyStatuses[currentDateStr] !== AssignmentStatus.No) return true;
            
            return false;
        });

        if (conflictingAssignments.length > 0) {
          const conflictDetails = conflictingAssignments.map(conflict => {
              const conflictingEvent = eventFrames.find(ef => ef.id === conflict.eventFrameId);
              return `"${conflictingEvent?.name}" el ${formatDateDMY(currentDateStr)}`;
          }).join(", ");
          // Return success true, but with a special warning message
          return { success: true, warningMessage: `DUPLICATE_CONFLICT:Conflicte detectat: La persona ja està assignada a ${conflictDetails}.` };
        }
      }
    }

    const newAssignment: Assignment = {
      ...newAssignmentData,
      id: generateId(),
      eventFrameId,
    };
    setEventFrames(prev => prev.map(ef_loc =>
      ef_loc.id === eventFrameId
        ? { ...ef_loc, assignments: [...ef_loc.assignments, newAssignment].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) }
        : ef_loc
    ));
    markUnsaved();
    return { success: true };
  }, [eventFrames, markUnsaved]);

  const updateAssignment = useCallback((updatedAssignment: Assignment, force = false, context?: { changedDate?: string }): AssignmentOperationResult => {
    logger.info('[ACTION] updateAssignment', { id: updatedAssignment.id, eventFrameId: updatedAssignment.eventFrameId, force });
    let finalAssignment = { ...updatedAssignment };
    if (finalAssignment.status === AssignmentStatus.Mixed) {
      if (!finalAssignment.dailyStatuses) finalAssignment.dailyStatuses = {};
    } else {
      finalAssignment.dailyStatuses = undefined;
    }

    let warningMessage: string | undefined = undefined;

    if (!force) {
        const allOtherAssignments = eventFrames.flatMap(ef =>
            ef.assignments.filter(a => a.personGroupId === finalAssignment.personGroupId && a.id !== finalAssignment.id)
        );

        const checkDateRange = (start: Date, end: Date, statusToCheck: AssignmentStatus | { [date: string]: AssignmentStatus }) => {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const currentDateStr = d.toISOString().split('T')[0];

                let currentDayStatus: AssignmentStatus | undefined;
                if (typeof statusToCheck === 'string') {
                    currentDayStatus = statusToCheck;
                } else {
                    currentDayStatus = statusToCheck[currentDateStr];
                }

                if (!currentDayStatus || currentDayStatus === AssignmentStatus.No) continue;

                const conflictingAssignments = allOtherAssignments.filter(existing => {
                    const existingStart = new Date(existing.startDate);
                    const existingEnd = new Date(existing.endDate);
                    if (d < existingStart || d > existingEnd) return false;

                    if (existing.status === AssignmentStatus.Yes || existing.status === AssignmentStatus.Pending) return true;
                    if (existing.status === AssignmentStatus.Mixed && existing.dailyStatuses?.[currentDateStr] && existing.dailyStatuses[currentDateStr] !== AssignmentStatus.No) return true;

                    return false;
                });

                if (conflictingAssignments.length > 0) {
                    const conflictDetails = conflictingAssignments.map(conflict => `"${eventFrames.find(ef => ef.id === conflict.eventFrameId)?.name}" el ${formatDateDMY(currentDateStr)}`).join(", ");
                    return `Conflicte detectat: La persona ja està assignada a ${conflictDetails}.`;
                }
            }
            return null;
        };

        let conflictMessage: string | null = null;
        if (finalAssignment.status !== AssignmentStatus.No) {
            if (context?.changedDate) {
                const specificDate = new Date(context.changedDate);
                conflictMessage = checkDateRange(specificDate, specificDate, finalAssignment.dailyStatuses || finalAssignment.status);
            } else {
                conflictMessage = checkDateRange(new Date(finalAssignment.startDate), new Date(finalAssignment.endDate), finalAssignment.dailyStatuses || finalAssignment.status);
            }
        }
        if (conflictMessage) {
          warningMessage = `DUPLICATE_CONFLICT:${conflictMessage}`;
        }
    }
    
    setEventFrames(prev => prev.map(ef_loc =>
      ef_loc.id === finalAssignment.eventFrameId
        ? { ...ef_loc, assignments: ef_loc.assignments.map(a => a.id === finalAssignment.id ? finalAssignment : a).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) }
        : ef_loc
    ));
    markUnsaved();
    return { success: true, warningMessage: warningMessage };
  }, [eventFrames, markUnsaved]);

  const deleteAssignment = useCallback((eventFrameId: string, assignmentId: string) => {
    logger.info('[ACTION] deleteAssignment', { id: assignmentId, eventFrameId: eventFrameId });
    setEventFrames(prev => prev.map(ef =>
      ef.id === eventFrameId
        ? { ...ef, assignments: ef.assignments.filter(a => a.id !== assignmentId) }
        : ef
    ));
    markUnsaved();
  }, [markUnsaved]);

  const getAssignmentById = useCallback((eventFrameId: string, assignmentId: string): Assignment | undefined => {
    const eventFrame = eventFrames.find(ef => ef.id === eventFrameId);
    return eventFrame?.assignments.find(a => a.id === assignmentId);
  }, [eventFrames]);

  const _applyDataToState = useCallback((data: AppData) => {
    const loadedEventFrames: EventFrame[] = (data.eventFrames || []).map((efExport: EventFrameForExport) => {
      const techSheet = efExport.techSheet || createDefaultTechSheet(efExport);

      const assignments = (data.assignments || []).filter(a => a.eventFrameId === efExport.id);

      return {
        ...efExport,
        assignments: assignments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
        personnelComplete: efExport.personnelComplete || false,
        techSheet: techSheet,
      };
    });

    setEventFrames(loadedEventFrames.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)));
    setPeopleGroups((data.peopleGroups || []).sort((a,b) => a.name.localeCompare(b.name)));
    setMaterialItems((data.materialItems || []).sort((a,b) => a.name.localeCompare(b.name)));
    setHasUnsavedChanges(false);
  }, []);

  const loadData = useCallback(async (data: AppData | null) => {
    logger.info("Iniciant la càrrega de dades...");
    const electronAPI = window.electronAPI;
    if (data?.googleConfig && electronAPI) {
      try {
        await electronAPI.saveGoogleConfig(data.googleConfig);
        showToast("Configuració de Google carregada des del fitxer.", 'info');
        window.dispatchEvent(new CustomEvent('googleConfigChanged'));
        await refreshGoogleEvents();
      } catch (error) {
        logger.error("Error desant la configuració de Google del fitxer:", { error });
        showToast("No s'ha pogut actualitzar la configuració de Google del fitxer.", 'error');
      }
    }

    if (!data) {
      setEventFrames([]);
      setPeopleGroups([]);
      setMaterialItems([]);
      return;
    }

    logger.info("Pas 1: Migrant dades a l'últim format...");
    const migratedData: AppData = {
      ...data,
      eventFrames: data.eventFrames.map(ef => ({
        ...ef,
        techSheet: migrateTechSheetData(ef.techSheet, ef as EventFrame),
      })),
    };

    logger.info("Pas 2: Validant la integritat de les dades...");
    const validationResult = validateData(migratedData);

    if (validationResult.isValid) {
      logger.info("Pas 3 (Resultat): Les dades són vàlides. Carregant directament.");
      _applyDataToState(migratedData);
      showToast("Dades carregades amb èxit.", 'success');
    } else {
      logger.warn("Pas 3 (Resultat): S'han trobat errors. Iniciant reparació...", { count: validationResult.errors.length });
      const { repairedData, fixes } = repairData(migratedData, validationResult.errors);

      openModal('confirmDataRepair', {
        onConfirm: () => {
          logger.info("L'usuari ha confirmat la reparació. Carregant dades reparades.");
          _applyDataToState(repairedData);
          showToast("Dades reparades i carregades amb èxit.", 'success');
          closeModal();
        },
        onCancel: () => {
          logger.info("L'usuari ha cancel·lat la càrrega de dades reparades.");
          closeModal();
        },
        fixes,
      });
    }
  }, [refreshGoogleEvents, showToast, openModal, closeModal, _applyDataToState]);

  const exportData = useCallback(async (): Promise<AppData> => {
    const allAssignmentsList: Assignment[] = eventFramesRef.current.flatMap(ef => ef.assignments);
    const eventFramesForExport: EventFrameForExport[] = eventFramesRef.current.map(({ assignments, ...restOfFrame }) => restOfFrame);

    let googleConfigForExport: AppData['googleConfig'] = undefined;
    const electronAPI = window.electronAPI;
    if (electronAPI) {
      try {
        const fullConfig = await electronAPI.loadGoogleConfig();
        if (fullConfig) {
          googleConfigForExport = {
            userEmail: fullConfig.userEmail,
            activeAppCalendarId: fullConfig.activeAppCalendarId,
            managedAppCalendars: fullConfig.managedAppCalendars
          };
        }
      } catch (error) {
        logger.error("Error carregant la configuració de Google durant l'exportació:", { error });
        showToast("No s'ha pogut carregar la configuració de Google per desar-la.", 'error');
      }
    }

    return {
      peopleGroups: peopleGroupsRef.current,
      eventFrames: eventFramesForExport,
      materialItems: materialItemsRef.current,
      assignments: allAssignmentsList,
      googleConfig: googleConfigForExport
    };
   }, [showToast]);

  const setPersonnelComplete = useCallback((eventFrameId: string, complete: boolean) => {
    logger.info('[ACTION] setPersonnelComplete', { eventFrameId, complete });
    setEventFrames(prev => prev.map(ef => ef.id === eventFrameId ? {...ef, personnelComplete: complete} : ef));
    markUnsaved();
  }, [markUnsaved]);

  const syncWithGoogleRef = useRef<() => Promise<void>>();

  const executeSync = useCallback(async (targetCalendarId: string) => {
    logger.info(`[ACTION] Executant sincronització amb Google per a ${targetCalendarId}`);
    closeModal();
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0, message: 'Iniciant sincronització...', visible: true });

    const electronAPI = window.electronAPI;
    if (electronAPI) {
      const localData = await exportData();
      const result = await electronAPI.syncWithGoogle({ localData, targetCalendarId });

      if (result.success && result.data) {
          loadData(result.data);
          await refreshGoogleEvents();
          showToast(result.message || 'Sincronització completada.', 'success');
      } else if (result.code === 'CALENDAR_NOT_FOUND') {
          showToast(result.message || 'El calendari seleccionat no existeix.', 'error', true);
          await refreshGoogleEvents();
          syncWithGoogleRef.current?.();
      } else {
          showToast(result.message || 'Hi ha hagut un error durant la sincronització.', 'error');
      }
    } else {
      showToast("L'API d'Electron no està disponible.", 'error');
    }
    setIsSyncing(false);
    setSyncProgress(prev => ({ ...prev, visible: false }));
  }, [exportData, loadData, refreshGoogleEvents, showToast, closeModal]);

  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (electronAPI?.onSyncProgress) {
      const handleSyncProgress = (progress: Omit<SyncProgressState, 'visible'>) => {
        setSyncProgress({
          ...progress,
          visible: true,
        });
      };

      const cleanup = electronAPI.onSyncProgress(handleSyncProgress);

      return () => {
        cleanup();
      };
    }
  }, []);

  const syncWithGoogle = useCallback(async () => {
    logger.info('[ACTION] Iniciant flux de sincronització amb Google...');
    if (!window.electronAPI?.loadGoogleConfig) {
        showToast('La sincronització només està disponible a l\'aplicació d\'escriptori.', 'warning');
        return;
    }

    const config = await window.electronAPI.loadGoogleConfig();

    if (!config || !config.managedAppCalendars || config.managedAppCalendars.length === 0) {
      showToast("No hi ha calendaris de l'app per sincronitzar. Si us plau, crea'n un a la configuració.", 'warning');
      openModal('googleSettings');
      return;
    }

    openModal('selectSyncCalendar', {
      managedCalendars: config.managedAppCalendars,
      activeCalendarId: config.activeAppCalendarId,
      onConfirmSync: (targetCalendarId: string) => {
        executeSync(targetCalendarId);
      }
    });
  }, [showToast, openModal, executeSync]);

  syncWithGoogleRef.current = syncWithGoogle;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "Teniu canvis sense desar. Esteu segur que voleu sortir?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    eventFrames,
    peopleGroups,
    addEventFrame,
    updateEventFrame,
    deleteEventFrame,
    getEventFrameById,
    addPersonGroup,
    updatePersonGroup,
    deletePersonGroup,
    getPersonGroupById,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentById,
    loadData,
    exportData,
    setPersonnelComplete,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    googleEvents,
    refreshGoogleEvents,
    syncWithGoogle,
    isSyncing,
    syncProgress,
    addOrUpdateTechSheet,
    materialItems,
    addMaterialItem,
    updateMaterialItem,
    deleteMaterialItem,
    addMaterialItemsFromFile,
    getMaterialAvailability,
    mergePeopleGroups,
    replacePeopleGroups,
    replaceMaterialItems,
    executeSync,
  };
};