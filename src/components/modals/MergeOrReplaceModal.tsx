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
      <div className="p-6 max-w-md">
        {/* Context avís */}
        <div className="mb-6 p-4 bg-info/10 border border-info/30 rounded-lg">
          <div className="flex gap-3">
            <div className="text-info text-lg leading-none mt-0.5">ℹ️</div>
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">{t('modals.merge_replace.import_notice_title')}</p>
              <p>{t('modals.merge_replace.import_notice_text')}</p>
            </div>
          </div>
        </div>

        {/* Pregunta principal */}
        <p className="text-foreground font-medium mb-2">{t('modals.merge_replace.question', { itemType })}</p>
        <p className="text-muted-foreground text-sm mb-6">{t('modals.merge_replace.action_hint')}</p>

        {/* Opcions amb descripció */}
        <div className="space-y-3 mb-6">
          <Tooltip text={t('modals.merge_replace.merge_tooltip')}>
            <button
              onClick={onMerge}
              className="w-full text-left p-3 rounded-lg border-2 border-primary hover:bg-primary/10 transition-colors group"
            >
              <div className="font-semibold text-primary group-hover:text-primary/90">✓ {t('modals.merge_replace.merge_button')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('modals.merge_replace.merge_description')}</div>
            </button>
          </Tooltip>
          <Tooltip text={t('modals.merge_replace.replace_tooltip')}>
            <button
              onClick={onReplace}
              className="w-full text-left p-3 rounded-lg border-2 border-warning hover:bg-warning/10 transition-colors group"
            >
              <div className="font-semibold text-warning group-hover:text-warning/90">⚠ {t('modals.merge_replace.replace_button')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('modals.merge_replace.replace_description')}</div>
            </button>
          </Tooltip>
        </div>

        {/* Botons d'acció */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="bg-secondary hover:bg-accent text-secondary-foreground font-semibold py-2 px-4 rounded-md transition-colors border border-border"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MergeOrReplaceModal;