import { useState, useCallback, useEffect, useRef } from 'react';
import { EventFrame, PersonGroup, Assignment, AppData, EventFrameForExport, EventDataManagerReturn, AssignmentStatus, ShowToastFunction, TechSheetData, MaterialItem } from '../types';
import { formatDateDMY } from '../utils/dateFormat';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const createDefaultTechSheet = (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): TechSheetData => ({
  eventName: eventFrame.name,
  location: eventFrame.place || '',
  date: formatDateDMY(eventFrame.startDate),
  showTime: '',
  showDuration: '',
  parkingInfo: '',
  technicalProviders: [], // Abans 'technicalPersonnel'
  preAssemblySchedule: '',
  assemblySchedule: [],
  dressingRooms: '',
  actors: '',
  companyTechnicians: '',
  lightingNeeds: [],
  soundNeeds: [],
  videoNeeds: [],
  videoDetails: '',
  machineryNeeds: [],
  controlLocation: '',
  otherEquipment: '',
  rentals: '',
  blueprints: '',
  companyContact: '',
  observations: '',
});

type AssignmentOperationResult = { success: boolean; message?: string; warningMessage?: string };

export const useEventDataManager = (
  showToast: ShowToastFunction,
): EventDataManagerReturn => {
  const [eventFrames, setEventFrames] = useState<EventFrame[]>([]);
  const [peopleGroups, setPeopleGroups] = useState<PersonGroup[]>([]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
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
        }
    }
  }, []);

  const addEventFrame = useCallback((newEventFrameData: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): EventFrame => {
    console.log('[ACTION] addEventFrame:', { name: newEventFrameData.name });
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
    console.log('[ACTION] updateEventFrame:', { id: updatedEventFrame.id, name: updatedEventFrame.name });
    if (!updatedEventFrame.techSheet) {
      console.log(`Generant fitxa tècnica per a l'esdeveniment antic: ${updatedEventFrame.name}`);
      updatedEventFrame.techSheet = createDefaultTechSheet(updatedEventFrame);
    }

    setEventFrames(prev => prev.map(ef => ef.id === updatedEventFrame.id ? updatedEventFrame : ef)
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
    console.log('[ACTION] deleteEventFrame:', { id: eventFrameId });
    setEventFrames(prev => prev.filter(ef => ef.id !== eventFrameId));
markUnsaved();
}, [markUnsaved]);

  const getEventFrameById = useCallback((eventFrameId: string): EventFrame | undefined => {
    return eventFrames.find(ef => ef.id === eventFrameId);
  }, [eventFrames]);

  const addPersonGroup = useCallback((newPersonGroupData: Omit<PersonGroup, 'id'>) => {
    console.log('[ACTION] addPersonGroup:', { name: newPersonGroupData.name });
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
    console.log('[ACTION] updatePersonGroup:', { id: updatedPersonGroup.id, name: updatedPersonGroup.name });
    setPeopleGroups(prev => prev.map(pg => pg.id === updatedPersonGroup.id ? updatedPersonGroup : pg)
      .sort((a,b) => a.name.localeCompare(b.name))
    );
    markUnsaved();
  }, [markUnsaved]);

  const deletePersonGroup = useCallback((personGroupId: string) => {
    console.log('[ACTION] deletePersonGroup:', { id: personGroupId });
    setPeopleGroups(prev => prev.filter(pg => pg.id !== personGroupId));
    setEventFrames(prevFrames => prevFrames.map(ef => ({
      ...ef,
      assignments: ef.assignments.filter(a => a.personGroupId !== personGroupId)
    })));
    markUnsaved();
  }, [markUnsaved]);

  const addMaterialItem = useCallback((newItemData: Omit<MaterialItem, 'id'>) => {
    console.log('[ACTION] addMaterialItem:', { name: newItemData.name });
    const newItem: MaterialItem = { ...newItemData, id: generateId() };
    setMaterialItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
  }, [markUnsaved]);

  const updateMaterialItem = useCallback((updatedItem: MaterialItem) => {
    console.log('[ACTION] updateMaterialItem:', { id: updatedItem.id, name: updatedItem.name });
    setMaterialItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
  }, [markUnsaved]);

  const deleteMaterialItem = useCallback((itemId: string) => {
    console.log('[ACTION] deleteMaterialItem:', { id: itemId });
    setMaterialItems(prev => prev.filter(item => item.id !== itemId));
    markUnsaved();
  }, [markUnsaved]);

  const getMaterialAvailability = useCallback((materialId: string, startDate: string, endDate: string, currentEventFrameId: string): { available: number, total: number } => {
    const materialItem = materialItemsRef.current.find(item => item.id === materialId);
    if (!materialItem) return { available: 0, total: 0 };

    let committedStock = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);

    eventFramesRef.current.forEach(ef => {
      // No comptem el material de l'esdeveniment que estem editant
      if (ef.id === currentEventFrameId) return;

      const efStart = new Date(ef.startDate);
      const efEnd = new Date(ef.endDate);

      // Comprovem si hi ha solapament de dates
      if (start <= efEnd && end >= efStart) {
        const needsLists: (keyof TechSheetData)[] = ['lightingNeeds', 'soundNeeds', 'videoNeeds', 'machineryNeeds'];
        needsLists.forEach(listKey => {
          const needs = ef.techSheet?.[listKey];
          if (Array.isArray(needs)) {
            needs.forEach(need => {
              
              if (typeof need === 'object' && need !== null && 'materialItemId' in need && 'quantity' in need) {
                if (need.materialItemId === materialId) {
                  committedStock += Number(need.quantity) || 0;
                }
              }
            });
          }
        });
      }
    });

    return {
      total: materialItem.stock,
      available: materialItem.stock - committedStock,
    };
  }, [eventFramesRef, materialItemsRef]);

  const addMaterialItemsFromFile = useCallback((newItems: MaterialItem[]) => {
    // Filtrem per evitar duplicats basats en el nom (podria ser un ID si el JSON en tingués)
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
    console.log('[ACTION] mergePeopleGroups:', { count: newPeople.length });
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
    console.log('[ACTION] replacePeopleGroups:', { count: newPeople.length });
    setPeopleGroups(newPeople.sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast("La llista de persones ha estat reemplaçada.", 'success');
  }, [markUnsaved, showToast]);

  const replaceMaterialItems = useCallback((newItems: MaterialItem[]) => {
    console.log('[ACTION] replaceMaterialItems:', { count: newItems.length });
    setMaterialItems(newItems.sort((a, b) => a.name.localeCompare(b.name)));
    markUnsaved();
    showToast("L'inventari de material ha estat reemplaçat.", 'success');
  }, [markUnsaved, showToast]);

  const getPersonGroupById = useCallback((personGroupId: string): PersonGroup | undefined => {
    return peopleGroups.find(pg => pg.id === personGroupId);
  }, [peopleGroups]);

  const addAssignment = useCallback((eventFrameId: string, newAssignmentData: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>): AssignmentOperationResult => {
    console.log('[ACTION] addAssignment:', { eventFrameId: eventFrameId, personGroupId: newAssignmentData.personGroupId });
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
    console.log('[ACTION] updateAssignment:', { id: updatedAssignment.id, eventFrameId: updatedAssignment.eventFrameId });
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
    console.log('[ACTION] deleteAssignment:', { id: assignmentId, eventFrameId: eventFrameId });
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

  const loadData = useCallback((data: AppData | null) => {
    if (!data) {
      setEventFrames([]);
      setPeopleGroups([]);
      setMaterialItems([]);
      return;
    }

    const loadedEventFrames: EventFrame[] = (data.eventFrames || []).map((efExport: EventFrameForExport) => {
      const defaultTechSheet = createDefaultTechSheet(efExport);
      // <<< LÒGICA DE CURACIÓ AUTOMÀTICA >>>
      // Fusiona la fitxa existent (si n'hi ha) amb la per defecte.
      // Això assegura que els esdeveniments antics rebin la fitxa
      // i que els que ja en tenien rebin els camps nous que s'hagin afegit.
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
  }, []);

  const exportData = useCallback((): AppData => {
    const allAssignmentsList: Assignment[] = eventFramesRef.current.flatMap(ef => ef.assignments);
    const eventFramesForExport: EventFrameForExport[] = eventFramesRef.current.map(({ assignments, ...restOfFrame }) => restOfFrame);

    return {
      peopleGroups: peopleGroupsRef.current,
      eventFrames: eventFramesForExport,
      materialItems: materialItemsRef.current,
      assignments: allAssignmentsList,
    };
   }, []);

  const setPersonnelComplete = useCallback((eventFrameId: string, complete: boolean) => {
    console.log('[ACTION] setPersonnelComplete:', { eventFrameId, complete });
    setEventFrames(prev => prev.map(ef => ef.id === eventFrameId ? {...ef, personnelComplete: complete} : ef));
    markUnsaved();
  }, [markUnsaved]);

  const syncWithGoogle = useCallback(async () => {
    console.log('[ACTION] Iniciant sincronització amb Google...');
    setIsSyncing(true);
    if (!window.electronAPI) {
        showToast('La sincronització només està disponible a l\'aplicació d\'escriptori.', 'warning');
        setIsSyncing(false);
        return;
    }

    const localData = exportData();
    const result = await window.electronAPI.syncWithGoogle(localData);

    if (result.success && result.data) {
        loadData(result.data);
        await refreshGoogleEvents();
        showToast(result.message || 'Sincronització completada.', 'success');
    } else {
        showToast(result.message || 'Hi ha hagut un error durant la sincronització.', 'error');
    }
    setIsSyncing(false);
  }, [showToast, exportData, loadData, refreshGoogleEvents]);

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
  };
};