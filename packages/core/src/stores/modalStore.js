import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
const initialState = {
    type: null,
    data: null,
    isOpen: false,
};
export const useModalStore = create()(devtools((set) => ({
    ...initialState,
    openModal: (type, data = {}) => {
        set({
            type,
            data,
            isOpen: true,
        });
    },
    closeModal: () => set(initialState),
    updateModalData: (data) => set((state) => ({
        data: state.data ? { ...state.data, ...data } : data,
    })),
}), { name: 'modalStore' }));
//# sourceMappingURL=modalStore.js.map