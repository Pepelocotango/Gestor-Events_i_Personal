/**
 * Punt d'entrada per a l'aplicació mòbil.
 * Aquest fitxer exporta només els mòduls de `@gep/core` que són compatibles
 * amb React Native i necessaris per a l'app mòbil.
 *
 * S'utilitza una re-exportació explícita per millorar la compatibilitat amb Metro.
 */

// Tipus essencials
import * as Types from './types';
export { Types };
export * from './types'; // Mantenim el 'export *' per als tipus per conveniència

// Stores compatibles
import { useEventDataStore, initializeEventDataStore } from './stores/eventDataStore';
import { useModalStore } from './stores/modalStore';
export { useEventDataStore, initializeEventDataStore, useModalStore };


// Interfície de l'adaptador de persistència
import type { PersistenceAdapter as PersistenceAdapterType } from './persistenceAdapter';
export type PersistenceAdapter = PersistenceAdapterType;
