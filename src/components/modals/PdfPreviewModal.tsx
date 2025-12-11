import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface PdfPreviewModalProps {
  onClose: () => void;
  pdfUrl: string;
  title: string;
  onSave?: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ onClose, pdfUrl, title, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 h-[85vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-grow relative">
        {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded">            <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300">Carregant vista prèvia...</p>
          </div>
        )}
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          className={`relative z-0 border border-gray-300 dark:border-gray-700 rounded transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}          title="Vista Prèvia PDF"
          onLoad={() => setIsLoading(false)}
        />
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Tancar
        </button>
        {onSave && (
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            Desar PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfPreviewModal;
