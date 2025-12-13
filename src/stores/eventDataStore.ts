

import { create } from 'zustand';
// import eliminat: useStoreWithEqualityFn
import { useStore } from 'zustand';
import { temporal, TemporalState } from 'zundo';
import { useModalStore } from './modalStore';
import { useGoogleConfigStore } from './googleConfigStore';
import { EventFrame, PersonGroup, Assignment, AppData, EventFrameForExport, AssignmentStatus, TechSheetData, MaterialItem, SyncProgressState, NeedItem, AssignmentOperationResult, MaterialControlRow, TechSheetProvider } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import { migrateTechSheetData } from '../utils/techSheetMigration';
import { validateData, repairData } from '../utils/dataIntegrity';
import logger from '../utils/logger';
import { immer } from 'zustand/middleware/immer';
import { notificationService } from '../utils/notificationService';

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

export interface EventDataState {
    eventFrames: EventFrame[];
    peopleGroups: PersonGroup[];
    materialItems: MaterialItem[];
    googleEvents: any[];
    hasUnsavedChanges: boolean;
    isSyncing: boolean;
    isUpdatingMaterial: boolean;
    syncProgress: SyncProgressState;
    dataRepairInfo: { fixes: any[], repairedData: AppData } | null;
    filterUIEventFrame: string | null;
    highlightedEventId: string | null;
    lastActionDescription: string | null;
    // Filtres centralitzats
    filterText: string;
    filterStatus: AssignmentStatus | '';
    filterDate: string;
    localFilterUIPerson: string;
    filterPlace: string;
    // Estats per a l'expansió automàtica
    isEventListExpanded: boolean;
    manualExpandedFrameIds: Set<string>;
}

interface EventDataActions {
    setFilterUIEventFrame: (id: string | null) => void;
    setHighlightedEventId: (id: string | null) => void;
    // Accions per als filtres centralitzats
    setFilterText: (text: string) => void;
    setFilterStatus: (status: AssignmentStatus | '') => void;
    setFilterDate: (date: string) => void;
    setLocalFilterUIPerson: (personId: string) => void;
    setFilterPlace: (place: string) => void;
    clearAllFilters: () => void;
    setSyncProgress: (progress: SyncProgressState) => void;
    showAndHighlightEvent: (eventId: string) => void;
    setManualExpandedFrameIds: (updater: (prev: Set<string>) => Set<string>) => void;
    toggleEventListExpanded: () => void;
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
    loadGoogleConfigFromDataFile: (data: AppData) => Promise<{ success: boolean, message?: string, type?: 'success' | 'error' | 'info' | 'warning' }>;
    exportData: () => Promise<AppData>;
    setPersonnelComplete: (eventFrameId: string, complete: boolean) => void;
    setHasUnsavedChanges: (value: boolean) => void;
    refreshGoogleEvents: () => Promise<{ success: boolean, message?: string, type?: 'success' | 'error' | 'info' | 'warning' }>;
    syncWithGoogle: () => Promise<void>;
    executeSync: (targetCalendarId: string) => Promise<any>;
    addOrUpdateTechSheet: (eventFrameId: string, fitxaData: TechSheetData) => void;
    reorderTechnicalProviders: (eventFrameId: string, reorderedProviders: TechSheetProvider[]) => void;
    addMaterialItem: (newItemData: Omit<MaterialItem, 'id'>) => MaterialItem;
    updateMaterialItem: (updatedItem: MaterialItem) => void;
    deleteMaterialItem: (itemId: string) => void;
    addMaterialItemsFromFile: (newItems: MaterialItem[]) => { success: boolean, message: string, type: 'success' | 'error' | 'info' | 'warning' };
    getMaterialAvailability: (materialId: string, startDate: string, endDate: string, currentEventFrameId: string) => { available: number, total: number };
    mergePeopleGroups: (newPeople: PersonGroup[]) => { success: boolean, message: string, type: 'success' | 'error' | 'info' | 'warning' };
    replacePeopleGroups: (newPeople: PersonGroup[]) => void;
    replaceMaterialItems: (newItems: MaterialItem[]) => void;
    _applyDataToState: (data: AppData) => void;
    clearDataRepairInfo: () => void;
    setIsUpdatingMaterial: (isUpdating: boolean) => void;
    undoWithToast: () => void;
    redoWithToast: () => void;
    archiveOldEventFrames: () => EventFrame[];
    confirmArchiveEventFrames: (eventFrameIds: string[]) => void;
    restoreEventFrame: (eventFrameId: string) => void;
}

const initialState: EventDataState = {
    eventFrames: [],
    peopleGroups: [],
    materialItems: [],
    googleEvents: [],
    hasUnsavedChanges: false,
    isSyncing: false,
    isUpdatingMaterial: false,
    syncProgress: {
      current: 0,
      total: 0,
      message: '',
      visible: false,
      logs: [],
    },
    dataRepairInfo: null,
    filterUIEventFrame: null,
    highlightedEventId: null,
    lastActionDescription: null,
    // Filtres centralitzats - valors inicials
    filterText: '',
    filterStatus: '',
    filterDate: '',
    localFilterUIPerson: '',
    filterPlace: '',
    // Estats per a l'expansió automàtica - valors inicials
    isEventListExpanded: false,
    manualExpandedFrameIds: new Set<string>(),
};

export const useEventDataStore = create<EventDataState & EventDataActions>()(
  temporal(
    immer(
      (set, get) => ({
        ...initialState,

        setIsUpdatingMaterial: (isUpdating: boolean) => set({ isUpdatingMaterial: isUpdating }),

        undoWithToast: () => {
            const { temporal } = useEventDataStore;
            // Get the description of the action that is about to be undone.
            const currentDescription = get().lastActionDescription;

            temporal.getState().undo();

            if (currentDescription) {
                notificationService.info(`Desfeta l'acció: ${currentDescription}`);
            } else {
                notificationService.info('Acció desfeta.');
            }
        },

        redoWithToast: () => {
            const { temporal } = useEventDataStore;

            temporal.getState().redo();

            // After redoing, the current state has the description of the redone action.
            const newDescription = get().lastActionDescription;
            if (newDescription) {
                notificationService.info(`Refeta l'acció: ${newDescription}`);
            } else {
                notificationService.info('Acció refeta.');
            }
        },

        clearDataRepairInfo: () => set({ dataRepairInfo: null }),

        // UTILS
        setHasUnsavedChanges: (value: boolean) => set({ hasUnsavedChanges: value }),
        setFilterUIEventFrame: (id: string | null) => set({ filterUIEventFrame: id }),
        setHighlightedEventId: (id: string | null) => set({ highlightedEventId: id }),
        
        // FILTRES CENTRALITZATS
        setFilterText: (text: string) => set({ filterText: text }),
        setFilterStatus: (status: AssignmentStatus | '') => set({ filterStatus: status }),
        setFilterDate: (date: string) => set({ filterDate: date }),
        setLocalFilterUIPerson: (personId: string) => set({ localFilterUIPerson: personId }),
        setFilterPlace: (place: string) => set({ filterPlace: place }),
        clearAllFilters: () => set({ 
            filterText: '', 
            filterStatus: '', 
            filterDate: '', 
            localFilterUIPerson: '', 
            filterPlace: '',
            filterUIEventFrame: null,
            highlightedEventId: null
        }),
        setSyncProgress: (progress: SyncProgressState) => set({ 
    syncProgress: progress // Confiem directament en el que envia el backend
}),
        showAndHighlightEvent: (eventId: string) => {
            logger.info(`[eventDataStore] showAndHighlightEvent called for ID: ${eventId}`);
            const newManualExpandedFrameIds = new Set(get().manualExpandedFrameIds);
            newManualExpandedFrameIds.add(eventId);
            set({
                isEventListExpanded: true,
                manualExpandedFrameIds: newManualExpandedFrameIds,
                highlightedEventId: eventId
            });
            logger.info(`[eventDataStore] state updated for highlighting:`, { isEventListExpanded: true, highlightedEventId: eventId });
        },
        setManualExpandedFrameIds: (updater: (prev: Set<string>) => Set<string>) => {
            const oldSet = get().manualExpandedFrameIds;
            const newSet = updater(oldSet);
            logger.info('[eventDataStore] setManualExpandedFrameIds called.', { from: Array.from(oldSet), to: Array.from(newSet) });
            set({ manualExpandedFrameIds: newSet });
        },
        toggleEventListExpanded: () => set((state) => ({ isEventListExpanded: !state.isEventListExpanded })),

        // DATA HYDRATION
            _applyDataToState: (data: AppData) => {
            const loadedEventFrames: EventFrame[] = (data.eventFrames || []).map((efExport: EventFrameForExport) => ({
                ...efExport,
                assignments: (data.assignments || []).filter((a: Assignment) => a.eventFrameId === efExport.id).sort((a: Assignment, b: Assignment) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
                personnelComplete: efExport.personnelComplete || false,
                techSheet: migrateTechSheetData(efExport.techSheet, efExport as EventFrame),
            }));

            set({
                eventFrames: loadedEventFrames.sort((a: EventFrame,b: EventFrame) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)),
                peopleGroups: (data.peopleGroups || []).sort((a: PersonGroup,b: PersonGroup) => a.name.localeCompare(b.name)),
                materialItems: (data.materialItems || []).sort((a: MaterialItem,b: MaterialItem) => a.name.localeCompare(b.name)),
                hasUnsavedChanges: false,
                lastActionDescription: 'Dades carregades des d\'un arxiu',
            });
        },
    loadData: async (data: AppData | null) => {
        const { _applyDataToState } = get();
        const { clear: clearHistory } = useEventDataStore.temporal.getState();
        logger.info("Iniciant la càrrega de dades (sense Google)...", { hasData: !!data });

        if (!data) {
            set((state) => {
                Object.assign(state, initialState);
                state.lastActionDescription = 'Projecte netejat';
            });
            clearHistory();
            return { status: 'ok', message: 'Estat de l\'aplicació netejat.', type: 'info' };
        }

        const migratedData: AppData = { ...data, eventFrames: data.eventFrames.map((ef: EventFrameForExport) => ({ ...ef, techSheet: migrateTechSheetData(ef.techSheet, ef as EventFrame) })) };
        const validationResult = validateData(migratedData);

        if (validationResult.isValid) {
          _applyDataToState(migratedData);
          clearHistory();
          return { status: 'ok', message: "Dades carregades amb èxit.", type: 'success' };
        } else {
          const { repairedData, fixes } = repairData(migratedData, validationResult.errors);
          set({ dataRepairInfo: { repairedData, fixes } });
          return { status: 'needs_confirmation', fixes };
        }
      },
    loadGoogleConfigFromDataFile: async (data: AppData) => {
        const { refreshGoogleEvents } = get();
        if (data?.googleConfig) {
            try {
                const { activeAppCalendarId, managedAppCalendars } = data.googleConfig;
                const prevConfig = useGoogleConfigStore.getState();

                const newMergedConfig = {
                    activeCalendarId: activeAppCalendarId ?? prevConfig.activeCalendarId,
                    managedCalendars: managedAppCalendars ?? prevConfig.managedCalendars,
                    selectedIds: prevConfig.selectedIds, // Preserve existing selections
                };

                useGoogleConfigStore.setState(newMergedConfig);

                if (window.electronAPI?.saveGoogleConfig) {
                    await window.electronAPI.saveGoogleConfig({
                        activeAppCalendarId: newMergedConfig.activeCalendarId,
                        managedAppCalendars: newMergedConfig.managedCalendars,
                    });
                }

                await refreshGoogleEvents();
                return { success: true, message: 'Configuració de Google carregada i desada correctament.', type: 'success' };
            } catch (error) {
                logger.error("Error actualitzant la configuració de Google des del fitxer:", { error });
                return { success: false, message: "No s'ha pogut actualitzar la configuració de Google des del fitxer.", type: 'error' };
            }
        }
        return { success: true, message: 'No hi havia configuració de Google per carregar.', type: 'info' };
    },
    exportData: async () => {
        const { eventFrames, peopleGroups, materialItems } = get();
        const allAssignmentsList: Assignment[] = eventFrames.flatMap((ef: EventFrame) => ef.assignments);
        const eventFramesForExport: EventFrameForExport[] = eventFrames.map(({ assignments, ...restOfFrame }: EventFrame) => restOfFrame);
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
    addEventFrame: (newEventFrameData: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>) => {
        const newEventFrame: EventFrame = { ...newEventFrameData, id: generateId(), assignments: [], personnelComplete: false, techSheet: createDefaultTechSheet(newEventFrameData) };
        set((state: EventDataState) => {
            state.eventFrames.push(newEventFrame);
            state.eventFrames.sort((a: EventFrame,b: EventFrame) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has creat l'esdeveniment «${newEventFrame.name}»`;
        });
        return newEventFrame;
    },
    updateEventFrame: (updatedEventFrame: EventFrame) => {
        set((state: EventDataState) => {
            const frameIndex = state.eventFrames.findIndex(ef => ef.id === updatedEventFrame.id);
            if (frameIndex !== -1) {
                state.eventFrames[frameIndex] = updatedEventFrame;
            }
            state.eventFrames.sort((a: EventFrame,b: EventFrame) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has modificat l'esdeveniment «${updatedEventFrame.name}»`;
        });
    },
    deleteEventFrame: (eventFrameId: string) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state: EventDataState) => {
            state.eventFrames = state.eventFrames.filter((ef: EventFrame) => ef.id !== eventFrameId);
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit l'esdeveniment «${eventFrameName}»`;
        });
    },
    getEventFrameById: (eventFrameId: string) => get().eventFrames.find((ef: EventFrame) => ef.id === eventFrameId),
    setPersonnelComplete: (eventFrameId: string, complete: boolean) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state: EventDataState) => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.personnelComplete = complete;
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = complete
              ? `Has marcat el personal de «${eventFrameName}» com a completat`
              : `Has marcat el personal de «${eventFrameName}» com a pendent`;
        });
    },
    addOrUpdateTechSheet: (eventFrameId: string, techSheetData: TechSheetData) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state: EventDataState) => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.techSheet = techSheetData;
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has actualitzat la fitxa tècnica de «${eventFrameName}»`;
        });
    },
    reorderTechnicalProviders: (eventFrameId: string, reorderedProviders: TechSheetProvider[]) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set(state => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame && frame.techSheet) {
                frame.techSheet.technicalProviders = reorderedProviders;
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has reordenat el personal tècnic de «${eventFrameName}»`;
        });
    },

    // ASSIGNMENTS
    addAssignment: (eventFrameId: string, newAssignmentData: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>, force = false) => {
        const { eventFrames, peopleGroups } = get();
        const eventFrame = eventFrames.find((ef: EventFrame) => ef.id === eventFrameId);
        if (!eventFrame) return { success: false, message: "Marc d'esdeveniment no trobat." };

        if (!force && (newAssignmentData.status === AssignmentStatus.Yes || newAssignmentData.status === AssignmentStatus.Pending)) {
            const allOtherAssignments = get().eventFrames.flatMap(ef => ef.assignments.filter(a => a.personGroupId === newAssignmentData.personGroupId));
            const newStartDate = new Date(newAssignmentData.startDate);
            const newEndDate = new Date(newAssignmentData.endDate);

            for (let d = new Date(newStartDate); d <= newEndDate; d.setDate(d.getDate() + 1)) {
                const currentDateStr = d.toISOString().split('T')[0];
                const conflictingAssignments = allOtherAssignments.filter(existing => {
                    const existingStart = new Date(existing.startDate);
                    const existingEnd = new Date(existing.endDate);
                    if (d < existingStart || d > existingEnd) return false;

                    if (existing.status === AssignmentStatus.Yes || existing.status === AssignmentStatus.Pending) return true;
                    if (existing.status === AssignmentStatus.Mixed && existing.dailyStatuses?.[currentDateStr] && existing.dailyStatuses[currentDateStr] !== AssignmentStatus.No) return true;

                    return false;
                });

                if (conflictingAssignments.length > 0) {
                    const conflictDetails = conflictingAssignments.map(conflict => {
                        const conflictingEvent = get().eventFrames.find(ef => ef.id === conflict.eventFrameId);
                        return `"${conflictingEvent?.name}" el ${formatDateDMY(currentDateStr)}`;
                    }).join(", ");
                    return { success: true, warningMessage: `DUPLICATE_CONFLICT:Conflicte detectat: Aquest contacte ja té una assignació a ${conflictDetails}.` };
                }
            }
        }

        const newAssignment: Assignment = { ...newAssignmentData, id: generateId(), eventFrameId };
        const personName = peopleGroups.find(p => p.id === newAssignmentData.personGroupId)?.name || 'desconegut';
        set((state: EventDataState) => {
            const targetFrame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (targetFrame) {
                targetFrame.assignments.push(newAssignment);
                targetFrame.assignments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has assignat «${personName}» a l'esdeveniment «${eventFrame?.name ?? 'desconegut'}»`;
        });
        return { success: true };
    },
    updateAssignment: (updatedAssignment: Assignment, force = false, context?: { changedDate?: string }) => {
        let finalAssignment = { ...updatedAssignment };

        // Logic to recalculate main status from daily statuses
        if (finalAssignment.status === AssignmentStatus.Mixed && finalAssignment.dailyStatuses) {
            const dailyStatusValues = Object.values(finalAssignment.dailyStatuses);
            if (dailyStatusValues.length > 0) {
                const firstStatus = dailyStatusValues[0];
                const allSame = dailyStatusValues.every(s => s === firstStatus);
                if (allSame) {
                    finalAssignment.status = firstStatus;
                    finalAssignment.dailyStatuses = undefined;
                }
            }
        } else if (finalAssignment.status !== AssignmentStatus.Mixed) {
            finalAssignment.dailyStatuses = undefined;
        }

        let warningMessage: string | undefined = undefined;

        if (!force) {
            const allOtherAssignments = get().eventFrames.flatMap(ef =>
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
                        const conflictDetails = conflictingAssignments.map(conflict => `"${get().eventFrames.find(ef => ef.id === conflict.eventFrameId)?.name}" el ${formatDateDMY(currentDateStr)}`).join(", ");
                        return `Conflicte detectat: Aquest contacte ja té una assignació a ${conflictDetails}.`;
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

        const personName = get().peopleGroups.find(p => p.id === finalAssignment.personGroupId)?.name || 'desconegut';
        set(state => {
            const eventFrame = state.eventFrames.find(ef => ef.id === finalAssignment.eventFrameId);
            if (eventFrame) {
                const assignmentIndex = eventFrame.assignments.findIndex(a => a.id === finalAssignment.id);
                if (assignmentIndex !== -1) {
                    eventFrame.assignments[assignmentIndex] = finalAssignment;
                    eventFrame.assignments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                }
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has modificat l'assignació de «${personName}» a «${eventFrame?.name ?? 'desconegut'}»`;
        });

        return { success: true, warningMessage };
    },
    deleteAssignment: (eventFrameId: string, assignmentId: string) => {
        const assignment = get().getAssignmentById(eventFrameId, assignmentId);
        const personName = get().peopleGroups.find(p => p.id === assignment?.personGroupId)?.name || 'desconegut';
        set((state: EventDataState) => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.assignments = frame.assignments.filter((a: Assignment) => a.id !== assignmentId);
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit l'assignació de «${personName}» a «${frame?.name ?? 'desconegut'}»`;
        });
    },
    getAssignmentById: (eventFrameId: string, assignmentId: string) => get().eventFrames.find((ef: EventFrame) => ef.id === eventFrameId)?.assignments.find((a: Assignment) => a.id === assignmentId),

    // PEOPLE
    addPersonGroup: (newPersonGroupData: Omit<PersonGroup, 'id'>) => {
        const newPersonGroup: PersonGroup = { id: generateId(), ...newPersonGroupData };
        set((state: EventDataState) => {
            state.peopleGroups.push(newPersonGroup);
            state.peopleGroups.sort((a,b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Afegit contacte: '${newPersonGroup.name}'`;
        });
    },
    updatePersonGroup: (updatedPersonGroup: PersonGroup) => {
        set((state: EventDataState) => {
            const personIndex = state.peopleGroups.findIndex(p => p.id === updatedPersonGroup.id);
            if (personIndex !== -1) {
                state.peopleGroups[personIndex] = updatedPersonGroup;
            }
            state.peopleGroups.sort((a,b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Actualitzat contacte: '${updatedPersonGroup.name}'`;
        });
    },
    deletePersonGroup: (personGroupId: string) => {
        const personName = get().peopleGroups.find(p => p.id === personGroupId)?.name || 'desconegut';
        set(state => {
            state.peopleGroups = state.peopleGroups.filter((pg: PersonGroup) => pg.id !== personGroupId);
            state.eventFrames.forEach(ef => {
                ef.assignments = ef.assignments.filter((a: Assignment) => a.personGroupId !== personGroupId)
            });
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Eliminat contacte: '${personName}'`;
        });
    },
    getPersonGroupById: (personGroupId: string) => get().peopleGroups.find((pg: PersonGroup) => pg.id === personGroupId),
    mergePeopleGroups: (newPeople: PersonGroup[]) => {
        const existingNames = new Set(get().peopleGroups.map((p: PersonGroup) => p.name.toLowerCase()));
        const peopleToAdd = newPeople.filter((p: PersonGroup) => !existingNames.has(p.name.toLowerCase()));
        if (peopleToAdd.length > 0) {
            set((state: EventDataState) => {
                state.peopleGroups.push(...peopleToAdd);
                state.peopleGroups.sort((a, b) => a.name.localeCompare(b.name));
                state.hasUnsavedChanges = true;
                state.lastActionDescription = `Has afegit ${peopleToAdd.length} nous contactes a l'agenda`;
            });
            return { success: true, message: `${peopleToAdd.length} noves persones afegides.`, type: 'success' };
        } else {
            return { success: true, message: "Totes les persones del fitxer ja existeixen.", type: 'info' };
        }
    },
    replacePeopleGroups: (newPeople) => {
        set(state => {
            state.peopleGroups = newPeople.sort((a, b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = 'Has reemplaçat tota la llista de contactes';
        });
    },

    // MATERIAL
    addMaterialItem: (newItemData: Omit<MaterialItem, 'id'>) => {
        const newItem: MaterialItem = { ...newItemData, id: generateId() };
        set((state: EventDataState) => {
            state.materialItems.push(newItem);
            state.materialItems.sort((a,b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has afegit el material «${newItem.name}» a l'inventari`;
        });
        return newItem;
    },
    updateMaterialItem: (updatedItem: MaterialItem) => {
        set({ isUpdatingMaterial: true });
        set(state => {
            // 1. Actualitzar l'ítem mestre
            const itemIndex = state.materialItems.findIndex(item => item.id === updatedItem.id);
            if (itemIndex !== -1) {
                state.materialItems[itemIndex] = updatedItem;
            }
            state.materialItems.sort((a, b) => a.name.localeCompare(b.name));

            // 2. Propagar canvis a tota l'app
            const needsKeys: (keyof TechSheetData)[] = [
                'lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment',
                'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'
            ];

            state.eventFrames.forEach(eventFrame => {
                if (!eventFrame.techSheet) return;

                needsKeys.forEach(key => {
                    const section = eventFrame.techSheet![key];
                    if (section && typeof section === 'object' && 'status' in section && section.status === 'yes' && 'data' in section && section.data && Array.isArray(section.data.needs)) {
                        section.data.needs.forEach((needItem: NeedItem) => {
                            if (needItem.materialItemId === updatedItem.id) {
                                needItem.description = updatedItem.name;
                                needItem.origin = updatedItem.location;
                            }
                        });
                    }
                });
            });
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has modificat el material «${updatedItem.name}» de l'inventari`;
        });
        setTimeout(() => set({ isUpdatingMaterial: false }), 0);
    },
    deleteMaterialItem: (itemId: string) => {
        const itemName = get().materialItems.find(i => i.id === itemId)?.name || 'desconegut';
        set((state: EventDataState) => {
            state.materialItems = state.materialItems.filter((item: MaterialItem) => item.id !== itemId);
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit el material «${itemName}» de l'inventari`;
        });
    },
    addMaterialItemsFromFile: (newItems: MaterialItem[]) => {
        const existingNames = new Set(get().materialItems.map(item => item.name.toLowerCase()));
        const itemsToAdd = newItems.filter((newItem: MaterialItem) => !existingNames.has(newItem.name.toLowerCase()));
        if (itemsToAdd.length > 0) {
            set((state: EventDataState) => {
                state.materialItems.push(...itemsToAdd);
                state.materialItems.sort((a,b) => a.name.localeCompare(b.name));
                state.hasUnsavedChanges = true;
                state.lastActionDescription = `Fusionats ${itemsToAdd.length} articles de material`;
            });
            return { success: true, message: `${itemsToAdd.length} nous articles de material afegits.`, type: 'success' };
        } else {
            return { success: true, message: "Tots els articles del fitxer ja existeixen.", type: 'info' };
        }
    },
    replaceMaterialItems: (newItems) => {
        set(state => {
            state.materialItems = newItems.sort((a, b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = 'Reemplaçat l\'inventari de material';
        });
    },
    getMaterialAvailability: (materialId: string, startDate: string, endDate: string, currentEventFrameId: string, currentItemId?: string) => {
        const { materialItems, eventFrames } = get();
        const materialItem = materialItems.find(item => item.id === materialId);
        if (!materialItem) return { available: 0, total: 0 };

        let committedInCurrentEvent = 0;
        const currentEventFrame = eventFrames.find(ef => ef.id === currentEventFrameId);
        if (currentEventFrame?.techSheet) {
            const needsKeys: (keyof TechSheetData)[] = [
                'lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment',
                'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'
            ];
            needsKeys.forEach(key => {
                const section = currentEventFrame.techSheet![key];
                if (section && section.status === 'yes' && Array.isArray((section as any).data?.needs)) {
                    (section as any).data.needs.forEach((need: NeedItem) => {
                        if (need.materialItemId === materialId && need.id !== currentItemId) {
                            committedInCurrentEvent += Number(need.quantity) || 0;
                        }
                    });
                }
            });
        }

        let minAvailable = materialItem.stock;
        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            let dailyCommittedStock = 0;
            eventFrames.forEach(ef => {
                if (ef.id === currentEventFrameId) return;
                if (currentDate >= new Date(ef.startDate) && currentDate <= new Date(ef.endDate)) {
                    Object.values(ef.techSheet || {}).forEach(section => {
                        if (section && section.status === 'yes' && Array.isArray((section as any).data?.needs)) {
                            (section as any).data.needs.forEach((need: NeedItem) => {
                                if (need.materialItemId === materialId) {
                                    dailyCommittedStock += Number(need.quantity) || 0;
                                }
                            });
                        }
                    });
                }
            });
            minAvailable = Math.min(minAvailable, materialItem.stock - dailyCommittedStock);
        }
        return { total: materialItem.stock, available: minAvailable - committedInCurrentEvent };
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
        const { openModal, closeModal } = useModalStore.getState();
        const { executeSync } = get();

        if (window.electronAPI?.loadGoogleConfig) {
            const config = await window.electronAPI.loadGoogleConfig();
            if (!config || !config.managedAppCalendars || config.managedAppCalendars.length === 0) {
                openModal('googleSettings');
                return;
            }
            openModal('selectSyncCalendar', {
                managedCalendars: config.managedAppCalendars,
                activeCalendarId: config.activeAppCalendarId,
                onConfirmSync: (targetCalendarId: string) => {
                    closeModal();
                    executeSync(targetCalendarId);
                }
            });
        } else {
            logger.warn("L'API d'Electron per a Google Config no està disponible.");
        }
    },
    executeSync: async (targetCalendarId) => {
        const { exportData, loadData, refreshGoogleEvents } = get();
        let finalResult: any = { success: false, message: 'La sincronització no es va completar.', type: 'error' };

        set({ 
          isSyncing: true, 
          syncProgress: { 
            current: 0, 
            total: 0, 
            message: 'Iniciant...', 
            visible: true, 
            logs: ['[INFO] Iniciant procés de sincronització...'] 
          } 
        });

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

    // ARCHIVING
    archiveOldEventFrames: () => {
        const { eventFrames } = get();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return eventFrames.filter(ef => {
            const endDate = new Date(ef.endDate);
            return endDate < oneWeekAgo && !ef.isArchived;
        });
    },

    confirmArchiveEventFrames: (eventFrameIds: string[]) => {
        set(state => {
            const idsToArchive = new Set(eventFrameIds);
            state.eventFrames.forEach(ef => {
                if (idsToArchive.has(ef.id)) {
                    ef.isArchived = true;
                }
            });
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has arxivat ${eventFrameIds.length} esdeveniments antics`;
        });
    },

    restoreEventFrame: (eventFrameId: string) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set(state => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.isArchived = false;
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has restaurat l'esdeveniment «${eventFrameName}»`;
        });
    },
    })),
        {
            // Memoització superficial per evitar objectes nous si l'estat no canvia
            partialize: (() => {
                let last: PartializedState | undefined;
                let lastVals: [EventFrame[], PersonGroup[], MaterialItem[], string | null] | undefined;
                return (state) => {
                    const vals: [EventFrame[], PersonGroup[], MaterialItem[], string | null] = [state.eventFrames, state.peopleGroups, state.materialItems, state.lastActionDescription];
                    if (lastVals && vals.every((v, i) => v === lastVals![i])) {
                        return last!;
                    }
                    lastVals = vals;
                    last = { eventFrames: vals[0], peopleGroups: vals[1], materialItems: vals[2], lastActionDescription: vals[3] };
                    return last;
                };
            })(),
            limit: 20,
        }
  )
);

type PartializedState = Pick<EventDataState, 'eventFrames' | 'peopleGroups' | 'materialItems' | 'lastActionDescription'>;

export const useTemporalStore = <T,>(
    selector: (state: TemporalState<PartializedState>) => T
) => {
    return useStore(useEventDataStore.temporal, selector);
};

// --- Selectors ---

export const selectAvailableOrigins = (state: EventDataState): string[] => {
  const origins = new Set(state.materialItems.map(item => item.location));
  return Array.from(origins).sort((a, b) => a.localeCompare(b));
};

export interface MaterialControlFilters {
  selectedEventIds?: string[];
  selectedOrigins?: string[];
  selectedCategories?: string[];
  searchText?: string;
  dateRange?: { start?: string; end?: string };
}

export const selectMaterialControlData = (
  state: EventDataState,
  filters: MaterialControlFilters
): MaterialControlRow[] => {
  const { selectedEventIds, dateRange, selectedOrigins, selectedCategories, searchText } = filters;
  const { materialItems, eventFrames } = state;

  const isPeakDemandActive = (selectedEventIds && selectedEventIds.length > 0) || (dateRange && (dateRange.start || dateRange.end));

  if (!isPeakDemandActive) {
    // Comportament per defecte: mostra tots els materials sense demanda.
    const allRows = materialItems.map(item => ({
      item,
      totalDemand: 0,
      balance: item.stock,
      breakdown: [],
    }));

    // Aplica filtres simples que no depenen de la demanda.
    return allRows.filter(row => {
      if (selectedOrigins && selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location)) return false;
      if (selectedCategories && selectedCategories.length > 0 && !selectedCategories.includes(row.item.category)) return false;
      if (searchText && searchText.trim()) {
        const lowerCaseSearch = searchText.toLowerCase();
        return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
               row.item.category.toLowerCase().includes(lowerCaseSearch) ||
               row.item.location.toLowerCase().includes(lowerCaseSearch);
      }
      return true;
    });
  }

  // --- Càlcul de Pic de Demanda Activat ---

  // 1. Determina els esdeveniments rellevants.
  let relevantEvents = eventFrames;
  if (selectedEventIds && selectedEventIds.length > 0) {
    const eventIdSet = new Set(selectedEventIds);
    relevantEvents = eventFrames.filter(ef => eventIdSet.has(ef.id));
  } else if (dateRange && (dateRange.start || dateRange.end)) {
    relevantEvents = eventFrames.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const filterStart = dateRange.start ? new Date(dateRange.start) : null;
      const filterEnd = dateRange.end ? new Date(dateRange.end) : null;
      if (filterStart && eventEnd < filterStart) return false;
      if (filterEnd) {
          const inclusiveFilterEnd = new Date(filterEnd);
          inclusiveFilterEnd.setDate(inclusiveFilterEnd.getDate() + 1);
          if (eventStart >= inclusiveFilterEnd) return false;
      }
      return true;
    });
  }

  // 2. Extreu totes les necessitats de material dels esdeveniments rellevants.
  const allNeeds: ({ itemId: string; quantity: number; event: EventFrame })[] = [];
  relevantEvents.forEach(event => {
    if (!event.techSheet) return;
    const needsKeys: (keyof TechSheetData)[] = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
    needsKeys.forEach(key => {
      const section = event.techSheet![key];
      if (section && section.status === 'yes' && 'data' in section && section.data && Array.isArray((section.data as any).needs)) {
        (section.data as any).needs.forEach((need: NeedItem) => {
          if (need.materialItemId && need.quantity) {
            const numericQuantity = Number(need.quantity);
            if (!isNaN(numericQuantity) && numericQuantity > 0) {
              allNeeds.push({ itemId: need.materialItemId, quantity: numericQuantity, event });
            }
          }
        });
      }
    });
  });

  // 3. Construeix les files de resultats per a cada ítem de material.
  const resultRows: MaterialControlRow[] = materialItems.map(item => {
    const itemNeeds = allNeeds.filter(need => need.itemId === item.id);
    if (itemNeeds.length === 0) {
      return { item, totalDemand: 0, balance: item.stock, breakdown: [] };
    }

    // Troba el rang de dates global per a aquest ítem.
    const allDates = itemNeeds.flatMap(need => [new Date(need.event.startDate), new Date(need.event.endDate)]);
    const minDate = new Date(Math.min.apply(null, allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max.apply(null, allDates.map(d => d.getTime())));

    // Calcula el pic de demanda dia a dia.
    let peakDemand = 0;
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      let dailyDemand = 0;
      itemNeeds.forEach(need => {
        const eventStart = new Date(need.event.startDate);
        const eventEnd = new Date(need.event.endDate);
        if (d >= eventStart && d <= eventEnd) {
          dailyDemand += need.quantity;
        }
      });
      if (dailyDemand > peakDemand) {
        peakDemand = dailyDemand;
      }
    }

    // Construeix el desglossament.
    const breakdown = itemNeeds.map(need => ({
      eventFrameId: need.event.id,
      eventName: need.event.name,
      quantity: need.quantity,
      startDate: need.event.startDate,
      endDate: need.event.endDate,
    }));

    return {
      item,
      totalDemand: peakDemand,
      balance: item.stock - peakDemand,
      breakdown,
    };
  });

  // 4. Aplica filtres finals.
  return resultRows.filter(row => {
    // Amaga files sense demanda si el filtre d'esdeveniments està actiu.
    if (row.totalDemand === 0 && selectedEventIds && selectedEventIds.length > 0) {
        return false;
    }
    if (selectedOrigins && selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location)) return false;
    if (selectedCategories && selectedCategories.length > 0 && !selectedCategories.includes(row.item.category)) return false;
    if (searchText && searchText.trim()) {
      const lowerCaseSearch = searchText.toLowerCase();
      return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
             row.item.category.toLowerCase().includes(lowerCaseSearch) ||
             row.item.location.toLowerCase().includes(lowerCaseSearch);
    }
    return true;
  });
};
