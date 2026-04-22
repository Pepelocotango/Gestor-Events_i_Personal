/**
 * =============================================================================
 * MERGE OR REPLACE MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal per elegir entre fusionar o reemplaçar elements.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: MergeOrReplaceModal amb botons d'acció.
 * =============================================================================
 */

import Modal from '../ui/Modal';
import Tooltip from '../ui/Tooltip';
import { useTranslation } from 'react-i18next';

interface MergeOrReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  onReplace: () => void;
  itemType: string; // "persones" o "material"
}

const MergeOrReplaceModal: React.FC<MergeOrReplaceModalProps> = ({ isOpen, onClose, onMerge, onReplace, itemType }) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('modals.merge_replace.title', { itemType })}>
      <div className="p-4">
        <p className="text-muted-foreground mb-6">
          {t('modals.merge_replace.question', { itemType })}
        </p>
        <div className="flex justify-end gap-4">
          <Tooltip text={t('modals.merge_replace.merge_tooltip')}>
            <button
              onClick={onMerge}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {t('modals.merge_replace.merge_button')}
            </button>
          </Tooltip>
          <Tooltip text={t('modals.merge_replace.replace_tooltip')}>
            <button
              onClick={onReplace}
              className="bg-warning hover:bg-warning/90 text-warning-foreground font-semibold py-2 px-4 rounded-md transition-colors"
            >
              {t('modals.merge_replace.replace_button')}
            </button>
          </Tooltip>
          <Tooltip text={t('modals.merge_replace.cancel_tooltip')}>
            <button
              onClick={onClose}
              className="bg-secondary hover:bg-accent text-secondary-foreground font-semibold py-2 px-4 rounded-md transition-colors border border-border"
            >
              {t('common.cancel')}
            </button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  );
};

export default MergeOrReplaceModal;