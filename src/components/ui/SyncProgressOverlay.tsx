import React, { useEffect, useRef } from 'react';
import { SyncProgressState } from '../../types';

interface SyncProgressOverlayProps {
  progress: SyncProgressState;
}

const SyncProgressOverlay: React.FC<SyncProgressOverlayProps> = ({ progress }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.logs]);

  if (!progress.visible) {
    return null;
  }

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-background/80 flex flex-col justify-center items-center z-[9999]" aria-live="assertive" role="alert">
      <div className="bg-popover text-popover-foreground p-6 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Sincronització amb Google Calendar</h2>

        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full bg-secondary text-secondary-foreground">
                Pas {progress.current} de {progress.total}
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

        {/* Current Status */}
        <div className="mb-4 p-3 bg-muted/50 rounded">
          <p className="text-sm font-medium truncate" title={progress.message}>
            {progress.message}
          </p>
        </div>

        {/* Logs Console */}
        <div className="mt-4 bg-black/90 text-green-400 font-mono text-xs p-3 h-48 overflow-y-auto rounded border border-zinc-800 shadow-inner">
          {progress.logs.map((log, index) => (
            <div key={index} className="mb-1 border-b border-zinc-900/50 pb-1 last:border-0">
              <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>{' '}
              <span className={log.includes('[ERROR]') ? 'text-red-400' : 'text-emerald-400'}>
                {log}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default SyncProgressOverlay;
