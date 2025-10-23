import React, { useState } from 'react';
import { ShowToastFunction } from '../../types';
import Tooltip from '../ui/Tooltip';

interface CommonFormProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

interface ConfirmDeleteProps extends CommonFormProps {
  itemType: string;
  itemName: string;
  onConfirm?: (inputValue?: string) => void;
  titleOverride?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onCloseModal?: () => void;
  requiresInput?: boolean;
  suppressSuccessToast?: boolean;
  intent?: 'destructive' | 'constructive';
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteProps> = ({
  onClose,
  itemType,
  itemName,
  onConfirm,
  showToast,
  confirmButtonText = "Eliminar",
  cancelButtonText = "Cancel·lar",
  onCloseModal,
  requiresInput = false,
  suppressSuccessToast = false,
  intent,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (requiresInput && !inputValue.trim()) {
      showToast('El camp no pot estar buit.', 'warning');
      return;
    }
    if (onConfirm) {
      onConfirm(inputValue);
    }

    if (!suppressSuccessToast) {
        showToast(`${itemType} eliminat/da correctament.`, 'success');
    }

    onClose();
  };

  const handleCancelClick = () => {
    if (onCloseModal) {
      onCloseModal();
    }
    onClose();
  };

  return (
    <div>
      <div className="text-foreground" dangerouslySetInnerHTML={{ __html: itemName }} />

      {requiresInput && (
        <div className="mt-4">
          <Tooltip text="Introdueix el text de confirmació requerit">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </Tooltip>
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text="Tancar aquest diàleg i cancel·lar l'acció">
          <button
            onClick={handleCancelClick}
            className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border"
          >
            {cancelButtonText}
          </button>
        </Tooltip>
        <Tooltip text="Confirmar i executar l'acció">
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              intent === 'destructive'
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmButtonText}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;