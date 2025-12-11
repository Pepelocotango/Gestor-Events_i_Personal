export enum AssignmentStatus {
  Pending = 'Pendent',
  Yes = 'Sí',
  No = 'No',
  Mixed = 'Mixt',
}

export interface PersonGroup {
  id: string;
  name: string;
  role?: string;
  tel1?: string;
  tel2?: string;
  email?: string;
  web?: string;
  notes?: string;
}

export interface Assignment {
  id:string;
  personGroupId: string;
  eventFrameId: string;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  notes?: string;
  dailyStatuses?: {
    [dateYYYYMMDD: string]: AssignmentStatus;
  };
}

// --- Tech Sheet Interfaces ---

export type ConditionalStatus = 'yes' | 'no' | 'unset';

export interface ConditionalSection<T extends object = {}> {
  status: ConditionalStatus;
  details: string;
  data?: T;
}

export interface AssemblyScheduleItem {
  id: string;
  date: string;
  time: string;
  timeEnd?: string;
  description: string;
}

export interface NeedItem {
  id: string;
  materialItemId?: string | null;
  quantity: number | string;
  description: string;
  origin: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface TechSheetRoleItem {
  id: string;
  assignmentId?: string;
  role: string;
  quantity: number | string;
  notes?: string;
  printNotes?: boolean;
}

export interface TechSheetProvider {
  id:string;
  personGroupId: string;
  roles: TechSheetRoleItem[];
  isManual?: boolean;
}

export interface TechSheetData {
  // Original fields that must be present
  eventName: string;
  location: string;
  date: string;
  showDuration: string;
  technicalProviders: TechSheetProvider[];
  showTimes?: { id: string; time: string }[];

  // --- NEW FIELDS (optional for backwards compatibility) ---
  generalNotes?: string;
  parking?: ConditionalSection;

  // Sections
  preAssembly?: ConditionalSection;
  schedule?: ConditionalSection<AssemblyScheduleItem[]>;
  logistics?: ConditionalSection; // To group logistics fields

  // Logistics fields (will be inside logistics object in the future)
  dressingRooms?: ConditionalSection<{ details: string }>;
  actorsInfo?: ConditionalSection<{ number: number | string; names: string }>;
  techniciansInfo?: ConditionalSection<{ number: number | string; names: string }>;

  // Technical Needs
  lighting?: ConditionalSection<{ needs: NeedItem[] }>;
  sound?: ConditionalSection<{ needs: NeedItem[] }>;
  video?: ConditionalSection<{ needs: NeedItem[] }>;
  machinery?: ConditionalSection<{ needs: NeedItem[] }>;
  rentals?: ConditionalSection<{ needs: NeedItem[] }>;
  otherEquipment?: ConditionalSection<{ needs: NeedItem[] }>;
  electrical?: ConditionalSection<{ needs: NeedItem[] }>;
  structures?: ConditionalSection<{ needs: NeedItem[] }>;
  platforms?: ConditionalSection<{ needs: NeedItem[] }>;
  consumables?: ConditionalSection<{ needs: NeedItem[] }>;
  curtains?: ConditionalSection<{ needs: NeedItem[] }>;
  transport?: ConditionalSection<{ needs: NeedItem[] }>;
  
  // Other Details
  controlLocation?: string;
  blueprints?: string;

  // Contacts and Observations
  contacts?: ContactPerson[];
  observations?: string;

  // PDF Visibility
  showLogistics?: boolean;
  showPreAssembly?: boolean;
  showSchedule?: boolean;
  showNeeds?: boolean;
  showOther?: boolean;
  showGeneralNotesInPdf?: boolean;
  technicalPersonnelNotes?: string;
  showTechnicalPersonnelNotesInPdf?: boolean;
  technicalNeedsNotes?: string;
  showTechnicalNeedsNotesInPdf?: boolean;
  showScheduleNotesInPdf?: boolean;

  // Legacy fields that might exist in old data
  parkingInfo?: string;
  preAssemblySchedule?: string;
  assemblySchedule?: any[];
  videoDetails?: string;
  companyContact?: string;

  [key: string]: any;
}


export interface EventFrame {
  id: string;
  name: string;
  place?: string;
  startDate: string;
  endDate: string;
  generalNotes?: string;
  personnelComplete?: boolean;
  assignments: Assignment[];
  googleEventId?: string;
  googleCalendarId?: string;
  lastModified?: string;
  lastSync?: string;
  techSheet?: TechSheetData;
  isArchived?: boolean;
}

export type EventFrameForExport = Omit<EventFrame, 'assignments'>;

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  location: string;
  notes?: string;
}

export interface MaterialControlRow {
  item: MaterialItem;
  totalDemand: number;
  balance: number;
  breakdown: {
    eventFrameId: string;
    eventName: string;
    quantity: number;
    startDate: string;
    endDate: string;
  }[];
}

export interface ManagedAppCalendar {
  id: string;
  name: string;
  suffix: string;
}

export interface GoogleConfig {
  userEmail?: string;
  activeAppCalendarId?: string | null;
  managedAppCalendars?: ManagedAppCalendar[];
  selectedCalendarIds?: string[];
  // Obsolete fields, for migration/safety
  appCalendarId?: string;
  calendarSuffix?: string;
  createdWithSuffix?: string;
}

export interface GoogleConfigForExport {
  userEmail?: string;
  activeAppCalendarId?: string | null;
  managedAppCalendars?: ManagedAppCalendar[];
}

export interface AppData {
  eventFrames: EventFrameForExport[];
  peopleGroups: PersonGroup[];
  materialItems: MaterialItem[];
  assignments: Assignment[];
  googleConfig?: GoogleConfigForExport;
}

export interface InitialEventFrameData {
    startDate?: string;
    endDate?: string;
}

export type ShowToastFunction = (
  message: string,
  type?: 'success' | 'error' | 'info' | 'warning'
) => void;


export type ModalType =
  | 'addEventFrame'
  | 'editEventFrame'
  | 'addAssignment'
  | 'editAssignment'
  | 'managePeople'
  | 'eventFrameDetails'
  | 'confirmDeleteEventFrame'
  | 'confirmDeleteAssignment'
  | 'googleSettings'
  | 'confirmHardReset'
  | 'mergeOrReplace'
  | 'selectSyncCalendar'
  | 'createAppCalendar'
  | 'confirmDataRepair'
  | 'confirmDuplicate'
  | 'updateFromAssignments'
  | 'addMaterialFromTechSheet'
  | 'confirmDelete'
  | 'history'
  | 'googleEventDetails'
  | 'about'
  | 'pdfPreview'
  | null;

export interface ModalData {
    pdfUrl?: string;
    eventData?: any;
    toAdd?: Assignment[];
    toRemove?: (TechSheetRoleItem & { personGroupId: string })[];
    toUpdate?: { assignment: Assignment; currentRole: TechSheetRoleItem; newNotes: string }[];
    getPersonGroupById?: (id: string) => PersonGroup | undefined;
    message?: string;
    eventFrameToEdit?: EventFrame;
    eventFrame?: EventFrame;
    assignmentToEdit?: Assignment;
    personGroupId?: string;
    itemName?: string;
    itemId?: string;
    eventFrameId?: string;
    assignmentId?: string;
    startDate?: string;
    endDate?: string;
    status?: AssignmentStatus;
    notes?: string;
    name?: string;
    place?: string;
    generalNotes?: string;
    itemType?: string;
    onConfirm?: (...args: any[]) => void;
    onCancel?: () => void;
    onConfirmSpecial?: (inputValue?: string) => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onCloseModal?: () => void;
    titleOverride?: string;
    newData?: PersonGroup[] | MaterialItem[];
    requiresInput?: boolean;
    suppressSuccessToast?: boolean;
    intent?: 'destructive' | 'constructive';
    managedCalendars?: ManagedAppCalendar[];
    activeCalendarId?: string | null;
    onConfirmSync?: (targetCalendarId: string) => void;
    fixes?: string[];
    onAdd?: (newItem: MaterialItem) => void;
}

export interface ModalState {
  type: ModalType;
  data?: ModalData | null;
}

export type AssignmentOperationResult = {
  success: boolean;
  message?: string;
  warningMessage?: string;
};

export interface SyncProgressState {
  current: number;
  total: number;
  message: string;
  visible: boolean;
}

export interface EventDataConteImplicits {
  eventFrames: EventFrame[];
  peopleGroups: PersonGroup[];
  addEventFrame: (eventFrame: Omit<EventFrame, 'id' | 'assignments' | 'personnelComplete' | 'techSheet'>) => EventFrame;
  updateEventFrame: (eventFrame: EventFrame) => void;
  deleteEventFrame: (eventFrameId: string) => void;
  getEventFrameById: (eventFrameId: string) => EventFrame | undefined;
  openModal: (type: ModalType, data?: ModalData) => void;
  showToast: ShowToastFunction;
  addPersonGroup: (personGroup: Omit<PersonGroup, 'id'>) => void;
  updatePersonGroup: (personGroup: PersonGroup) => void;
  deletePersonGroup: (personGroupId: string) => void;
  getPersonGroupById: (personGroupId: string) => PersonGroup | undefined;
  addAssignment: (eventFrameId: string, assignment: Omit<Assignment, 'id' | 'eventFrameId' | 'dailyStatuses'>, force?: boolean) => AssignmentOperationResult;
  updateAssignment: (assignment: Assignment, force?: boolean, context?: { changedDate?: string }) => AssignmentOperationResult;
  deleteAssignment: (eventFrameId: string, assignmentId: string) => void;  getAssignmentById: (eventFrameId: string, assignmentId: string) => Assignment | undefined;
  loadData: (data: AppData | null) => Promise<void>;
  exportData: () => Promise<AppData>;
  setPersonnelComplete: (eventFrameId: string, complete: boolean) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  googleEvents: any[];
  refreshGoogleEvents: (showToast?: ShowToastFunction) => Promise<{ success: boolean, message?: string, type?: 'success' | 'error' | 'info' | 'warning' }>;
  syncWithGoogle: () => Promise<void>;
  syncProgress: SyncProgressState;
  isSyncing: boolean;
  addOrUpdateTechSheet: (eventFrameId: string, fitxaData: TechSheetData) => void;
  materialItems: MaterialItem[];
  addMaterialItem: (newItemData: Omit<MaterialItem, 'id'>) => MaterialItem | undefined;
  updateMaterialItem: (updatedItem: MaterialItem) => void;
  deleteMaterialItem: (itemId: string) => void;
  addMaterialItemsFromFile: (newItems: MaterialItem[]) => void;
  getMaterialAvailability: (materialId: string, startDate: string, endDate: string, currentEventFrameId: string) => { available: number, total: number };
  mergePeopleGroups: (newPeople: PersonGroup[]) => void;
  replacePeopleGroups: (newPeople: PersonGroup[]) => void;
  replaceMaterialItems: (newItems: MaterialItem[]) => void;
  executeSync: (targetCalendarId: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export type EventDataManagerReturn = Omit<EventDataConteImplicits, 'openModal' | 'showToast'>;

export interface SummaryRow {
  id: string;
  primaryGrouping: string;
  secondaryGrouping?: string;
  eventFrameName: string;
  eventFramePlace?: string;
  eventFrameStartDate: string;
  eventFrameEndDate: string;
  assignmentPersonName: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  assignmentStatus: AssignmentStatus | '';
  assignmentNotes?: string;
  eventFrameGeneralNotes?: string;
  isMixedStatusAssignment?: boolean;
  assignmentObject: Assignment;
  [key: string]: any;
}


export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface BaseCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export interface CalendarAssignmentEvent extends BaseCalendarEvent {
  extendedProps: {
    type: 'assignment';
    eventFrameId: string;
    assignmentId: string;
  };
}

export interface CalendarEventFrameEvent extends BaseCalendarEvent {
  extendedProps: {
    type: 'eventFrame';
    eventFrameId: string;
    assignmentId?: undefined;
  };
  allDay: true;
}

export type CalendarEventType = CalendarAssignmentEvent | CalendarEventFrameEvent;

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  primary?: boolean;
}

export interface ShowSaveDialogOptions {
  title:string;
  defaultPath: string;
  filters: { name: string; extensions: string[] }[];
  data: Buffer | string;
  isDocumentSave?: boolean;
}

export interface ShowSaveDialogResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  message?: string;
}

export interface FileLoadedData {
  success: boolean;
  type: string;
  content?: string;
  fileName?: string;
  message?: string;
}

export interface ElectronAPI {
  // Document Management
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; message?: string; }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; message?: string; }>;
  saveFile: (options: { filePath: string, data: string }) => Promise<{ success: boolean; message?: string; }>;
  showSaveDialog: (options: ShowSaveDialogOptions) => Promise<ShowSaveDialogResult>;
  showUnsavedChangesDialog: (options: { message: string; buttons: string[] }) => Promise<{ response: number }>;

  // Session & App Lifecycle
  onOpenFileTrigger: (callback: (filePath: string) => void) => () => void;
  onConfirmQuit: (callback: () => void) => () => void;
  quitApplication: () => void;
  getSessionData: () => Promise<any>;
  saveSessionData: (key: string, value: any) => Promise<{ success: boolean; message?: string }>;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<{ success: boolean; recentFiles: string[] }>;
  getAppMetadata: () => Promise<{ name: string; version: string; description: string; }>;

  // Google Integration
  loadGoogleConfig: () => Promise<GoogleConfig | null>;
  startGoogleAuth: () => Promise<{ success: boolean; message?: string }>;
  onGoogleAuthSuccess: (callback: () => void) => () => void;
  onGoogleAuthError: (callback: (errorMessage: string) => void) => () => void;
  getCalendarList: () => Promise<{ success: boolean, calendars?: GoogleCalendar[], message?: string }>;
  saveGoogleConfig: (config: Partial<GoogleConfig>) => Promise<{ success: boolean, data?: GoogleConfig, message?: string }>;
  getGoogleEvents: () => Promise<{ success: boolean, events?: any[], message?: string }>;
  getEventDetails: (calendarId: string, eventId: string) => Promise<{ success: boolean, event?: any, message?: string }>;
  syncWithGoogle: (payload: { localData: AppData, targetCalendarId: string }) => Promise<any>;
  onSyncProgress: (callback: (progress: Omit<SyncProgressState, 'visible'>) => void) => () => void;
  googleDisconnect: () => Promise<{ success: boolean; message?: string }>;
  deleteAppCalendar: (calendarId: string) => Promise<{ success: boolean; message?: string; data?: { managedAppCalendars: ManagedAppCalendar[], activeAppCalendarId: string | null } }>;
  createNewAppCalendar: (suffix: string) => Promise<{ success: boolean; message?: string; data?: { managedAppCalendars: ManagedAppCalendar[], activeAppCalendarId: string | null } }>;

  // Menu and Notifications
  onMenuAction: (callback: (action: string) => void) => () => void;
  triggerMenuAction: (action: string) => void;
  onBackendNotification: (callback: (notification: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void) => () => void;

  // Misc & Obsolete
  factoryReset: () => Promise<{ success: boolean; message?: string }>;
  openLogsFolder: () => Promise<{ success: boolean; message?: string }>;
  openBackupsFolder: () => Promise<{ success: boolean; message?: string }>;
  // Obsolete - kept for safety, should be removed later
  loadAppData: () => Promise<any>;
  saveAppData: (data: AppData) => Promise<{ success: boolean; message?: string }>;
  getDefaultDataPath: () => Promise<string>;
  onAppWillRelaunchAfterReset: (callback: () => void) => () => void;
  onSyncError: (callback: (error: string) => void) => () => void;
  onSyncSuccess: (callback: (message: string) => void) => () => void;
  getPlatformSync: () => 'win32' | 'linux' | 'darwin';
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronLog?: {
      debug: (...args: any[]) => void;
      info: (...args: any[]) => void;
      warn: (...args: any[]) => void;
      error: (...args: any[]) => void;
    };
  }
}