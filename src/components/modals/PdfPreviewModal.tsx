import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface PdfPreviewModalProps {
  onClose: () => void;
  pdfUrl: string;
  title: string;
  onSave?: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ onClose, pdfUrl, title, onSave }) => {
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
      <div className="flex-grow">
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          className="border border-gray-300 dark:border-gray-700 rounded"
          title="Vista Prèvia PDF"
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
