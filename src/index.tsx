/**
 * =============================================================================
 * INDEX
 * =============================================================================
 * DESCRIPCIÓ:
 * Punt d'entrada de l'aplicació React amb interceptor de consola per a logs.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, ReactDOM i App.
 * - INTERCEPTOR DE CONSOLA: Captura de logs i enviament al procés principal.
 * - RENDERITZAT: Muntatge de l'aplicació React al DOM.
 * =============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Import i18n configuration

// --- INTERCEPTOR DE CONSOLA PER A PERSISTÈNCIA DE LOGS ---
// Això captura TOTS els logs de la consola (React, llibreries, etc.) 
// i els envia al procés principal per a que es guardin al fitxer de log.
const electronAPI = (window as any).electronAPI;
if (electronAPI && electronAPI.logToMain) {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
  };

  const levels = ['log', 'warn', 'error', 'debug', 'info'];
  
  levels.forEach(level => {
    (console as any)[level] = (...args: any[]) => {
      // 1. Mostrar a la consola normal (DevTools)
      (originalConsole as any)[level](...args);
      
      // 2. Enviar al procés principal per al fitxer de logs
      try {
        // Mapegem 'log' a 'info' pel backend
        const mappedLevel = level === 'log' ? 'info' : level;
        electronAPI.logToMain(mappedLevel, ...args);
      } catch (e) {
        // Si falla el pont IPC, no fem res per evitar bucles infinits
      }
    };
  });
  
  console.info("[RENDERER] Interceptor de consola activat. Tots els logs es guarden al fitxer.");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);