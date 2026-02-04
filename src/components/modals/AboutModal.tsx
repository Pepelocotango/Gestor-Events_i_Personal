import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

interface AboutModalProps {
  name: string;
  version: string;
  description: string;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ name, version, description, onClose }) => {
  const { t } = useTranslation();
  const GITHUB_URL = 'https://github.com/Pepelocotango/Gestor-Events_i_Personal';
  const PAYPAL_URL = 'https://paypal.me/RosePep';
  const currentYear = new Date().getFullYear();
  const descriptionText = t('modals.about.description', { defaultValue: description });

  const handleLinkClick = (url: string) => {
    // The main process will handle opening external links.
    // This is configured in main.cjs setWindowOpenHandler
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">{name}</h2>
        <p className="text-sm text-muted-foreground">{t('modals.about.version', { version })}</p>
      </div>

      <div className="text-center">
        <p className="text-base">{descriptionText}</p>
      </div>

      <div className="flex flex-col items-center text-center space-y-3">
        <h3 className="text-lg font-semibold">{t('modals.about.links_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('modals.about.collaboration_intro')}</p>
        <button
          onClick={() => handleLinkClick(GITHUB_URL)}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('modals.about.github_button')}
        </button>
        <p className="text-sm text-muted-foreground">{t('modals.about.collaboration_or')}</p>
        <button
          onClick={() => handleLinkClick(PAYPAL_URL)}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('modals.about.paypal_button')}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground text-center">
        {t('modals.about.copyright', { year: currentYear, version })}
      </p>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border"
        >
          {t('common.close_button', { defaultValue: t('common.cancel') })}
        </button>
      </div>
    </div>
  );
};

export default AboutModal;
