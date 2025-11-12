import { create } from 'zustand';
import { EventFrame, PersonGroup, Assignment, AppData } from '../types';

interface DataSourceInfo {
  type: 'device' | 'dropbox' | null;
  uri?: string;
  path?: string;
  name?: string;
}

interface DataState {
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  isLoading: boolean;
  error: string | null;
  dataSourceInfo: DataSourceInfo;
  loadDataFromFile: (data: AppData, sourceInfo: Omit<DataSourceInfo, 'type'>) => void;
}

export const useDataStore = create<DataState>((set) => ({
  eventFrames: [],
  peopleGroups: [],
  isLoading: false,
  error: null,
  dataSourceInfo: { type: null },
  loadDataFromFile: (data, sourceInfo) => {
    try {
      set({ isLoading: true, error: null });

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
        dataSourceInfo: { type: 'device', ...sourceInfo },
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = 'Error en processar les dades del fitxer.';
      set({ error: errorMessage, isLoading: false });
      console.error(err);
    }
  },
}));
