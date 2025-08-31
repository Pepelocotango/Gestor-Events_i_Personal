import React from 'react';
import Modal from '../ui/Modal';

interface ConfirmRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fixes: string[];
}

const ConfirmRepairModal: React.FC<ConfirmRepairModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fixes,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="S'han detectat i reparat errors a les dades">
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          S'han trobat algunes inconsistències a l'arxiu de dades que s'han corregit automàticament. Si us plau, revisa els canvis. Vols carregar la versió reparada?
        </p>

        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Correccions aplicades:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {fixes.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
          >
            Cancel·lar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Carregar Versió Reparada
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmRepairModal;
