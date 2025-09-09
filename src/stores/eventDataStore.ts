import { create } from 'zustand';
import { EventFrame, PersonGroup, Assignment, AppData, EventFrameForExport, AssignmentStatus, TechSheetData, MaterialItem, SyncProgressState, NeedItem, AssignmentOperationResult } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import { migrateTechSheetData } from '../utils/techSheetMigration';
import { validateData, repairData } from '../utils/dataIntegrity';
import logger from '../utils/logger';
import { loggingMiddleware } from './loggingMiddleware';
import { temporal } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const createDefaultTechSheet = (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>): TechSheetData => {
    const defaultConditional = () => ({ status: 'unset' as const, details: '', needs: [] as NeedItem[] });
    return {
      eventName: eventFrame.name,
      location: eventFrame.place || '',
      date: formatDateDMY(eventFrame.startDate),
      showTime: '',
      showDuration: '',
      technicalProviders: [],
      generalNotes: '',
      parking: { status: 'unset', details: '' },
      preAssembly: { status: 'unset', details: '' },
      schedule: { status: 'unset', details: '', data: [] },
      dressingRooms: { status: 'unset', details: '' },
      actorsInfo: { status: 'unset', details: '', data: { number: 0, names: '' } },
      techniciansInfo: { status: 'unset', details: '', data: { number: 0, names: '' } },
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

interface EventDataState {
    eventFrames: EventFrame[];
    peopleGroups: PersonGroup[];
    materialItems: MaterialItem[];
    googleEvents: any[];
    hasUnsavedChanges: boolean;
    isSyncing: boolean;
    syncProgress: SyncProgressState;
    dataRepairInfo: { fixes: any[], repairedData: AppData } | null;
}

interface EventDataActions {
    addEventFrame: (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>) => EventFrame;
    updateEventFrame: (eventFrame: EventFrame) => void;
    deleteEventFrame: (eventFrameId: string) => void;
    getEventFrameById: (eventFrameId: string) => EventFrame | undefined;
    addPersonGroup: (personGroup: Omit<PersonGroup, 'id'>) => void;
    updatePersonGroup: (personGroup: PersonGroup) => void;
    deletePersonGroup: (personGroupId: string) => void;
    getPersonGroupById: (personGroupId: string) => PersonGroup | undefined;
    addAssignment: (eventFrameId: string, assignment: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>, force?: boolean) => AssignmentOperationResult;
    updateAssignment: (assignment: Assignment, force?: boolean, context?: { changedDate?: string }) => AssignmentOperationResult;
    deleteAssignment: (eventFrameId: string, assignmentId: string) => void;
    getAssignmentById: (eventFrameId: string, assignmentId: string) => Assignment | undefined;
    loadData: (data: AppData | null) => Promise<{ status: 'ok' | 'needs_confirmation' | 'error'; fixes?: string[], message?: string, type?: 'success' | 'error' | 'info' | 'warning' }>;
    exportData: () => Promise<AppData>;
    setPersonnelComplete: (eventFrameId: string, complete: boolean) => void;
    setHasUnsavedChanges: (value: boolean) => void;
    refreshGoogleEvents: () => Promise<{ success: boolean, message?: string, type?: 'success' | 'error' | 'info' | 'warning' }>;
    syncWithGoogle: () => Promise<void>;
    executeSync: (targetCalendarId: string) => Promise<any>;
    addOrUpdateTechSheet: (eventFrameId: string, fitxaData: TechSheetData) => void;
    addMaterialItem: (newItemData: Omit<MaterialItem, 'id'>) => void;
    updateMaterialItem: (updatedItem: MaterialItem) => void;
    deleteMaterialItem: (itemId: string) => void;
    addMaterialItemsFromFile: (newItems: MaterialItem[]) => { success: boolean, message: string, type: 'success' | 'error' | 'info' | 'warning' };
    getMaterialAvailability: (materialId: string, startDate: string, endDate: string, currentEventFrameId: string) => { available: number, total: number };
    mergePeopleGroups: (newPeople: PersonGroup[]) => { success: boolean, message: string, type: 'success' | 'error' | 'info' | 'warning' };
    replacePeopleGroups: (newPeople: PersonGroup[]) => void;
    replaceMaterialItems: (newItems: MaterialItem[]) => void;
    _applyDataToState: (data: AppData) => void;
    clearDataRepairInfo: () => void;
}

const initialState: EventDataState = {
    eventFrames: [],
    peopleGroups: [],
    materialItems: [],
    googleEvents: [],
    hasUnsavedChanges: false,
    isSyncing: false,
    syncProgress: { current: 0, total: 0, message: '', visible: false },
    dataRepairInfo: null,
};

export const useEventDataStore = create<EventDataState & EventDataActions>()(
  temporal(
    immer(
      (set, get) => ({
        ...initialState,

        clearDataRepairInfo: () => set({ dataRepairInfo: null }),

    // UTILS
    setHasUnsavedChanges: (value: boolean) => set({ hasUnsavedChanges: value }),

    // DATA HYDRATION
    _applyDataToState: (data) => {
        const loadedEventFrames: EventFrame[] = (data.eventFrames || []).map((efExport: EventFrameForExport) => ({
            ...efExport,
            assignments: (data.assignments || []).filter(a => a.eventFrameId === efExport.id).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
            personnelComplete: efExport.personnelComplete || false,
            techSheet: migrateTechSheetData(efExport.techSheet, efExport as EventFrame),
        }));
        set({
            eventFrames: loadedEventFrames.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)),
            peopleGroups: (data.peopleGroups || []).sort((a,b) => a.name.localeCompare(b.name)),
            materialItems: (data.materialItems || []).sort((a,b) => a.name.localeCompare(b.name)),
            hasUnsavedChanges: false
        });
    },
    loadData: async (data) => {
        const { _applyDataToState, refreshGoogleEvents } = get();
        logger.info("Iniciant la càrrega de dades...", { hasData: !!data });

        if (data?.googleConfig && window.electronAPI) {
          try {
            await window.electronAPI.saveGoogleConfig(data.googleConfig);
            window.dispatchEvent(new CustomEvent('googleConfigChanged'));
            await refreshGoogleEvents();
          } catch (error) {
            logger.error("Error desant la configuració de Google del fitxer:", { error });
            return { status: 'error', message: "No s'ha pogut actualitzar la configuració de Google del fitxer.", type: 'error' };
          }
        }

        if (!data) {
          set(initialState);
          return { status: 'ok', message: 'Estat de l\'aplicació netejat.', type: 'info' };
        }

        const migratedData: AppData = { ...data, eventFrames: data.eventFrames.map(ef => ({ ...ef, techSheet: migrateTechSheetData(ef.techSheet, ef as EventFrame) })) };
        const validationResult = validateData(migratedData);

        if (validationResult.isValid) {
          _applyDataToState(migratedData);
          return { status: 'ok', message: "Dades carregades amb èxit.", type: 'success' };
        } else {
          const { repairedData, fixes } = repairData(migratedData, validationResult.errors);
          set({ dataRepairInfo: { repairedData, fixes } });
          return { status: 'needs_confirmation', fixes };
        }
      },
    exportData: async () => {
        const { eventFrames, peopleGroups, materialItems } = get();
        const allAssignmentsList: Assignment[] = eventFrames.flatMap(ef => ef.assignments);
        const eventFramesForExport: EventFrameForExport[] = eventFrames.map(({ assignments, ...restOfFrame }) => restOfFrame);
        let googleConfigForExport: AppData['googleConfig'] = undefined;
        if (window.electronAPI) {
            const fullConfig = await window.electronAPI.loadGoogleConfig();
            if (fullConfig) {
                googleConfigForExport = { userEmail: fullConfig.userEmail, activeAppCalendarId: fullConfig.activeAppCalendarId, managedAppCalendars: fullConfig.managedAppCalendars };
            }
        }
        const dataToExport = { peopleGroups, eventFrames: eventFramesForExport, materialItems, assignments: allAssignmentsList, googleConfig: googleConfigForExport };
        // Assegurem que l'objecte és totalment serialitzable abans de passar-lo per IPC
        return JSON.parse(JSON.stringify(dataToExport));
    },

    // EVENT FRAMES
    addEventFrame: (newEventFrameData) => {
        const newEventFrame: EventFrame = { ...newEventFrameData, id: generateId(), assignments: [], personnelComplete: false, techSheet: createDefaultTechSheet(newEventFrameData) };
        set(state => ({ eventFrames: [...state.eventFrames, newEventFrame].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
        return newEventFrame;
    },
    updateEventFrame: (updatedEventFrame) => {
        set(state => ({ eventFrames: state.eventFrames.map(ef => ef.id === updatedEventFrame.id ? updatedEventFrame : ef).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
    },
    deleteEventFrame: (eventFrameId) => {
        set(state => ({ eventFrames: state.eventFrames.filter(ef => ef.id !== eventFrameId), hasUnsavedChanges: true }));
    },
    getEventFrameById: (eventFrameId) => get().eventFrames.find(ef => ef.id === eventFrameId),
    setPersonnelComplete: (eventFrameId, complete) => {
        set(state => ({ eventFrames: state.eventFrames.map(ef => ef.id === eventFrameId ? {...ef, personnelComplete: complete} : ef), hasUnsavedChanges: true }));
    },
    addOrUpdateTechSheet: (eventFrameId, techSheetData) => {
        set(state => ({ eventFrames: state.eventFrames.map(ef => ef.id === eventFrameId ? { ...ef, techSheet: techSheetData } : ef), hasUnsavedChanges: true }));
    },

    // ASSIGNMENTS
    addAssignment: (eventFrameId, newAssignmentData, force = false) => {
        const { eventFrames } = get();
        const eventFrame = eventFrames.find(ef => ef.id === eventFrameId);
        if (!eventFrame) return { success: false, message: "Marc d'esdeveniment no trobat." };
        if (!force && (newAssignmentData.status === AssignmentStatus.Yes || newAssignmentData.status === AssignmentStatus.Pending)) {
            // ... conflict detection logic ...
        }
        const newAssignment: Assignment = { ...newAssignmentData, id: generateId(), eventFrameId };
        set(state => ({ eventFrames: state.eventFrames.map(ef_loc => ef_loc.id === eventFrameId ? { ...ef_loc, assignments: [...ef_loc.assignments, newAssignment].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) } : ef_loc), hasUnsavedChanges: true }));
        return { success: true };
    },
    updateAssignment: (updatedAssignment) => {
        // ... conflict detection and update logic ...
        set(state => ({ eventFrames: state.eventFrames.map(ef_loc => ef_loc.id === updatedAssignment.eventFrameId ? { ...ef_loc, assignments: ef_loc.assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) } : ef_loc), hasUnsavedChanges: true }));
        return { success: true };
    },
    deleteAssignment: (eventFrameId, assignmentId) => {
        set(state => ({ eventFrames: state.eventFrames.map(ef => ef.id === eventFrameId ? { ...ef, assignments: ef.assignments.filter(a => a.id !== assignmentId) } : ef), hasUnsavedChanges: true }));
    },
    getAssignmentById: (eventFrameId, assignmentId) => get().eventFrames.find(ef => ef.id === eventFrameId)?.assignments.find(a => a.id === assignmentId),

    // PEOPLE
    addPersonGroup: (newPersonGroupData) => {
        const newPersonGroup: PersonGroup = { id: generateId(), ...newPersonGroupData };
        set(state => ({ peopleGroups: [...state.peopleGroups, newPersonGroup].sort((a,b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
    },
    updatePersonGroup: (updatedPersonGroup) => {
        set(state => ({ peopleGroups: state.peopleGroups.map(pg => pg.id === updatedPersonGroup.id ? updatedPersonGroup : pg).sort((a,b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
    },
    deletePersonGroup: (personGroupId) => {
        set(state => ({
            peopleGroups: state.peopleGroups.filter(pg => pg.id !== personGroupId),
            eventFrames: state.eventFrames.map(ef => ({ ...ef, assignments: ef.assignments.filter(a => a.personGroupId !== personGroupId) })),
            hasUnsavedChanges: true
        }));
    },
    getPersonGroupById: (personGroupId) => get().peopleGroups.find(pg => pg.id === personGroupId),
    mergePeopleGroups: (newPeople) => {
        const existingNames = new Set(get().peopleGroups.map(p => p.name.toLowerCase()));
        const peopleToAdd = newPeople.filter(p => !existingNames.has(p.name.toLowerCase()));
        if (peopleToAdd.length > 0) {
            set(state => ({ peopleGroups: [...state.peopleGroups, ...peopleToAdd].sort((a, b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
            return { success: true, message: `${peopleToAdd.length} noves persones afegides.`, type: 'success' };
        } else {
            return { success: true, message: "Totes les persones del fitxer ja existeixen.", type: 'info' };
        }
    },
    replacePeopleGroups: (newPeople) => {
        set({ peopleGroups: newPeople.sort((a, b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true });
    },

    // MATERIAL
    addMaterialItem: (newItemData) => {
        const newItem: MaterialItem = { ...newItemData, id: generateId() };
        set(state => ({ materialItems: [...state.materialItems, newItem].sort((a, b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
    },
    updateMaterialItem: (updatedItem) => {
        set(state => ({ materialItems: state.materialItems.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
    },
    deleteMaterialItem: (itemId) => {
        set(state => ({ materialItems: state.materialItems.filter(item => item.id !== itemId), hasUnsavedChanges: true }));
    },
    addMaterialItemsFromFile: (newItems) => {
        const existingNames = new Set(get().materialItems.map(item => item.name.toLowerCase()));
        const itemsToAdd = newItems.filter(newItem => !existingNames.has(newItem.name.toLowerCase()));
        if (itemsToAdd.length > 0) {
            set(state => ({ materialItems: [...state.materialItems, ...itemsToAdd].sort((a,b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true }));
            return { success: true, message: `${itemsToAdd.length} nous articles de material afegits.`, type: 'success' };
        } else {
            return { success: true, message: "Tots els articles del fitxer ja existeixen.", type: 'info' };
        }
    },
    replaceMaterialItems: (newItems) => {
        set({ materialItems: newItems.sort((a, b) => a.name.localeCompare(b.name)), hasUnsavedChanges: true });
    },
    getMaterialAvailability: (materialId, startDate, endDate, currentEventFrameId) => {
        const { materialItems, eventFrames } = get();
        const materialItem = materialItems.find(item => item.id === materialId);
        if (!materialItem) return { available: 0, total: 0 };
        let minAvailable = materialItem.stock;
        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            let dailyCommittedStock = 0;
            eventFrames.forEach(ef => {
                if (ef.id === currentEventFrameId) return;
                if (currentDate >= new Date(ef.startDate) && currentDate <= new Date(ef.endDate)) {
                    Object.values(ef.techSheet || {}).forEach(section => {
                        if (section && section.status === 'yes' && Array.isArray(section.data?.needs)) {
                            section.data.needs.forEach((need: NeedItem) => {
                                if (need.materialItemId === materialId) dailyCommittedStock += Number(need.quantity) || 0;
                            });
                        }
                    });
                }
            });
            minAvailable = Math.min(minAvailable, materialItem.stock - dailyCommittedStock);
        }
        return { total: materialItem.stock, available: minAvailable };
    },

    // GOOGLE & SYNC
    refreshGoogleEvents: async () => {
        if (window.electronAPI?.getGoogleEvents) {
          const result = await window.electronAPI.getGoogleEvents();
          if (result.success && result.events) {
            set({ googleEvents: result.events });
            return { success: true };
          } else if (result.message) {
            return { success: false, message: result.message, type: 'error' };
          }
        }
        return { success: false, message: 'API d\'Electron no disponible.', type: 'error' };
      },
    syncWithGoogle: async () => {
        // This action will now be orchestrated from the UI
        // It's kept here for potential future use or direct calls if needed
        logger.info("syncWithGoogle action called. Orchestration should happen in UI.");
    },
    executeSync: async (targetCalendarId) => {
        const { exportData, loadData, refreshGoogleEvents } = get();
        let finalResult: any = { success: false, message: 'La sincronització no es va completar.', type: 'error' };

        set({ isSyncing: true, syncProgress: { current: 0, total: 0, message: 'Iniciant...', visible: true } });

        if (window.electronAPI) {
          const localData = await exportData();
          const result = await window.electronAPI.syncWithGoogle({ localData, targetCalendarId });

          if (result.success && result.data) {
            await loadData(result.data);
            await refreshGoogleEvents();
            finalResult = { success: true, message: result.message || 'Sincronització completada.', type: 'success' };
          } else {
            await refreshGoogleEvents();
            finalResult = { success: false, message: result.message || 'Error desconegut durant la sincronització.', type: 'error', code: result.code };
          }
        }

        set({ isSyncing: false, syncProgress: { ...get().syncProgress, visible: false } });
        return finalResult;
      },
    })),
    {
        partialize: (state) => {
            const { eventFrames, peopleGroups, materialItems } = state;
            return { eventFrames, peopleGroups, materialItems };
        },
        limit: 10,
    }
  )
);
