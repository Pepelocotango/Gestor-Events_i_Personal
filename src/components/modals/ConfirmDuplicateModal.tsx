import React from 'react';
import Tooltip from '../ui/Tooltip';

interface ConfirmDuplicateModalProps {
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export const ConfirmDuplicateModal: React.FC<ConfirmDuplicateModalProps> = ({
  onClose,
  onConfirm,
  message,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div>
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
      <p className="text-gray-700 dark:text-gray-300 mt-2">Vols crear l'assignació duplicada de totes maneres?</p>

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text="Tancar aquest diàleg i cancel·lar l'acció">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md border border-gray-300 dark:border-gray-500"
          >
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Confirmar i crear l'assignació duplicada">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white rounded-md bg-orange-600 hover:bg-orange-700"
          >
            Confirmar Duplicat
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ConfirmDuplicateModal;
