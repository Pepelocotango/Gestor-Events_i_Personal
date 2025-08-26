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
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Vols fusionar les noves dades de {itemType} amb les existents o vols reemplaçar totes les dades actuals?
        </p>
        <div className="flex justify-end gap-4">
          <Tooltip text="Afegir les noves dades mantenint les existents. Si hi ha conflictes (mateix ID), es mantenen les dades antigues.">
            <button
              onClick={onMerge}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Fusionar
            </button>
          </Tooltip>
          <Tooltip text="Esborrar totes les dades actuals d'aquest tipus i carregar només les noves.">
            <button
              onClick={onReplace}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Reemplaçar
            </button>
          </Tooltip>
          <Tooltip text="Cancel·lar la càrrega de dades.">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors"
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
