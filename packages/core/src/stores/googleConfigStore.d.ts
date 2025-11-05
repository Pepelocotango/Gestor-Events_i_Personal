import type { GoogleCalendar, ManagedAppCalendar } from '../types';
interface GoogleConfigState {
    externalCalendars: GoogleCalendar[];
    selectedIds: string[];
    managedCalendars: ManagedAppCalendar[];
    activeCalendarId: string | null;
    loading: boolean;
    error: string | null;
    isSyncing: boolean;
}
interface ActionResult {
    success: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}
interface GoogleConfigActions {
    toggleExternalCalendar: (calendarId: string) => void;
    setActiveCalendarId: (calendarId: string | null) => void;
    resetGoogleConfig: () => void;
}
export declare const useGoogleConfigStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<GoogleConfigState & GoogleConfigActions>, "setState"> & {
    setState(nextStateOrUpdater: (GoogleConfigState & GoogleConfigActions) | Partial<GoogleConfigState & GoogleConfigActions> | ((state: import("immer").WritableDraft<GoogleConfigState & GoogleConfigActions>) => void), shouldReplace?: false): void;
    setState(nextStateOrUpdater: (GoogleConfigState & GoogleConfigActions) | ((state: import("immer").WritableDraft<GoogleConfigState & GoogleConfigActions>) => void), shouldReplace: true): void;
}>;
/**
 * Sets up listeners for Google authentication events from the main process.
 */
export declare const initializeGoogleAuthListeners: () => void;
/**
 * Initiates the Google authentication flow via the main process.
 */
export declare const startGoogleAuthFlow: () => Promise<ActionResult>;
/**
 * Fetches the complete Google Calendar configuration and list of calendars.
 */
export declare const fetchAndLoadConfig: () => Promise<void>;
/**
 * Saves the current configuration of selected and active calendars.
 */
export declare const saveConfig: () => Promise<ActionResult>;
/**
 * Creates a new Google Calendar managed by the application.
 */
export declare const createNewCalendar: (suffix: string) => Promise<ActionResult>;
/**
 * Deletes a managed Google Calendar permanently.
 */
export declare const deleteCalendar: (calendar: ManagedAppCalendar, onConfirm: (result: ActionResult) => void) => void;
/**
 * Disconnects the Google account, deleting all managed calendars and revoking access.
 */
export declare const disconnectGoogle: (onConfirm: (result: ActionResult) => void) => void;
export {};
//# sourceMappingURL=googleConfigStore.d.ts.map