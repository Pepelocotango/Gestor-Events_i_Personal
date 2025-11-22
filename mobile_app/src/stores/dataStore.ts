import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as SecureStore from 'expo-secure-store';
import { AppData, Assignment, AssignmentStatus, EventFrame, EventFrameForExport, PersonGroup, MaterialItem, MaterialControlRow, MaterialControlFilters, TechSheetData, NeedItem } from '../types';
import { SAFFileService } from '../services/SAFFileService';

const fileService = new SAFFileService();
const THEME_KEY = 'app_theme';

type NewEventData = Omit<EventFrame, 'id' | 'assignments'>;
type NewPersonGroupData = Omit<PersonGroup, 'id'>;
type NewMaterialItemData = Omit<MaterialItem, 'id'>;

interface DataState {
  fileUri: string | null;
  fileName: string | null;
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  materialItems: MaterialItem[];
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  isThemeLoading: boolean;

  init: () => Promise<void>;
  toggleTheme: () => void;
  setData: (data: AppData, name: string, uri: string) => void;
  clearData: () => void;
  saveFileAs: () => Promise<void>;

  addEventFrame: (data: NewEventData) => EventFrame;
  updateEventFrame: (eventId: string, data: Partial<NewEventData>) => void;
  deleteEventFrame: (eventId: string) => void;

  addPersonGroup: (data: NewPersonGroupData) => void;
  updatePersonGroup: (personId: string, data: Partial<NewPersonGroupData>) => void;
  deletePersonGroup: (personId: string) => void;

  addMaterialItem: (data: NewMaterialItemData) => void;
  updateMaterialItem: (itemId: string, data: Partial<NewMaterialItemData>) => void;
  deleteMaterialItem: (itemId: string) => void;

  // Assignment CRUD
  addAssignment: (eventFrameId: string, data: Omit<Assignment, 'id'>, force?: boolean) => Promise<string | null>;
  updateAssignment: (eventFrameId: string, assignmentId: string, data: Partial<Omit<Assignment, 'id'>>, force?: boolean) => Promise<string | null>;
  deleteAssignment: (eventFrameId: string, assignmentId: string) => void;
  updateDailyAssignmentStatus: (eventFrameId: string, assignmentId: string, date: string, status: AssignmentStatus) => void;
  setAllDaysAssignmentStatus: (eventFrameId: string, assignmentId: string, status: AssignmentStatus) => void;
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
      fileUri: null,
      fileName: null,
      eventFrames: [],
  peopleGroups: [],
  materialItems: [],
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  theme: 'light',
  isThemeLoading: true,

  init: async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        set({ theme: savedTheme, isThemeLoading: false });
      } else {
        set({ isThemeLoading: false });
      }
    } catch (error) {
      console.error("Failed to load theme from secure store", error);
      set({ isThemeLoading: false });
    }
  },

  toggleTheme: async () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    try {
      await SecureStore.setItemAsync(THEME_KEY, newTheme);
    } catch (error) {
      console.error("Failed to save theme to secure store", error);
    }
  },

  setData: (data, name, uri) => {
    set({ isLoading: true, error: null });
    try {
      const hydratedEventFrames: EventFrame[] = data.eventFrames.map((frame) => ({
        ...frame,
        assignments: data.assignments.filter((a: Assignment) => a.eventFrameId === frame.id) || [],
      }));
      set({
        eventFrames: hydratedEventFrames,
        peopleGroups: data.peopleGroups,
        materialItems: data.materialItems || [],
        fileName: name,
        fileUri: uri,
        hasUnsavedChanges: false,
        isLoading: false,
      });
    } catch (err) {
      set({ error: "Error en processar les dades.", isLoading: false });
    }
  },

  clearData: () => {
    set({
      eventFrames: [],
      peopleGroups: [],
      materialItems: [],
      fileName: null,
      fileUri: null,
      hasUnsavedChanges: false,
    });
  },

  saveFileAs: async () => {
    const { fileName, eventFrames, peopleGroups, materialItems } = get();

    set({ isLoading: true, error: null });
    try {
      const allAssignments: Assignment[] = eventFrames.flatMap((frame) => frame.assignments || []);
      const eventFramesForExport: EventFrameForExport[] = eventFrames.map(({ assignments, ...rest }) => rest);
      const dataToSave: AppData = {
        eventFrames: eventFramesForExport,
        peopleGroups,
        assignments: allAssignments,
        materialItems,
      };

      const jsonString = JSON.stringify(dataToSave, null, 2);
      await fileService.saveFileAs(jsonString, fileName || 'dades.json');

      set({
        hasUnsavedChanges: false,
        isLoading: false,
      });
    } catch (err) {
      set({ error: "No s'ha pogut desar el fitxer.", isLoading: false });
      throw err;
    }
  },

  addEventFrame: (data) => {
    const newEvent: EventFrame = {
      ...data,
      id: uuidv4(),
      assignments: [],
      personnelComplete: false,
    };
    set((state) => ({
      eventFrames: [...state.eventFrames, newEvent],
      hasUnsavedChanges: true,
    }));
    return newEvent;
  },

  updateEventFrame: (eventId, data) => {
    set((state) => {
      const eventIndex = state.eventFrames.findIndex((event) => event.id === eventId);
      if (eventIndex !== -1) {
        state.eventFrames[eventIndex] = {
          ...state.eventFrames[eventIndex],
          ...data,
        };
        state.hasUnsavedChanges = true;
      }
    });
  },

  deleteEventFrame: (eventId) => {
    set((state) => ({
      eventFrames: state.eventFrames.filter((event) => event.id !== eventId),
      hasUnsavedChanges: true,
    }));
  },

  // PersonGroup CRUD
  addPersonGroup: (data) => {
    const newPerson: PersonGroup = { ...data, id: uuidv4() };
    set((state) => ({
      peopleGroups: [...state.peopleGroups, newPerson],
      hasUnsavedChanges: true,
    }));
  },

  updatePersonGroup: (personId, data) => {
    set((state) => ({
      peopleGroups: state.peopleGroups.map((person) =>
        person.id === personId ? { ...person, ...data } : person
      ),
      hasUnsavedChanges: true,
    }));
  },

  deletePersonGroup: (personId) => {
    set((state) => ({
      peopleGroups: state.peopleGroups.filter((person) => person.id !== personId),
      hasUnsavedChanges: true,
    }));
  },

  // MaterialItem CRUD
  addMaterialItem: (data) => {
    const newItem: MaterialItem = { ...data, id: uuidv4() };
    set((state) => ({
      materialItems: [...state.materialItems, newItem],
      hasUnsavedChanges: true,
    }));
  },

  updateMaterialItem: (itemId, data) => {
    set((state) => ({
      materialItems: state.materialItems.map((item) =>
        item.id === itemId ? { ...item, ...data } : item
      ),
      hasUnsavedChanges: true,
    }));
  },

  deleteMaterialItem: (itemId) => {
    set((state) => ({
      materialItems: state.materialItems.filter((item) => item.id !== itemId),
      hasUnsavedChanges: true,
    }));
  },

  // Assignment CRUD
  addAssignment: async (eventFrameId, data, force = false) => {
    if (!force) {
      const { eventFrames } = get();
      const newStart = new Date(data.startDate);
      const newEnd = new Date(data.endDate);

      for (const event of eventFrames) {
        for (const existing of event.assignments) {
          if (existing.personGroupId === data.personGroupId) {
            const existingStart = new Date(existing.startDate);
            const existingEnd = new Date(existing.endDate);
            if (newStart <= existingEnd && newEnd >= existingStart) {
              return `Conflicte detectat: La persona ja està assignada a '${event.name}' en aquestes dates.`;
            }
          }
        }
      }
    }

    const newAssignment: Assignment = { ...data, id: uuidv4() };
    set(state => ({
      eventFrames: state.eventFrames.map(ef =>
        ef.id === eventFrameId
          ? { ...ef, assignments: [...ef.assignments, newAssignment] }
          : ef
      ),
      hasUnsavedChanges: true,
    }));
    return null;
  },

  updateAssignment: async (eventFrameId, assignmentId, data, force = false) => {
    if (!force) {
      const { eventFrames } = get();
      const originalAssignment = eventFrames.flatMap(ef => ef.assignments).find(a => a.id === assignmentId);
      if (originalAssignment) {
        const newStart = new Date(data.startDate || originalAssignment.startDate);
        const newEnd = new Date(data.endDate || originalAssignment.endDate);
        const personGroupId = data.personGroupId || originalAssignment.personGroupId;

        for (const event of eventFrames) {
          for (const existing of event.assignments) {
            if (existing.id !== assignmentId && existing.personGroupId === personGroupId) {
              const existingStart = new Date(existing.startDate);
              const existingEnd = new Date(existing.endDate);
              if (newStart <= existingEnd && newEnd >= existingStart) {
                return `Conflicte detectat: La persona ja està assignada a '${event.name}' en aquestes dates.`;
              }
            }
          }
        }
      }
    }

    set(state => {
      const eventIndex = state.eventFrames.findIndex(ef => ef.id === eventFrameId);
      if (eventIndex !== -1) {
        const assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex !== -1) {
          const originalAssignment = state.eventFrames[eventIndex].assignments[assignmentIndex];

          // Create the updated assignment object
          const updatedAssignment = { ...originalAssignment, ...data };

          // If the original status was Mixed and the new status is different, clear dailyStatuses
          if (originalAssignment.status === AssignmentStatus.Mixed && data.status && data.status !== AssignmentStatus.Mixed) {
            updatedAssignment.dailyStatuses = {};
          }

          // If daily statuses are being provided, calculate the overall status
          if (data.dailyStatuses) {
            const statuses = Object.values(data.dailyStatuses);
            const uniqueStatuses = new Set(statuses);
            if (uniqueStatuses.size === 1) {
              updatedAssignment.status = statuses[0];
            } else {
              updatedAssignment.status = AssignmentStatus.Mixed;
            }
          }

          state.eventFrames[eventIndex].assignments[assignmentIndex] = updatedAssignment;
          state.hasUnsavedChanges = true;
        }
      }
    });
    return null;
  },

  deleteAssignment: (eventFrameId, assignmentId) => {
    set(state => ({
      eventFrames: state.eventFrames.map(ef => {
        if (ef.id === eventFrameId) {
          return {
            ...ef,
            assignments: ef.assignments.filter(a => a.id !== assignmentId),
          };
        }
        return ef;
      }),
      hasUnsavedChanges: true,
    }));
  },

  updateDailyAssignmentStatus: (eventFrameId, assignmentId, date, status) => {
    set(state => {
      const eventIndex = state.eventFrames.findIndex(ef => ef.id === eventFrameId);
      if (eventIndex === -1) return;

      const assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(a => a.id === assignmentId);
      if (assignmentIndex === -1) return;

      const assignment = state.eventFrames[eventIndex].assignments[assignmentIndex];

      if (!assignment.dailyStatuses) {
        assignment.dailyStatuses = {};
      }

      assignment.dailyStatuses[date] = status;

      // Determine the new overall status
      const dayStatuses = Object.values(assignment.dailyStatuses).filter(Boolean) as AssignmentStatus[];
      if (dayStatuses.length > 0) {
        const uniqueStatuses = new Set(dayStatuses);
        if (uniqueStatuses.size === 1) {
          // If there's only one unique status, all statuses in the array are the same.
          // We can safely take the first one.
          assignment.status = dayStatuses[0];
        } else {
          assignment.status = AssignmentStatus.Mixed;
        }
      } else {
        // If all daily statuses are cleared, revert to Pending
        assignment.status = AssignmentStatus.Pending;
      }

      state.hasUnsavedChanges = true;
    });
  },

  setAllDaysAssignmentStatus: (eventFrameId, assignmentId, status) => {
    set(state => {
      const eventIndex = state.eventFrames.findIndex(ef => ef.id === eventFrameId);
      if (eventIndex === -1) return;

      const assignmentIndex = state.eventFrames[eventIndex].assignments.findIndex(a => a.id === assignmentId);
      if (assignmentIndex === -1) return;

      const assignment = state.eventFrames[eventIndex].assignments[assignmentIndex];

      // No fem res si l'estat és Mixt, ja que no té sentit aplicar-lo a tots els dies
      if (status === AssignmentStatus.Mixed) return;

      assignment.status = status;
      // Esborrem els estats diaris per assegurar consistència.
      // La UI s'encarregarà de mostrar l'estat general per a cada dia.
      assignment.dailyStatuses = {};
      state.hasUnsavedChanges = true;
    });
  },
}))
);

// --- Selectors ---

export const selectAvailableOrigins = (state: { materialItems: MaterialItem[] }): string[] => {
  const origins = new Set(state.materialItems.map(item => item.location));
  return Array.from(origins).sort((a, b) => a.localeCompare(b));
};

export const selectMaterialControlData = (
  state: { eventFrames: EventFrame[], materialItems: MaterialItem[] },
  filters: MaterialControlFilters
): MaterialControlRow[] => {
  const { dateRange, searchText } = filters;
  const { materialItems, eventFrames } = state;

  const selectedEventIds = filters.selectedEventIds ? [filters.selectedEventIds] : [];
  const selectedOrigins = filters.selectedOrigins ? [filters.selectedOrigins] : [];
  const selectedCategories = filters.selectedCategories ? [filters.selectedCategories] : [];

  const isPeakDemandActive = (selectedEventIds.length > 0) || (dateRange && (dateRange.start || dateRange.end));

  if (!isPeakDemandActive) {
    const allRows = materialItems.map(item => ({
      item,
      totalDemand: 0,
      balance: item.stock,
      breakdown: [],
    }));

    return allRows.filter(row => {
      if (selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(row.item.category)) return false;
      if (searchText && searchText.trim()) {
        const lowerCaseSearch = searchText.toLowerCase();
        return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
               row.item.category.toLowerCase().includes(lowerCaseSearch) ||
               row.item.location.toLowerCase().includes(lowerCaseSearch);
      }
      return true;
    });
  }

  let relevantEvents = eventFrames;
  if (selectedEventIds.length > 0) {
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

  const resultRows: MaterialControlRow[] = materialItems.map(item => {
    const itemNeeds = allNeeds.filter(need => need.itemId === item.id);
    if (itemNeeds.length === 0) {
      return { item, totalDemand: 0, balance: item.stock, breakdown: [] };
    }

    const allDates = itemNeeds.flatMap(need => [new Date(need.event.startDate), new Date(need.event.endDate)]);
    const minDate = new Date(Math.min.apply(null, allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max.apply(null, allDates.map(d => d.getTime())));

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

  return resultRows.filter(row => {
    if (row.totalDemand === 0 && selectedEventIds.length > 0) {
        return false;
    }
    if (selectedOrigins.length > 0 && !selectedOrigins.includes(row.item.location)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(row.item.category)) return false;
    if (searchText && searchText.trim()) {
      const lowerCaseSearch = searchText.toLowerCase();
      return row.item.name.toLowerCase().includes(lowerCaseSearch) ||
             row.item.category.toLowerCase().includes(lowerCaseSearch) ||
             row.item.location.toLowerCase().includes(lowerCaseSearch);
    }
    return true;
  });
};
