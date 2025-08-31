import { useState, useCallback, useEffect, useRef } from 'react';
import { EventFrame, PersonGroup, Assignment, AppData, EventFrameForExport, EventDataManagerReturn, AssignmentStatus, ShowToastFunction, TechSheetData, MaterialItem, ModalType, ModalData, SyncProgressState } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import logger from '../utils/logger';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const createDefaultTechSheet = (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): TechSheetData => {
  const defaultConditionalString = () => ({ status: 'unset' as const, details: '' });
  const defaultConditionalNeeds = () => ({ status: 'unset' as const, details: '', needs: [] });

  return {
    eventName: eventFrame.name,
    location: eventFrame.place || '',
    date: formatDateDMY(eventFrame.startDate),
    showTime: '',
    showDuration: '',
    technicalProviders: [],

    parkingInfo: defaultConditionalString(),
    preAssembly: defaultConditionalString(),
    detailedSchedule: { status: 'unset', items: [] },

    dressingRooms: { status: 'unset', quantity: 0, details: '' },
    actors: { status: 'unset', quantity: 0, names: '' },
    companyTechnicians: { status: 'unset', quantity: 0, names: '' },

    lighting: defaultConditionalNeeds(),
    sound: defaultConditionalNeeds(),
    video: defaultConditionalNeeds(),
    machinery: defaultConditionalNeeds(),
    otherEquipment: defaultConditionalNeeds(),
    rentals: defaultConditionalNeeds(),

    controlLocation: defaultConditionalString(),
    blueprints: defaultConditionalString(),
    companyContact: defaultConditionalString(),
    observations: defaultConditionalString(),
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
        console.error("Error refrescant esdeveniments de Google:", result.message);
        showToast(result.message, 'error');
      }
    } else {
      console.warn("La funció 'getGoogleEvents' no està disponible fora d'Electron.");
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

  const addAssignment = useCallback((eventFrameId: string, newAssignmentData: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>): AssignmentOperationResult => {
    logger.info('[ACTION] addAssignment', { eventFrameId: eventFrameId, personGroupId: newAssignmentData.personGroupId });
    const eventFrame = eventFrames.find(ef => ef.id === eventFrameId);
    if (!eventFrame) return { success: false, message: "Marc d'esdeveniment no trobat." };

    if (newAssignmentData.status === AssignmentStatus.Yes || newAssignmentData.status === AssignmentStatus.Pending) {
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
          return { success: true, warningMessage: `Conflicte detectat: La persona ja està assignada a ${conflictDetails}.` };
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

  const updateAssignment = useCallback((updatedAssignment: Assignment, context?: { changedDate?: string }): AssignmentOperationResult => {
    logger.info('[ACTION] updateAssignment', { id: updatedAssignment.id, eventFrameId: updatedAssignment.eventFrameId });
    let finalAssignment = { ...updatedAssignment };
    if (finalAssignment.status === AssignmentStatus.Mixed) {
      if (!finalAssignment.dailyStatuses) finalAssignment.dailyStatuses = {};
    } else {
      finalAssignment.dailyStatuses = undefined;
    }

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
    
    let warningMessage: string | null = null;
    if (finalAssignment.status !== AssignmentStatus.No) {
        if (context?.changedDate) {
            const specificDate = new Date(context.changedDate);
            warningMessage = checkDateRange(specificDate, specificDate, finalAssignment.dailyStatuses || finalAssignment.status);
        } else {
            warningMessage = checkDateRange(new Date(finalAssignment.startDate), new Date(finalAssignment.endDate), finalAssignment.dailyStatuses || finalAssignment.status);
        }
    }
    
    setEventFrames(prev => prev.map(ef_loc =>
      ef_loc.id === finalAssignment.eventFrameId
        ? { ...ef_loc, assignments: ef_loc.assignments.map(a => a.id === finalAssignment.id ? finalAssignment : a).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) }
        : ef_loc
    ));
    markUnsaved();
    return { success: true, warningMessage: warningMessage || undefined };
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

  const validateMigratedData = useCallback((data: AppData): boolean => {
    const errors: string[] = [];
    const isValidDate = (dateString: string): boolean => {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    };

    if (data.peopleGroups.some(p => typeof p.id !== 'string')) errors.push('Alguns IDs de grups de persones no són strings.');
    if (data.eventFrames.some(e => typeof e.id !== 'string')) errors.push('Alguns IDs de marcs d\'esdeveniments no són strings.');
    if (data.assignments.some(a => typeof a.id !== 'string')) errors.push('Alguns IDs d\'assignacions no són strings.');

    data.assignments.forEach(a => {
      if (!data.eventFrames.some(e => e.id === a.eventFrameId)) errors.push(`L'assignació ${a.id} fa referència a un esdeveniment que no existeix: ${a.eventFrameId}`);
      if (!data.peopleGroups.some(p => p.id === a.personGroupId)) errors.push(`L'assignació ${a.id} fa referència a una persona que no existeix: ${a.personGroupId}`);
    });

    data.eventFrames.forEach(e => {
      if (!isValidDate(e.startDate)) errors.push(`L'esdeveniment ${e.id} té una data d'inici invàlida: ${e.startDate}`);
      if (!isValidDate(e.endDate)) errors.push(`L'esdeveniment ${e.id} té una data de finalització invàlida: ${e.endDate}`);
    });

    data.assignments.forEach(a => {
      if (!isValidDate(a.startDate)) errors.push(`L'assignació ${a.id} té una data d'inici invàlida: ${a.startDate}`);
      if (!isValidDate(a.endDate)) errors.push(`L'assignació ${a.id} té una data de finalització invàlida: ${a.endDate}`);
    });

    if (errors.length > 0) {
      logger.error("Errors de validació de dades:", errors);
      showToast(`Errors de validació de dades: ${errors.join(', ')}`, 'error');
      return false;
    }

    return true;
  }, [showToast]);

  const loadData = useCallback(async (data: AppData | null) => {
    const electronAPI = window.electronAPI;
    if (data?.googleConfig && electronAPI) {
      try {
        await electronAPI.saveGoogleConfig(data.googleConfig);
        showToast("Configuració de Google carregada des del fitxer.", 'info');
        window.dispatchEvent(new CustomEvent('googleConfigChanged'));
        await refreshGoogleEvents();
      } catch (error) {
        console.error("Error desant la configuració de Google del fitxer:", error);
        showToast("No s'ha pogut actualitzar la configuració de Google del fitxer.", 'error');
      }
    }

    if (!data) {
      setEventFrames([]);
      setPeopleGroups([]);
      setMaterialItems([]);
      return;
    }

    if (!validateMigratedData(data)) {
      showToast("Les dades carregades no són vàlides i no es poden carregar.", "error");
      return;
    }

    const loadedEventFrames: EventFrame[] = (data.eventFrames || []).map((efExport: EventFrameForExport) => {
      const defaultTechSheet = createDefaultTechSheet(efExport);
      const finalTechSheet = { ...defaultTechSheet, ...efExport.techSheet };

      return {
        ...efExport,
        assignments: [],
        personnelComplete: efExport.personnelComplete || false,
        techSheet: finalTechSheet,
      };
    });

    if (data.assignments && data.assignments.length > 0) {
      data.assignments.forEach(assignmentFromFile => {
        const targetFrame = loadedEventFrames.find(ef => ef.id === assignmentFromFile.eventFrameId);
        if (targetFrame) {
          const assignmentWithDefaults: Partial<Assignment> = { ...assignmentFromFile };
          
          const oldAssignment = assignmentFromFile as any;
          if (oldAssignment.isMixedStatus === true && assignmentWithDefaults.status !== AssignmentStatus.Mixed) {
            assignmentWithDefaults.status = AssignmentStatus.Mixed;
          }
          delete oldAssignment.isMixedStatus;

          if (assignmentWithDefaults.status !== AssignmentStatus.Mixed) {
            assignmentWithDefaults.dailyStatuses = undefined;
          }

          targetFrame.assignments.push(assignmentWithDefaults as Assignment);
        } else {
          console.warn(`L'assignació amb ID ${assignmentFromFile.id} fa referència a un eventFrameId (${assignmentFromFile.eventFrameId}) que no existeix. S'ometrà.`);
        }
      });
    }

    loadedEventFrames.forEach(ef => {
      ef.assignments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });

    setEventFrames(loadedEventFrames.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)));
    setPeopleGroups((data.peopleGroups || []).sort((a,b) => a.name.localeCompare(b.name)));
    setMaterialItems((data.materialItems || []).sort((a,b) => a.name.localeCompare(b.name)));
  }, [refreshGoogleEvents, showToast]);

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
        console.error("Error carregant la configuració de Google durant l'exportació:", error);
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

  // Load mock data for browser-based development/testing
  useEffect(() => {
    if (!window.electronAPI) {
      console.warn("Entorn no-Electron detectat. Carregant dades de prova.");
      const mockAppData: AppData = {
        peopleGroups: [{ id: 'p1', name: 'Tècnic de Prova', role: 'Tècnic' }],
        eventFrames: [
          {
            id: 'ef1',
            name: 'Esdeveniment de Prova 1',
            startDate: '2025-09-01',
            endDate: '2025-09-02',
            place: 'Teatre Principal',
            techSheet: createDefaultTechSheet({
              name: 'Esdeveniment de Prova 1',
              startDate: '2025-09-01',
              endDate: '2025-09-02',
              place: 'Teatre Principal',
            })
          },
          {
            id: 'ef2',
            name: 'Esdeveniment de Prova 2',
            startDate: '2025-09-10',
            endDate: '2025-09-10',
            place: 'Sala Petita',
          }
        ],
        assignments: [],
        materialItems: [{id: 'm1', name: 'Foco PC', category: 'Il·luminació', stock: 10, location: 'Magatzem 1'}],
      };
      loadData(mockAppData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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