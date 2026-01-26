import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">{t('welcome.title')}</h1>
        <p className="text-lg mb-8 text-muted-foreground">
          {t('welcome.description')}
        </p>
        <div className="flex justify-center space-x-4 mb-12">
          <button
            onClick={onNewDocument}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75"
          >
            {t('menu.file.new')}
          </button>
          <button
            onClick={onOpenDocument}
            className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg shadow-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75"
          >
            {t('menu.file.open')}
          </button>
        </div>

        {recentFiles.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('menu.file.open_recent')}</h2>
            <ul className="space-y-2 text-left">
              {recentFiles.map((filePath, index) => (
                <li key={index} className="bg-card p-3 rounded-lg shadow-sm hover:bg-accent transition-colors">
                  <button
                    onClick={() => onOpenRecent(filePath)}
                    className="w-full text-left focus:outline-none"
                  >
                    <span className="font-mono text-primary">{filePath}</span>
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
