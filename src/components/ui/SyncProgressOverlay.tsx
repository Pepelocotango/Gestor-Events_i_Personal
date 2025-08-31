import React from 'react';
import { SyncProgressState } from '../../types';

interface SyncProgressOverlayProps {
  progress: SyncProgressState;
}

const SyncProgressOverlay: React.FC<SyncProgressOverlayProps> = ({ progress }) => {
  if (!progress.visible) {
    return null;
  }

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col justify-center items-center z-[9999]" aria-live="assertive" role="alert">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-white text-xl font-semibold mb-4 text-center">Sincronitzant amb Google Calendar...</h2>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                Pas {progress.current} de {progress.total}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-teal-200">
                {percentage}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-teal-900">
            <div style={{ width: `${percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500"></div>
          </div>
        </div>

        <p className="text-white text-center mt-4 truncate" title={progress.message}>
          {progress.message}
        </p>
      </div>
    </div>
  );
};

export default SyncProgressOverlay;
