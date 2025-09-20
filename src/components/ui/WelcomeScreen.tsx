import React from 'react';

interface WelcomeScreenProps {
  recentFiles: string[];
  onNewDocument: () => void;
  onOpenDocument: () => void;
  onOpenRecent: (filePath: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  recentFiles,
  onNewDocument,
  onOpenDocument,
  onOpenRecent,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Gestor d'Esdeveniments</h1>
        <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
          Benvingut/da. Si us plau, obre un document existent o crea'n un de nou per començar.
        </p>
        <div className="flex justify-center space-x-4 mb-12">
          <button
            onClick={onNewDocument}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            Nou Document
          </button>
          <button
            onClick={onOpenDocument}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
          >
            Obrir...
          </button>
        </div>

        {recentFiles.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Documents Recents</h2>
            <ul className="space-y-2 text-left">
              {recentFiles.map((filePath, index) => (
                <li key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <button
                    onClick={() => onOpenRecent(filePath)}
                    className="w-full text-left focus:outline-none"
                  >
                    <span className="font-mono text-blue-600 dark:text-blue-400">{filePath}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
