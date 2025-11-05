import { TemporalState } from 'zundo';
import type { PersistenceAdapter } from '../persistenceAdapter';
export declare const initializeEventDataStore: (adapter: PersistenceAdapter) => void;
import { AssignmentStatus } from '../types';
import type { EventFrame, PersonGroup, Assignment, AppData, TechSheetData, MaterialItem, SyncProgressState, AssignmentOperationResult, MaterialControlRow, TechSheetProvider } from '../types';
export interface EventDataState {
    eventFrames: EventFrame[];
    peopleGroups: PersonGroup[];
    materialItems: MaterialItem[];
    googleEvents: any[];
    hasUnsavedChanges: boolean;
    isSyncing: boolean;
    isUpdatingMaterial: boolean;
    syncProgress: SyncProgressState;
    dataRepairInfo: {
        fixes: any[];
        repairedData: AppData;
    } | null;
    filterUIEventFrame: string | null;
    highlightedEventId: string | null;
    lastActionDescription: string | null;
    filterText: string;
    filterStatus: AssignmentStatus | '';
    filterDate: string;
    localFilterUIPerson: string;
    filterPlace: string;
    isEventListExpanded: boolean;
    manualExpandedFrameIds: Set<string>;
}
interface EventDataActions {
    setFilterUIEventFrame: (id: string | null) => void;
    setHighlightedEventId: (id: string | null) => void;
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
    updateAssignment: (assignment: Assignment, force?: boolean, context?: {
        changedDate?: string;
    }) => AssignmentOperationResult;
    deleteAssignment: (eventFrameId: string, assignmentId: string) => void;
    getAssignmentById: (eventFrameId: string, assignmentId: string) => Assignment | undefined;
    loadData: (data: AppData | null) => Promise<{
        status: 'ok' | 'needs_confirmation' | 'error';
        fixes?: string[];
        message?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
    }>;
    loadGoogleConfigFromDataFile: (data: AppData) => Promise<{
        success: boolean;
        message?: string;
        type?: 'success' | 'error' | 'info' | 'warning';
    }>;
    exportData: () => Promise<AppData>;
    setPersonnelComplete: (eventFrameId: string, complete: boolean) => void;
    setHasUnsavedChanges: (value: boolean) => void;
    addOrUpdateTechSheet: (eventFrameId: string, fitxaData: TechSheetData) => void;
    reorderTechnicalProviders: (eventFrameId: string, reorderedProviders: TechSheetProvider[]) => void;
    addMaterialItem: (newItemData: Omit<MaterialItem, 'id'>) => MaterialItem;
    updateMaterialItem: (updatedItem: MaterialItem) => void;
    deleteMaterialItem: (itemId: string) => void;
    addMaterialItemsFromFile: (newItems: MaterialItem[]) => {
        success: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    };
    getMaterialAvailability: (materialId: string, startDate: string, endDate: string, currentEventFrameId: string) => {
        available: number;
        total: number;
    };
    mergePeopleGroups: (newPeople: PersonGroup[]) => {
        success: boolean;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    };
    replacePeopleGroups: (newPeople: PersonGroup[]) => void;
    replaceMaterialItems: (newItems: MaterialItem[]) => void;
    _applyDataToState: (data: AppData) => void;
    clearDataRepairInfo: () => void;
    setIsUpdatingMaterial: (isUpdating: boolean) => void;
    undoAndGetDescription: () => {
        undoneActionDescription: string | null;
    };
    redoAndGetDescription: () => {
        redoneActionDescription: string | null;
    };
    archiveOldEventFrames: () => EventFrame[];
    confirmArchiveEventFrames: (eventFrameIds: string[]) => void;
    restoreEventFrame: (eventFrameId: string) => void;
}
export declare const useEventDataStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<EventDataState & EventDataActions>, "temporal"> & {
    temporal: import("zustand").StoreApi<TemporalState<PartializedState>>;
}, "setState"> & {
    setState(nextStateOrUpdater: (EventDataState & EventDataActions) | Partial<EventDataState & EventDataActions> | ((state: import("immer").WritableDraft<EventDataState & EventDataActions>) => void), shouldReplace?: false): void;
    setState(nextStateOrUpdater: (EventDataState & EventDataActions) | ((state: import("immer").WritableDraft<EventDataState & EventDataActions>) => void), shouldReplace: true): void;
}>;
type PartializedState = Pick<EventDataState, 'eventFrames' | 'peopleGroups' | 'materialItems' | 'lastActionDescription'>;
export declare const useTemporalStore: <T>(selector: (state: TemporalState<PartializedState>) => T) => T;
export declare const selectAvailableOrigins: (state: EventDataState) => string[];
export interface MaterialControlFilters {
    selectedEventIds?: string[];
    selectedOrigins?: string[];
    selectedCategories?: string[];
    searchText?: string;
    dateRange?: {
        start?: string;
        end?: string;
    };
}
export declare const selectMaterialControlData: (state: EventDataState, filters: MaterialControlFilters) => MaterialControlRow[];
export {};
//# sourceMappingURL=eventDataStore.d.ts.map