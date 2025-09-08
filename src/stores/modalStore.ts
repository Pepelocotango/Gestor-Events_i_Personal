import { create } from 'zustand';
import { ModalType, ModalData, AssignmentStatus } from '../types';
import { loggingMiddleware } from './loggingMiddleware';
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
    loggingMiddleware(
      (set) => ({
        ...initialState,

        openModal: (type, data = {}, initialFormData = {}) => {
          set((state) => ({
            ...state,
            type,
            data,
            formData: initialFormData,
            isOpen: true,
          }));
        },

        closeModal: () => set(initialState),

        setFormData: (updater) => {
          set((state) => ({
            ...state,
            formData: typeof updater === 'function' ? updater(state.formData) : updater,
          }));
        },
      })),
    'modalStore'
  )
);
