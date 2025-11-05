import type { PersistenceAdapter } from '../persistenceAdapter';
export declare const initializeDesktopActions: (adapter: PersistenceAdapter) => void;
export declare const refreshGoogleEvents: () => Promise<{
    success: boolean;
    message?: string;
    type?: "success" | "error" | "info" | "warning";
}>;
export declare const executeSync: (targetCalendarId: string) => Promise<any>;
export declare const syncWithGoogle: () => Promise<void>;
//# sourceMappingURL=desktopActions.d.ts.map