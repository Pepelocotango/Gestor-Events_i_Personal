import Modal from '../ui/Modal';
import Tooltip from '../ui/Tooltip';

interface MergeOrReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  onReplace: () => void;
  itemType: string; // "persones" o "material"
}

const MergeOrReplaceModal: React.FC<MergeOrReplaceModalProps> = ({ isOpen, onClose, onMerge, onReplace, itemType }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Carregar dades de ${itemType}`}>
      <div className="p-4">
        <p className="text-muted-foreground mb-6">
          Vols fusionar les noves dades de {itemType} amb les existents o vols reemplaçar totes les dades actuals?
        </p>
        <div className="flex justify-end gap-4">
          <Tooltip text="Afegir les noves dades mantenint les existents. Si hi ha conflictes (mateix ID), es mantenen les dades antigues.">
            <button
              onClick={onMerge}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Fusionar
            </button>
          </Tooltip>
          <Tooltip text="Esborrar totes les dades actuals d'aquest tipus i carregar només les noves.">
            <button
              onClick={onReplace}
              className="bg-warning hover:bg-warning/90 text-warning-foreground font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Reemplaçar
            </button>
          </Tooltip>
          <Tooltip text="Cancel·lar la càrrega de dades.">
            <button
              onClick={onClose}
              className="bg-secondary hover:bg-accent text-secondary-foreground font-semibold py-2 px-4 rounded-md transition-colors border border-border"
            >
              Cancel·lar
            </button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  );
};

export default MergeOrReplaceModal;