import { create } from 'zustand';
import { ModalType, ModalData, ShowToastFunction } from '../types';
import { devtools } from 'zustand/middleware';

// Aquesta és l'estructura de l'estat del nostre store
interface ModalState {
  type: ModalType;
  data: ModalData | null;
  isOpen: boolean;
  showToast: ShowToastFunction;
}

// Aquestes són les accions que podrem executar sobre l'estat
interface ModalActions {
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  updateModalData: (data: Partial<ModalData>) => void;
  setToastHandler: (handler: ShowToastFunction) => void;
}

const initialState: ModalState = {
  type: null,
  data: null,
  isOpen: false,
  showToast: () => {},
};

export const useModalStore = create<ModalState & ModalActions>()(
  devtools(
    (set) => ({
      ...initialState,

      openModal: (type, data = {}) => {
        set({
            type,
            data,
            isOpen: true,
          });
      },

      closeModal: () => set(initialState),

      updateModalData: (data) =>
        set((state) => ({
          data: state.data ? { ...state.data, ...data } : data,
        })),

      setToastHandler: (handler) => set({ showToast: handler }),
    }),
    { name: 'modalStore' }
  )
);
