import { ModalType, ModalData } from '../types';
interface ModalState {
    type: ModalType;
    data: ModalData | null;
    isOpen: boolean;
}
interface ModalActions {
    openModal: (type: ModalType, data?: ModalData) => void;
    closeModal: () => void;
    updateModalData: (data: Partial<ModalData>) => void;
}
export declare const useModalStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ModalState & ModalActions>, "setState" | "devtools"> & {
    setState(partial: (ModalState & ModalActions) | Partial<ModalState & ModalActions> | ((state: ModalState & ModalActions) => (ModalState & ModalActions) | Partial<ModalState & ModalActions>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: (ModalState & ModalActions) | ((state: ModalState & ModalActions) => ModalState & ModalActions), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;
export {};
//# sourceMappingURL=modalStore.d.ts.map