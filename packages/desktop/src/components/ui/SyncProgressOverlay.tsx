import React from 'react';
import { SyncProgressState } from '@gep/core';

interface SyncProgressOverlayProps {
  progress: SyncProgressState;
}

const SyncProgressOverlay: React.FC<SyncProgressOverlayProps> = ({ progress }) => {
  if (!progress.visible) {
    return null;
  }

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-background/80 flex flex-col justify-center items-center z-[9999]" aria-live="assertive" role="alert">
      <div className="bg-popover text-popover-foreground p-8 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Sincronitzant amb Google Calendar...</h2>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-secondary text-secondary-foreground">
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
            <div style={{ width: `${percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-info transition-all duration-500"></div>
          </div>
        </div>

        <p className="text-center mt-4 truncate" title={progress.message}>
          {progress.message}
        </p>
      </div>
    </div>
  );
};

export default SyncProgressOverlay;
