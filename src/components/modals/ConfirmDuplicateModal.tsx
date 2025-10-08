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
      <p className="text-muted-foreground">{message}</p>
      <p className="text-muted-foreground mt-2">Vols crear l'assignació duplicada de totes maneres?</p>

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text="Tancar aquest diàleg i cancel·lar l'acció">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border"
          >
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Confirmar i crear l'assignació duplicada">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-warning-foreground bg-warning hover:bg-warning/90 rounded-md"
          >
            Confirmar Duplicat
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ConfirmDuplicateModal;