import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  EventFrame,
  PersonGroup,
  Assignment,
  AppData,
  EventFrameForExport,
} from '../types';
import { DeviceFileService } from '../services/DeviceFileService';

// Define the file service instance
const fileService = new DeviceFileService();

interface DataSourceInfo {
  type: 'device' | 'dropbox' | null;
  uri?: string;
  path?: string;
  name?: string;
}

// Define the shape of the data for a new event
type NewEventData = Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete'>;

interface DataState {
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  isLoading: boolean;
  error: string | null;
  dataSourceInfo: DataSourceInfo;
  hasUnsavedChanges: boolean; // Dirty flag
  loadDataFromFile: (
    data: AppData,
    sourceInfo: { uri: string; name: string }
  ) => void;
  addEventFrame: (data: NewEventData) => void;
  updateEventFrame: (
    eventId: string,
    data: Partial<NewEventData>
  ) => void;
  deleteEventFrame: (eventId: string) => void;
  saveDataToFile: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  eventFrames: [],
  peopleGroups: [],
  isLoading: false,
  error: null,
  dataSourceInfo: { type: null },
  hasUnsavedChanges: false, // Initial state for the dirty flag

  loadDataFromFile: (data, sourceInfo) => {
    try {
      set({ isLoading: true, error: null, hasUnsavedChanges: false }); // Reset changes on new load

      // Hydrate event frames with their assignments
      const hydratedEventFrames: EventFrame[] = data.eventFrames.map(
        (frame) => ({
          ...frame,
          assignments:
            data.assignments.filter(
              (a: Assignment) => a.eventFrameId === frame.id
            ) || [],
        })
      );

      set({
        eventFrames: hydratedEventFrames,
        peopleGroups: data.peopleGroups,
        dataSourceInfo: {
          type: 'device',
          uri: sourceInfo.uri,
          name: sourceInfo.name,
        },
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = 'Error en processar les dades del fitxer.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },

  addEventFrame: (data) => {
    const newEvent: EventFrame = {
      ...data,
      id: uuidv4(),
      assignments: [], // New events start with no assignments
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

  saveDataToFile: async () => {
    const { eventFrames, peopleGroups, dataSourceInfo } = get();

    if (!dataSourceInfo.uri) {
      console.error('No hi ha cap URI de destí per desar les dades.');
      // Optionally, set an error state
      set({ error: 'No es pot desar: no s’ha especificat cap fitxer.' });
      return;
    }

    try {
      // Dehydrate data for saving
      const allAssignments: Assignment[] = eventFrames.flatMap(
        (frame) => frame.assignments || []
      );
      const eventFramesForExport: EventFrameForExport[] = eventFrames.map(
        ({ assignments, ...rest }) => rest
      );

      // We assume materialItems and googleConfig are not managed in the mobile app for now
      const dataToSave: AppData = {
        eventFrames: eventFramesForExport,
        peopleGroups,
        assignments: allAssignments,
        materialItems: [], // Placeholder
      };

      await fileService.saveData(dataToSave, dataSourceInfo.uri);

      // On success, reset the dirty flag
      set({ hasUnsavedChanges: false, error: null });
    } catch (err) {
      const errorMessage = 'Error en desar les dades.';
      set({ error: errorMessage });
      console.error(err);
    }
  },
}));
