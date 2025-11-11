// Re-exports for convenience
export * from './platform-agnostic/types';

// Platform-Agnostic Utils
export * from './platform-agnostic/utils/dateFormat';
export * from './platform-agnostic/utils/logger';
export * from './platform-agnostic/utils/selectors';
export * from './platform-agnostic/utils/statusUtils';
export * from './platform-agnostic/utils/techSheetMigration';
export * from './platform-agnostic/utils/dataIntegrity';
export * from './platform-agnostic/utils/csvUtils';
export * from './platform-agnostic/utils/fileNameUtils';
export * from './platform-agnostic/utils/colorUtils';
export * from './platform-agnostic/utils/dataMigration';
export * from './platform-agnostic/utils/dateRangeFormatter';

// Desktop-Specific Utils (to be moved later)
export * from './utils/pdfGenerator';
export * from './utils/googleCalendarUtils'; // Assuming this exists and was not moved
export * from './utils/themeDefinition'; // Auto-generated, stays here

// Stores
export * from './desktop-specific/stores/eventDataStore.desktop';
export * from './stores/googleConfigStore';
export * from './platform-agnostic/stores/modalStore';
export * from './platform-agnostic/stores/loggingMiddleware';

export * from './platform-agnostic/persistenceAdapter';
