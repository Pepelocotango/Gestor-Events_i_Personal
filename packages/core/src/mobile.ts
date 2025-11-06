/**
 * Punt d'entrada per a l'aplicació mòbil.
 * Aquest fitxer exporta només els mòduls de `@gep/core` que són compatibles
 * amb React Native i necessaris per a l'app mòbil.
 */

// Tipus essencials
export * from './types';

// Stores compatibles
export { useEventDataStore, initializeEventDataStore } from './stores/eventDataStore';
export { useModalStore } from './stores/modalStore';

// Interfície de l'adaptador de persistència
export type { PersistenceAdapter } from './persistenceAdapter';
