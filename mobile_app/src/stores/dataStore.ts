import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AppData, Assignment, EventFrame, EventFrameForExport, PersonGroup, MaterialItem, MaterialControlRow, MaterialControlFilters, TechSheetData, NeedItem } from '../types';
import { SAFFileService } from '../services/SAFFileService';

const fileService = new SAFFileService();

type NewEventData = Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete'>;
type NewPersonGroupData = Omit<PersonGroup, 'id'>;
type NewMaterialItemData = Omit<MaterialItem, 'id'>;

interface DataState {
  fileName: string | null;
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  materialItems: MaterialItem[];
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;

  setData: (data: AppData, name: string) => void;
  clearData: () => void;
  saveData: () => Promise<void>;

  addEventFrame: (data: NewEventData) => void;
  updateEventFrame: (eventId: string, data: Partial<NewEventData>) => void;
  deleteEventFrame: (eventId: string) => void;

  addPersonGroup: (data: NewPersonGroupData) => void;
  updatePersonGroup: (personId: string, data: Partial<NewPersonGroupData>) => void;
  deletePersonGroup: (personId: string) => void;

  addMaterialItem: (data: NewMaterialItemData) => void;
  updateMaterialItem: (itemId: string, data: Partial<NewMaterialItemData>) => void;
  deleteMaterialItem: (itemId: string) => void;

  // Assignment CRUD
  addAssignment: (eventFrameId: string, data: Omit<Assignment, 'id'>) => void;
  updateAssignment: (eventFrameId: string, assignmentId: string, data: Partial<Omit<Assignment, 'id'>>) => void;
  deleteAssignment: (eventFrameId: string, assignmentId: string) => void;

  undo: () => void;
  redo: () => void;
}

export const useDataStore = create<DataState>()(
  temporal(
    immer((set, get) => ({
      fileName: null,
      eventFrames: [],
  peopleGroups: [],
  materialItems: [],
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,

  setData: (data, name) => {
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
      hasUnsavedChanges: false,
    });
  },

  saveData: async () => {
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

      set({ hasUnsavedChanges: false, isLoading: false });
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
  },

  updateEventFrame: (eventId, data) => {
    set((state) => ({
      eventFrames: state.eventFrames.map((event) =>
        event.id === eventId ? { ...event, ...data } : event
      ),
      hasUnsavedChanges: true,
    }));
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
  addAssignment: (eventFrameId, data) => {
    const newAssignment: Assignment = { ...data, id: uuidv4() };
    set(state => ({
      eventFrames: state.eventFrames.map(ef =>
        ef.id === eventFrameId
          ? { ...ef, assignments: [...ef.assignments, newAssignment] }
          : ef
      ),
      hasUnsavedChanges: true,
    }));
  },

  updateAssignment: (eventFrameId, assignmentId, data) => {
    set(state => ({
      eventFrames: state.eventFrames.map(ef => {
        if (ef.id === eventFrameId) {
          return {
            ...ef,
            assignments: ef.assignments.map(a =>
              a.id === assignmentId ? { ...a, ...data } : a
            ),
          };
        }
        return ef;
      }),
      hasUnsavedChanges: true,
    }));
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

    undo: () => {
        // @ts-ignore
        (get() as any).temporal.getState().undo();
    },

    redo: () => {
        // @ts-ignore
        (get() as any).temporal.getState().redo();
    },
})),
{
    partialize: (state) => {
        const { eventFrames, peopleGroups, materialItems } = state;
        return { eventFrames, peopleGroups, materialItems };
    },
    limit: 20,
})
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
  const { selectedEventIds, dateRange, selectedOrigins, selectedCategories, searchText } = filters;
  const { materialItems, eventFrames } = state;

  const isPeakDemandActive = (selectedEventIds && selectedEventIds.length > 0) || (dateRange && (dateRange.start || dateRange.end));

  if (!isPeakDemandActive) {
    const allRows = materialItems.map(item => ({
      item,
      totalDemand: 0,
      balance: item.stock,
      breakdown: [],
    }));

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
