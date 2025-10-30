import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AboutModalProps {
  name: string;
  version: string;
  description: string;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ name, version, description, onClose }) => {
  const GITHUB_URL = 'https://github.com/Pepelocotango/Gestor-Events_i_Personal';

  const handleLinkClick = (url: string) => {
    // The main process will handle opening external links.
    // This is configured in main.cjs setWindowOpenHandler
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 bg-card text-card-foreground rounded-lg shadow-lg max-w-md w-full">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-primary">{name}</h2>
        <p className="text-sm text-muted-foreground">Versió {version}</p>
      </div>

      <div className="my-6 text-center">
        <p className="text-base">{description}</p>
      </div>

      <div className="my-6">
        <h3 className="text-lg font-semibold mb-2 text-center">Enllaços d'Interès</h3>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleLinkClick(GITHUB_URL)}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Repositori a GitHub
            </button>
          </li>
          <li>
            <button
              onClick={() => handleLinkClick('https://paypal.me/RosePep')}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Fes una donació a PayPal
            </button>
          </li>
        </ul>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border"
        >
          Tancar
        </button>
      </div>
    </div>
  );
};

export default AboutModal;
