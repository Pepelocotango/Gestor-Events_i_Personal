import { create } from 'zustand';
import { ModalType, ModalData } from '../types';
import { devtools } from 'zustand/middleware';

// Aquest tipus defineix les dades que es poden editar en un formulari de modal
type ModalFormData = { [key: string]: any };

// Aquesta és l'estructura de l'estat del nostre store
interface ModalState {
  type: ModalType;
  data: ModalData | null;
  formData: ModalFormData;
  isOpen: boolean;
}

// Aquestes són les accions que podrem executar sobre l'estat
interface ModalActions {
  openModal: (type: ModalType, data?: ModalData, initialFormData?: ModalFormData) => void;
  closeModal: () => void;
  setFormData: (data: ModalFormData | ((prev: ModalFormData) => ModalFormData)) => void;
}

const initialState: ModalState = {
  type: null,
  data: null,
  formData: {},
  isOpen: false,
};

export const useModalStore = create<ModalState & ModalActions>()(
  devtools(
    (set) => ({
      ...initialState,

      openModal: (type, data = {}, initialFormData = {}) => {
        set((state) => {
          // Evita obrir el modal si ja està obert amb el mateix tipus i dades
          if (state.isOpen && state.type === type && JSON.stringify(state.data) === JSON.stringify(data)) {
            return state;
          }
          return {
            ...state,
            type,
            data,
            formData: initialFormData,
            isOpen: true,
          };
        });
      },

      closeModal: () => set(initialState),

      setFormData: (updater) => {
        set((state) => {
          const newFormData = typeof updater === 'function' ? updater(state.formData) : updater;
          // Evita actualitzacions redundants
          if (JSON.stringify(state.formData) === JSON.stringify(newFormData)) {
            return state;
          }
          return {
            ...state,
            formData: newFormData,
          };
        });
      },
    }),
    { name: 'modalStore' }
  )
);
