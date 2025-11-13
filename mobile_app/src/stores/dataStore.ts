import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppData, Assignment, EventFrame, EventFrameForExport, PersonGroup } from '../types';
import { SAFFileService } from '../services/SAFFileService';

const fileService = new SAFFileService();

type NewEventData = Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete'>;

interface DataState {
  fileUri: string | null;
  fileName: string | null;
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;

  setData: (data: AppData, uri: string, name: string) => void;
  clearData: () => void;
  saveData: () => Promise<void>;
  createFile: (fileName: string) => Promise<void>;
  addEventFrame: (data: NewEventData) => void;
  updateEventFrame: (eventId: string, data: Partial<NewEventData>) => void;
  deleteEventFrame: (eventId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  fileUri: null,
  fileName: null,
  eventFrames: [],
  peopleGroups: [],
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,

  setData: (data, uri, name) => {
    set({ isLoading: true, error: null });
    try {
      const hydratedEventFrames: EventFrame[] = data.eventFrames.map((frame) => ({
        ...frame,
        assignments: data.assignments.filter((a: Assignment) => a.eventFrameId === frame.id) || [],
      }));
      set({
        eventFrames: hydratedEventFrames,
        peopleGroups: data.peopleGroups,
        fileUri: uri,
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
      fileUri: null,
      fileName: null,
      hasUnsavedChanges: false,
    });
  },

  saveData: async () => {
    const { fileUri, eventFrames, peopleGroups } = get();
    if (!fileUri) {
      throw new Error("No hi ha cap fitxer obert per desar.");
    }

    set({ isLoading: true, error: null });
    try {
      const allAssignments: Assignment[] = eventFrames.flatMap((frame) => frame.assignments || []);
      const eventFramesForExport: EventFrameForExport[] = eventFrames.map(({ assignments, ...rest }) => rest);
      const dataToSave: AppData = {
        eventFrames: eventFramesForExport,
        peopleGroups,
        assignments: allAssignments,
        materialItems: [], // Placeholder
      };

      await fileService.saveFile(fileUri, dataToSave);
      set({ hasUnsavedChanges: false, isLoading: false });
    } catch (err) {
      set({ error: "No s'ha pogut desar el fitxer.", isLoading: false });
      throw err;
    }
  },

  createFile: async (fileName: string) => {
    set({ isLoading: true, error: null });
    try {
        const initialData: AppData = {
        eventFrames: [],
        peopleGroups: [],
        assignments: [],
        materialItems: [],
      };

      const newUri = await fileService.createFile(initialData, fileName);
      if (newUri) {
        set({
          fileUri: newUri,
          fileName: fileName,
          eventFrames: [],
          peopleGroups: [],
          hasUnsavedChanges: false,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ error: "No s'ha pogut crear el fitxer.", isLoading: false });
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
}));
