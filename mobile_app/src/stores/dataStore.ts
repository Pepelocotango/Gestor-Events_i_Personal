import { create } from 'zustand';
import { LocalFileService } from '../services/LocalFileService';
import { EventFrame, PersonGroup, Assignment } from '../types';

interface DataState {
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  isLoading: boolean;
  error: string | null;
  loadInitialData: () => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  eventFrames: [],
  peopleGroups: [],
  isLoading: true,
  error: null,
  loadInitialData: async () => {
    try {
      set({ isLoading: true, error: null });
      const service = new LocalFileService();
      const data = await service.loadData();

      // Combina eventFrames i assignments per crear els objectes EventFrame complets
      const hydratedEventFrames: EventFrame[] = data.eventFrames.map(
        (frame) => ({
          ...frame,
          assignments: data.assignments.filter(
            (a: Assignment) => a.eventFrameId === frame.id
          ),
        })
      );

      set({
        eventFrames: hydratedEventFrames,
        peopleGroups: data.peopleGroups,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = 'Error en carregar les dades.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },
}));
