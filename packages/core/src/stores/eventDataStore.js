import { create } from 'zustand';
// import eliminat: useStoreWithEqualityFn
import { useStore } from 'zustand';
import { temporal } from 'zundo';
// Persistence adapter (set during app init)
let persistenceAdapter = null;
export const initializeEventDataStore = (adapter) => {
    persistenceAdapter = adapter;
};
import { AssignmentStatus } from '../types';
import { formatDateDMY } from '../utils/dateFormat';
import { migrateTechSheetData } from '../utils/techSheetMigration';
import { validateData, repairData } from '../utils/dataIntegrity';
import { logger } from '../utils/logger';
import { immer } from 'zustand/middleware/immer';
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const createDefaultTechSheet = (eventFrame) => {
    const defaultConditional = () => ({ status: 'unset', details: '', needs: [] });
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
const initialState = {
    eventFrames: [],
    peopleGroups: [],
    materialItems: [],
    googleEvents: [],
    hasUnsavedChanges: false,
    isSyncing: false,
    isUpdatingMaterial: false,
    syncProgress: { current: 0, total: 0, message: '', visible: false },
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
    manualExpandedFrameIds: new Set(),
};
export const useEventDataStore = create()(temporal(immer((set, get) => ({
    ...initialState,
    setIsUpdatingMaterial: (isUpdating) => set({ isUpdatingMaterial: isUpdating }),
    undoAndGetDescription: () => {
        const { temporal } = useEventDataStore;
        const currentDescription = get().lastActionDescription;
        temporal.getState().undo();
        return { undoneActionDescription: currentDescription };
    },
    redoAndGetDescription: () => {
        const { temporal } = useEventDataStore;
        temporal.getState().redo();
        const newDescription = get().lastActionDescription;
        return { redoneActionDescription: newDescription };
    },
    clearDataRepairInfo: () => set({ dataRepairInfo: null }),
    // UTILS
    setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
    setFilterUIEventFrame: (id) => set({ filterUIEventFrame: id }),
    setHighlightedEventId: (id) => set({ highlightedEventId: id }),
    // FILTRES CENTRALITZATS
    setFilterText: (text) => set({ filterText: text }),
    setFilterStatus: (status) => set({ filterStatus: status }),
    setFilterDate: (date) => set({ filterDate: date }),
    setLocalFilterUIPerson: (personId) => set({ localFilterUIPerson: personId }),
    setFilterPlace: (place) => set({ filterPlace: place }),
    clearAllFilters: () => set({
        filterText: '',
        filterStatus: '',
        filterDate: '',
        localFilterUIPerson: '',
        filterPlace: '',
        filterUIEventFrame: null,
        highlightedEventId: null
    }),
    setSyncProgress: (progress) => set({ syncProgress: progress }),
    showAndHighlightEvent: (eventId) => {
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
    setManualExpandedFrameIds: (updater) => {
        const oldSet = get().manualExpandedFrameIds;
        const newSet = updater(oldSet);
        logger.info('[eventDataStore] setManualExpandedFrameIds called.', { from: Array.from(oldSet), to: Array.from(newSet) });
        set({ manualExpandedFrameIds: newSet });
    },
    toggleEventListExpanded: () => set((state) => ({ isEventListExpanded: !state.isEventListExpanded })),
    // DATA HYDRATION
    _applyDataToState: (data) => {
        const loadedEventFrames = (data.eventFrames || []).map((efExport) => ({
            ...efExport,
            assignments: (data.assignments || []).filter((a) => a.eventFrameId === efExport.id).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
            personnelComplete: efExport.personnelComplete || false,
            techSheet: migrateTechSheetData(efExport.techSheet, efExport),
        }));
        set({
            eventFrames: loadedEventFrames.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name)),
            peopleGroups: (data.peopleGroups || []).sort((a, b) => a.name.localeCompare(b.name)),
            materialItems: (data.materialItems || []).sort((a, b) => a.name.localeCompare(b.name)),
            hasUnsavedChanges: false,
            lastActionDescription: 'Dades carregades des d\'un arxiu',
        });
    },
    loadData: async (data) => {
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
        const migratedData = { ...data, eventFrames: data.eventFrames.map((ef) => ({ ...ef, techSheet: migrateTechSheetData(ef.techSheet, ef) })) };
        const validationResult = validateData(migratedData);
        if (validationResult.isValid) {
            _applyDataToState(migratedData);
            clearHistory();
            return { status: 'ok', message: "Dades carregades amb èxit.", type: 'success' };
        }
        else {
            const { repairedData, fixes } = repairData(migratedData, validationResult.errors);
            set({ dataRepairInfo: { repairedData, fixes } });
            return { status: 'needs_confirmation', fixes };
        }
    },
    loadGoogleConfigFromDataFile: async (data) => {
        // Nota: La lògica de Google s'ha mogut a desktopActions.ts per trencar el cicle de dependències
        // Aquesta funció només retorna un missatge informatiu si hi ha configuració de Google al fitxer
        if (data?.googleConfig) {
            return { success: true, message: 'Configuració de Google detectada al fitxer. Utilitza les funcions de desktopActions per gestionar-la.', type: 'info' };
        }
        return { success: true, message: 'No hi havia configuració de Google per carregar.', type: 'info' };
    },
    exportData: async () => {
        const { eventFrames, peopleGroups, materialItems } = get();
        const allAssignmentsList = eventFrames.flatMap((ef) => ef.assignments);
        const eventFramesForExport = eventFrames.map(({ assignments, ...restOfFrame }) => restOfFrame);
        let googleConfigForExport = undefined;
        if (persistenceAdapter?.loadGoogleConfig) {
            const fullConfig = await persistenceAdapter.loadGoogleConfig();
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
        const newEventFrame = { ...newEventFrameData, id: generateId(), assignments: [], personnelComplete: false, techSheet: createDefaultTechSheet(newEventFrameData) };
        set((state) => {
            state.eventFrames.push(newEventFrame);
            state.eventFrames.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has creat l'esdeveniment «${newEventFrame.name}»`;
        });
        return newEventFrame;
    },
    updateEventFrame: (updatedEventFrame) => {
        set((state) => {
            const frameIndex = state.eventFrames.findIndex(ef => ef.id === updatedEventFrame.id);
            if (frameIndex !== -1) {
                state.eventFrames[frameIndex] = updatedEventFrame;
            }
            state.eventFrames.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has modificat l'esdeveniment «${updatedEventFrame.name}»`;
        });
    },
    deleteEventFrame: (eventFrameId) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state) => {
            state.eventFrames = state.eventFrames.filter((ef) => ef.id !== eventFrameId);
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit l'esdeveniment «${eventFrameName}»`;
        });
    },
    getEventFrameById: (eventFrameId) => get().eventFrames.find((ef) => ef.id === eventFrameId),
    setPersonnelComplete: (eventFrameId, complete) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state) => {
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
    addOrUpdateTechSheet: (eventFrameId, techSheetData) => {
        const eventFrameName = get().eventFrames.find(ef => ef.id === eventFrameId)?.name || 'desconegut';
        set((state) => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.techSheet = techSheetData;
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has actualitzat la fitxa tècnica de «${eventFrameName}»`;
        });
    },
    reorderTechnicalProviders: (eventFrameId, reorderedProviders) => {
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
    addAssignment: (eventFrameId, newAssignmentData, force = false) => {
        const { eventFrames, peopleGroups } = get();
        const eventFrame = eventFrames.find((ef) => ef.id === eventFrameId);
        if (!eventFrame)
            return { success: false, message: "Marc d'esdeveniment no trobat." };
        if (!force && (newAssignmentData.status === AssignmentStatus.Yes || newAssignmentData.status === AssignmentStatus.Pending)) {
            const allOtherAssignments = get().eventFrames.flatMap(ef => ef.assignments.filter(a => a.personGroupId === newAssignmentData.personGroupId));
            const newStartDate = new Date(newAssignmentData.startDate);
            const newEndDate = new Date(newAssignmentData.endDate);
            for (let d = new Date(newStartDate); d <= newEndDate; d.setDate(d.getDate() + 1)) {
                const currentDateStr = d.toISOString().split('T')[0];
                const conflictingAssignments = allOtherAssignments.filter(existing => {
                    const existingStart = new Date(existing.startDate);
                    const existingEnd = new Date(existing.endDate);
                    if (d < existingStart || d > existingEnd)
                        return false;
                    if (existing.status === AssignmentStatus.Yes || existing.status === AssignmentStatus.Pending)
                        return true;
                    if (existing.status === AssignmentStatus.Mixed && existing.dailyStatuses?.[currentDateStr] && existing.dailyStatuses[currentDateStr] !== AssignmentStatus.No)
                        return true;
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
        const newAssignment = { ...newAssignmentData, id: generateId(), eventFrameId };
        const personName = peopleGroups.find(p => p.id === newAssignmentData.personGroupId)?.name || 'desconegut';
        set((state) => {
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
    updateAssignment: (updatedAssignment, force = false, context) => {
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
        }
        else if (finalAssignment.status !== AssignmentStatus.Mixed) {
            finalAssignment.dailyStatuses = undefined;
        }
        let warningMessage = undefined;
        if (!force) {
            const allOtherAssignments = get().eventFrames.flatMap(ef => ef.assignments.filter(a => a.personGroupId === finalAssignment.personGroupId && a.id !== finalAssignment.id));
            const checkDateRange = (start, end, statusToCheck) => {
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const currentDateStr = d.toISOString().split('T')[0];
                    let currentDayStatus;
                    if (typeof statusToCheck === 'string') {
                        currentDayStatus = statusToCheck;
                    }
                    else {
                        currentDayStatus = statusToCheck[currentDateStr];
                    }
                    if (!currentDayStatus || currentDayStatus === AssignmentStatus.No)
                        continue;
                    const conflictingAssignments = allOtherAssignments.filter(existing => {
                        const existingStart = new Date(existing.startDate);
                        const existingEnd = new Date(existing.endDate);
                        if (d < existingStart || d > existingEnd)
                            return false;
                        if (existing.status === AssignmentStatus.Yes || existing.status === AssignmentStatus.Pending)
                            return true;
                        if (existing.status === AssignmentStatus.Mixed && existing.dailyStatuses?.[currentDateStr] && existing.dailyStatuses[currentDateStr] !== AssignmentStatus.No)
                            return true;
                        return false;
                    });
                    if (conflictingAssignments.length > 0) {
                        const conflictDetails = conflictingAssignments.map(conflict => `"${get().eventFrames.find(ef => ef.id === conflict.eventFrameId)?.name}" el ${formatDateDMY(currentDateStr)}`).join(", ");
                        return `Conflicte detectat: Aquest contacte ja té una assignació a ${conflictDetails}.`;
                    }
                }
                return null;
            };
            let conflictMessage = null;
            if (finalAssignment.status !== AssignmentStatus.No) {
                if (context?.changedDate) {
                    const specificDate = new Date(context.changedDate);
                    conflictMessage = checkDateRange(specificDate, specificDate, finalAssignment.dailyStatuses || finalAssignment.status);
                }
                else {
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
    deleteAssignment: (eventFrameId, assignmentId) => {
        const assignment = get().getAssignmentById(eventFrameId, assignmentId);
        const personName = get().peopleGroups.find(p => p.id === assignment?.personGroupId)?.name || 'desconegut';
        set((state) => {
            const frame = state.eventFrames.find(ef => ef.id === eventFrameId);
            if (frame) {
                frame.assignments = frame.assignments.filter((a) => a.id !== assignmentId);
            }
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit l'assignació de «${personName}» a «${frame?.name ?? 'desconegut'}»`;
        });
    },
    getAssignmentById: (eventFrameId, assignmentId) => get().eventFrames.find((ef) => ef.id === eventFrameId)?.assignments.find((a) => a.id === assignmentId),
    // PEOPLE
    addPersonGroup: (newPersonGroupData) => {
        const newPersonGroup = { id: generateId(), ...newPersonGroupData };
        set((state) => {
            state.peopleGroups.push(newPersonGroup);
            state.peopleGroups.sort((a, b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Afegit contacte: '${newPersonGroup.name}'`;
        });
    },
    updatePersonGroup: (updatedPersonGroup) => {
        set((state) => {
            const personIndex = state.peopleGroups.findIndex(p => p.id === updatedPersonGroup.id);
            if (personIndex !== -1) {
                state.peopleGroups[personIndex] = updatedPersonGroup;
            }
            state.peopleGroups.sort((a, b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Actualitzat contacte: '${updatedPersonGroup.name}'`;
        });
    },
    deletePersonGroup: (personGroupId) => {
        const personName = get().peopleGroups.find(p => p.id === personGroupId)?.name || 'desconegut';
        set(state => {
            state.peopleGroups = state.peopleGroups.filter((pg) => pg.id !== personGroupId);
            state.eventFrames.forEach(ef => {
                ef.assignments = ef.assignments.filter((a) => a.personGroupId !== personGroupId);
            });
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Eliminat contacte: '${personName}'`;
        });
    },
    getPersonGroupById: (personGroupId) => get().peopleGroups.find((pg) => pg.id === personGroupId),
    mergePeopleGroups: (newPeople) => {
        const existingNames = new Set(get().peopleGroups.map((p) => p.name.toLowerCase()));
        const peopleToAdd = newPeople.filter((p) => !existingNames.has(p.name.toLowerCase()));
        if (peopleToAdd.length > 0) {
            set((state) => {
                state.peopleGroups.push(...peopleToAdd);
                state.peopleGroups.sort((a, b) => a.name.localeCompare(b.name));
                state.hasUnsavedChanges = true;
                state.lastActionDescription = `Has afegit ${peopleToAdd.length} nous contactes a l'agenda`;
            });
            return { success: true, message: `${peopleToAdd.length} noves persones afegides.`, type: 'success' };
        }
        else {
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
    addMaterialItem: (newItemData) => {
        const newItem = { ...newItemData, id: generateId() };
        set((state) => {
            state.materialItems.push(newItem);
            state.materialItems.sort((a, b) => a.name.localeCompare(b.name));
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has afegit el material «${newItem.name}» a l'inventari`;
        });
        return newItem;
    },
    updateMaterialItem: (updatedItem) => {
        set({ isUpdatingMaterial: true });
        set(state => {
            // 1. Actualitzar l'ítem mestre
            const itemIndex = state.materialItems.findIndex(item => item.id === updatedItem.id);
            if (itemIndex !== -1) {
                state.materialItems[itemIndex] = updatedItem;
            }
            state.materialItems.sort((a, b) => a.name.localeCompare(b.name));
            // 2. Propagar canvis a tota l'app
            const needsKeys = [
                'lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment',
                'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'
            ];
            state.eventFrames.forEach(eventFrame => {
                if (!eventFrame.techSheet)
                    return;
                needsKeys.forEach(key => {
                    const section = eventFrame.techSheet[key];
                    if (section && typeof section === 'object' && 'status' in section && section.status === 'yes' && 'data' in section && section.data && Array.isArray(section.data.needs)) {
                        section.data.needs.forEach((needItem) => {
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
    deleteMaterialItem: (itemId) => {
        const itemName = get().materialItems.find(i => i.id === itemId)?.name || 'desconegut';
        set((state) => {
            state.materialItems = state.materialItems.filter((item) => item.id !== itemId);
            state.hasUnsavedChanges = true;
            state.lastActionDescription = `Has suprimit el material «${itemName}» de l'inventari`;
        });
    },
    addMaterialItemsFromFile: (newItems) => {
        const existingNames = new Set(get().materialItems.map(item => item.name.toLowerCase()));
        const itemsToAdd = newItems.filter((newItem) => !existingNames.has(newItem.name.toLowerCase()));
        if (itemsToAdd.length > 0) {
            set((state) => {
                state.materialItems.push(...itemsToAdd);
                state.materialItems.sort((a, b) => a.name.localeCompare(b.name));
                state.hasUnsavedChanges = true;
                state.lastActionDescription = `Fusionats ${itemsToAdd.length} articles de material`;
            });
            return { success: true, message: `${itemsToAdd.length} nous articles de material afegits.`, type: 'success' };
        }
        else {
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
    getMaterialAvailability: (materialId, startDate, endDate, currentEventFrameId, currentItemId) => {
        const { materialItems, eventFrames } = get();
        const materialItem = materialItems.find(item => item.id === materialId);
        if (!materialItem)
            return { available: 0, total: 0 };
        let committedInCurrentEvent = 0;
        const currentEventFrame = eventFrames.find(ef => ef.id === currentEventFrameId);
        if (currentEventFrame?.techSheet) {
            const needsKeys = [
                'lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment',
                'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'
            ];
            needsKeys.forEach(key => {
                const section = currentEventFrame.techSheet[key];
                if (section && section.status === 'yes' && Array.isArray(section.data?.needs)) {
                    section.data.needs.forEach((need) => {
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
                if (ef.id === currentEventFrameId)
                    return;
                if (currentDate >= new Date(ef.startDate) && currentDate <= new Date(ef.endDate)) {
                    Object.values(ef.techSheet || {}).forEach(section => {
                        if (section && section.status === 'yes' && Array.isArray(section.data?.needs)) {
                            section.data.needs.forEach((need) => {
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
    // Nota: Les funcions relacionades amb Google (refreshGoogleEvents, syncWithGoogle, executeSync)
    // s'han mogut a desktopActions.ts per trencar el cicle de dependències i mantenir aquest store agnòstic de la plataforma
    // ARCHIVING
    archiveOldEventFrames: () => {
        const { eventFrames } = get();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return eventFrames.filter(ef => {
            const endDate = new Date(ef.endDate);
            return endDate < oneMonthAgo && !ef.isArchived;
        });
    },
    confirmArchiveEventFrames: (eventFrameIds) => {
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
    restoreEventFrame: (eventFrameId) => {
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
})), {
    // Memoització superficial per evitar objectes nous si l'estat no canvia
    partialize: (() => {
        let last;
        let lastVals;
        return (state) => {
            const vals = [state.eventFrames, state.peopleGroups, state.materialItems, state.lastActionDescription];
            if (lastVals && vals.every((v, i) => v === lastVals[i])) {
                return last;
            }
            lastVals = vals;
            last = { eventFrames: vals[0], peopleGroups: vals[1], materialItems: vals[2], lastActionDescription: vals[3] };
            return last;
        };
    })(),
    limit: 20,
}));
export const useTemporalStore = (selector) => {
    return useStore(useEventDataStore.temporal, selector);
};
// --- Selectors ---
export const selectAvailableOrigins = (state) => {
    const origins = new Set(state.materialItems.map(item => item.location));
    return Array.from(origins).sort((a, b) => a.localeCompare(b));
};
export const selectMaterialControlData = (state, filters) => {
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
            if (selectedOrigins && selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location))
                return false;
            if (selectedCategories && selectedCategories.length > 0 && !selectedCategories.includes(row.item.category))
                return false;
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
    }
    else if (dateRange && (dateRange.start || dateRange.end)) {
        relevantEvents = eventFrames.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            const filterStart = dateRange.start ? new Date(dateRange.start) : null;
            const filterEnd = dateRange.end ? new Date(dateRange.end) : null;
            if (filterStart && eventEnd < filterStart)
                return false;
            if (filterEnd) {
                const inclusiveFilterEnd = new Date(filterEnd);
                inclusiveFilterEnd.setDate(inclusiveFilterEnd.getDate() + 1);
                if (eventStart >= inclusiveFilterEnd)
                    return false;
            }
            return true;
        });
    }
    // 2. Extreu totes les necessitats de material dels esdeveniments rellevants.
    const allNeeds = [];
    relevantEvents.forEach(event => {
        if (!event.techSheet)
            return;
        const needsKeys = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
        needsKeys.forEach(key => {
            const section = event.techSheet[key];
            if (section && section.status === 'yes' && 'data' in section && section.data && Array.isArray(section.data.needs)) {
                section.data.needs.forEach((need) => {
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
    const resultRows = materialItems.map(item => {
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
        if (selectedOrigins && selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location))
            return false;
        if (selectedCategories && selectedCategories.length > 0 && !selectedCategories.includes(row.item.category))
            return false;
        if (searchText && searchText.trim()) {
            const lowerCaseSearch = searchText.toLowerCase();
            return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
                row.item.category.toLowerCase().includes(lowerCaseSearch) ||
                row.item.location.toLowerCase().includes(lowerCaseSearch);
        }
        return true;
    });
};
//# sourceMappingURL=eventDataStore.js.map