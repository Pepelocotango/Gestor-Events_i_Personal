import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RiderPdfConfig } from '../types';

// --- STATE AND TYPES ---

interface RiderPdfConfigState {
  config: RiderPdfConfig;
  loading: boolean;
  error: string | null;
}

interface RiderPdfConfigActions {
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setSection: (section: keyof RiderPdfConfig['sections'], value: boolean) => void;
  setInputColumn: (column: keyof RiderPdfConfig['inputColumns'], value: boolean) => void;
  setMonitorColumn: (column: keyof RiderPdfConfig['monitorColumns'], value: boolean) => void;
  setBalanceConfig: (config: Partial<RiderPdfConfig['balanceConfig']>) => void;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;
}

const defaultConfig: RiderPdfConfig = {
  orientation: 'portrait',
  sections: {
    basicInfo: false,        // ❌ Desactivada per defecte
    inputs: true,            // ✅ Activat
    monitors: true,          // ✅ Activat
    cable: true,             // ✅ Activat
    spare: true,             // ✅ Activat
    technicalNotes: false,  // ❌ Desactivada
    hospitality: false,      // ❌ Desactivada
    generalNotes: false,     // ❌ Desactivada
    balance: true,           // ✅ Activat
  },
  inputColumns: {
    patch: true,             // ✅ Activat
    channel: true,           // ✅ Activat
    label: true,             // ✅ Activat
    rider: true,             // ✅ Activat
    contra: true,            // ✅ Activat
    stand: true,             // ✅ Activat
    notes: true,             // ✅ Activat
    exclusive: false,        // ❌ Desactivat (únic exclos)
  },
  monitorColumns: {
    patch: true,             // ✅ Activat
    outputChannel: true,      // ✅ Activat
    label: true,             // ✅ Activat
    rider: true,             // ✅ Activat
    contra: true,            // ✅ Activat
    stand: true,             // ✅ Activat
    notes: true,             // ✅ Activat
    exclusive: false,        // ❌ Desactivat (únic exclos)
  },
  balanceConfig: {
    sortByCategory: true,    // ✅ Activat
    sortByLocation: true,    // ✅ Activat
    printBalance: true,      // ✅ Activat
  },
};

const initialState: RiderPdfConfigState = {
  config: defaultConfig,
  loading: false,
  error: null,
};

// --- ZUSTAND STORE CREATION ---

export const useRiderPdfConfigStore = create<RiderPdfConfigState & RiderPdfConfigActions>()(
  immer((set, get) => ({
    ...initialState,

    setOrientation: (orientation) => {
      set((state) => {
        state.config.orientation = orientation;
      });
    },

    setSection: (section, value) => {
      set((state) => {
        state.config.sections[section] = value;
      });
    },

    setInputColumn: (column, value) => {
      set((state) => {
        state.config.inputColumns[column] = value;
      });
    },

    setMonitorColumn: (column, value) => {
      set((state) => {
        state.config.monitorColumns[column] = value;
      });
    },

    setBalanceConfig: (newBalanceConfig) => {
      set((state) => {
        state.config.balanceConfig = { ...state.config.balanceConfig, ...newBalanceConfig };
      });
    },

    loadConfig: async () => {
      if (!window.electronAPI?.getSessionData) {
        return;
      }

      set({ loading: true, error: null });

      try {
        const sessionData = await window.electronAPI.getSessionData();
        const savedConfig = sessionData?.riderPdfConfig;

        if (savedConfig) {
          set((state) => {
            state.config = savedConfig;
          });
        }
      } catch (error) {
        console.error('Error carregant configuració del PDF:', error);
        set({ error: (error as Error).message });
      } finally {
        set({ loading: false });
      }
    },

    saveConfig: async () => {
      if (!window.electronAPI?.saveSessionData) {
        return;
      }

      set({ loading: true, error: null });

      try {
        const { config } = get();
        await window.electronAPI.saveSessionData('riderPdfConfig', config);
      } catch (error) {
        console.error('Error desant configuració del PDF:', error);
        set({ error: (error as Error).message });
      } finally {
        set({ loading: false });
      }
    },

    resetConfig: () => {
      set({ config: defaultConfig, error: null });
    },
  }))
);

// --- AUTO-SAVE FUNCTIONALITY ---

let saveTimeout: NodeJS.Timeout | null = null;

export const autoSaveRiderPdfConfig = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    useRiderPdfConfigStore.getState().saveConfig();
  }, 1000); // 1 segon de retard
};

// --- HELPER FUNCTIONS ---

export const getPdfOptionsFromConfig = (config: RiderPdfConfig) => {
  return {
    includeBasicInfo: config.sections.basicInfo,
    includeInputs: config.sections.inputs,
    includeMonitors: config.sections.monitors,
    includeCable: config.sections.cable,
    includeSpare: config.sections.spare,
    includeTechnicalNotes: config.sections.technicalNotes,
    includeHospitality: config.sections.hospitality,
    includeGeneralNotes: config.sections.generalNotes,
    showEmptySections: false,
    showBalance: config.sections.balance,
    pdfOrientation: config.orientation,
    inputColumns: config.inputColumns,
    monitorColumns: config.monitorColumns,
  };
};
