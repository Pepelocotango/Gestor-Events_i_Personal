// packages/core/src/mobile.ts

/**
* AQUEST ÉS EL PUNT D'ENTRADA EXCLUSIU PER A L'APLICACIÓ MÒBIL.
* Exporta només codi 100% agnòstic de plataforma.
*/

// Tipus i interfícies
export * from './platform-agnostic/types';

// Adaptador de persistència
export * from './platform-agnostic/persistenceAdapter';

// Stores
export * from './platform-agnostic/stores/eventDataStore.base';
export * from './platform-agnostic/stores/modalStore';

// Utilitats
export * from './platform-agnostic/utils/dataIntegrity';
export * from './platform-agnostic/utils/dataMigration';
export * from './platform-agnostic/utils/dateFormat';
export * from './platform-agnostic/utils/dateRangeFormatter';
export * from './platform-agnostic/utils/logger';
export * from './platform-agnostic/utils/selectors';
export * from './platform-agnostic/utils/statusUtils';
export * from './platform-agnostic/utils/techSheetMigration';
