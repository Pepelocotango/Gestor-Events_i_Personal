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
        <p className="text-sm text-muted-foreground mb-4">
          S'han trobat algunes inconsistències a l'arxiu de dades que s'han corregit automàticament. Si us plau, revisa els canvis. Vols carregar la versió reparada?
        </p>

        <div className="mb-4 p-3 bg-muted/50 rounded-md max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-foreground mb-2">Correccions aplicades:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {fixes.map((fix, index) => (
              <li key={index}>{fix}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Cancel·lar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Carregar Versió Reparada
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmRepairModal;
