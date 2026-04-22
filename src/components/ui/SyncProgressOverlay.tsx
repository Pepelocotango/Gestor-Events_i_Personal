/**
 * =============================================================================
 * SYNC PROGRESS OVERLAY
 * =============================================================================
 * DESCRIPCIÓ:
 * Overlay de progrés per a la sincronització amb Google Calendar.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React i stores.
 * - COMPONENT PRINCIPAL: SyncProgressOverlay amb barra de progrés i logs.
 * - RENDERITZAT: Visualització de progrés i logs de sincronització.
 * =============================================================================
 */

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../../stores/eventDataStore';

interface SyncProgressOverlayProps {
  progress?: {
    current: number;
    total: number;
    message: string;
    messageKey?: string;
    messageParams?: Record<string, any>;
    visible: boolean;
    logs: string[];
  };
}

const SyncProgressOverlay: React.FC<SyncProgressOverlayProps> = ({ progress: propProgress }) => {
  const { t } = useTranslation();
  // Get state from the store
  const storeProgress = useEventDataStore(state => state.syncProgress);
  const isSyncing = useEventDataStore(state => state.isSyncing);
  const closeSyncProgress = useEventDataStore(state => state.closeSyncProgress);
  
  // Use prop if provided, otherwise use store
  const progress = propProgress || storeProgress;
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.logs]);

  if (!progress.visible) {
    return null;
  }

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  
  // Resolve message: use translated messageKey if provided, otherwise use fallback message
  const displayMessage = progress.messageKey 
    ? String(t(progress.messageKey, progress.messageParams || {}))
    : progress.message;

  return (
    <div className="fixed inset-0 bg-background/80 flex flex-col justify-center items-center z-[9999]" aria-live="assertive" role="alert">
      <div className="bg-popover text-popover-foreground p-6 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">{t('sync.title')}</h2>

        {/* Progress Bar - Only show when syncing */}
        {isSyncing && (
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-secondary text-secondary-foreground">
                  {t('sync.step_progress', { current: progress.current, total: progress.total })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-info">
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-secondary">
              <div 
                style={{ width: `${percentage}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-info transition-all duration-500"
              ></div>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="mb-4 p-3 bg-muted/50 rounded">
          <p className="text-sm font-medium truncate" title={String(displayMessage)}>
            {displayMessage}
          </p>
        </div>

        {/* Logs Console */}
        <div className="mt-4 bg-black/90 text-green-400 font-mono text-xs p-3 h-48 overflow-y-auto rounded border border-zinc-800 shadow-inner">
          {progress.logs.map((log, index) => (
            <div key={index} className="mb-1 border-b border-zinc-900/50 pb-1 last:border-0">
              <span className={log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'}>
                {log}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Close Button - Only show when not syncing */}
        {!isSyncing && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeSyncProgress}
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {t('sync.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncProgressOverlay;
