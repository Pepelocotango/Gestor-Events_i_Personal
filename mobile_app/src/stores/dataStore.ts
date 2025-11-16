import { create } from 'zustand';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { AppData, Assignment, EventFrame, EventFrameForExport, PersonGroup, MaterialItem } from '../types';
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
}

export const useDataStore = create<DataState>((set, get) => ({
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
}));
