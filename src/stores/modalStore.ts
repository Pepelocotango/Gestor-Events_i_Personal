import { create } from 'zustand';
import { ModalType, ModalData, AssignmentStatus } from '../types';
import { useEventDataStore } from './eventDataStore';

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

  openModal: (type, data = {}) => {
    let initialFormData: ModalFormData = {};
    const today = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'addEventFrame':
        initialFormData = {
          name: '',
          place: '',
          startDate: (data as any)?.startDate || today,
          endDate: (data as any)?.endDate || today,
          generalNotes: '',
        };
        break;
      case 'editEventFrame':
        if (data?.eventFrameToEdit) {
          initialFormData = { ...data.eventFrameToEdit };
        }
        break;
      case 'addAssignment':
        if (data?.eventFrame) {
          const peopleGroups = useEventDataStore.getState().peopleGroups;
          initialFormData = {
            personGroupId: peopleGroups.length > 0 ? peopleGroups[0].id : '',
            startDate: data.eventFrame.startDate,
            endDate: data.eventFrame.endDate,
            status: AssignmentStatus.Pending,
            notes: '',
          };
        }
        break;
      case 'editAssignment':
        if (data?.assignmentToEdit) {
          initialFormData = { ...data.assignmentToEdit };
        }
        break;
      default:
        initialFormData = {};
        break;
    }

    set({
      type,
      data,
      formData: initialFormData,
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
