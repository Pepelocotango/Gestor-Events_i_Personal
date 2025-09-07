import { create } from 'zustand';
import { ModalType, ModalData } from '../types';

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

export const useModalStore = create<ModalState & ModalActions>((set) => ({
  ...initialState,

  openModal: (type, data = {}, formData = {}) => {
    // La lògica de preparació del formData ara recau en qui crida a `openModal`.
    // Si no es proporciona un formData, s'utilitza un objecte buit.
    set({
      type,
      data,
      formData,
      isOpen: true,
    });
  },

  closeModal: () => {
    set(initialState);
  },

  setFormData: (updater) => {
    set(state => ({
      formData: typeof updater === 'function' ? updater(state.formData) : updater
    }));
  },
}));
