import React, { useState } from 'react';
import { ShowToastFunction } from '../../types';

interface CommonFormProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

interface ConfirmDeleteProps extends CommonFormProps {
  itemType: string;
  itemName: string;
  onConfirm: (inputValue?: string) => void;
  titleOverride?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onCloseModal?: () => void;
  requiresInput?: boolean;
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
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (requiresInput && !inputValue.trim()) {
      showToast('El camp no pot estar buit.', 'warning');
      return;
    }
    onConfirm(inputValue);
    if (itemType !== "Acció destructiva" && itemType !== "Actualització massiva" && itemType !== "Acció de Sincronització" && !requiresInput) {
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
      <div className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: itemName }} />

      {requiresInput && (
        <div className="mt-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={handleCancelClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md border border-gray-300 dark:border-gray-500"
        >
          {cancelButtonText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
            confirmButtonText.toLowerCase().includes('esborrar') || confirmButtonText.toLowerCase().includes('eliminar')
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {confirmButtonText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;