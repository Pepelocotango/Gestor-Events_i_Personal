import React, { useState } from 'react';

interface PdfPreviewModalProps {
  onClose: () => void;
  pdfUrl: string;
  title: string;
  onSave?: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ onClose, pdfUrl, onSave }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    // Retard de 3s per evitar el fons negre del visor natiu
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    // Alçada reduïda a 65vh per evitar que el Modal pare (que sol tenir max-h-70vh o similar)
    // generi una doble barra de scroll.
    <div className="flex flex-col h-[65vh] w-full">
      
      {/* COS: Visor PDF */}
      {/* Eliminada la capçalera interna per evitar duplicitat amb el Modal pare */}
      <div className="flex-grow relative bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-white dark:bg-gray-800">
            <svg 
              className="animate-spin h-8 w-8 text-primary mb-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Generant vista prèvia, espereu uns segons si surt una pantalla negra ...</p>
          </div>
        )}
        <iframe
          src={pdfUrl}
          className={`w-full h-full border-none bg-white transition-opacity duration-500 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          title="Vista Prèvia PDF"
          onLoad={handleIframeLoad}
        />
      </div>

      {/* FOOTER: Botons d'acció (reubicats aquí perquè hem tret la capçalera) */}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border border-border"
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