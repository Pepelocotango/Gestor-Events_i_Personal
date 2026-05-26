/**
 * =============================================================================
 * CONFIRM DUPLICATE MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal de confirmació per accions de duplicació amb botons de confirmació.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: ConfirmDuplicateModal amb botons de confirmació.
 * =============================================================================
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div>
      <p className="text-muted-foreground">{message}</p>
      <p className="text-muted-foreground mt-2">{t('modals.confirm_duplicate.question')}</p>

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text={t('modals.confirm_duplicate.cancel_tooltip')}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border"
          >
            {t('modals.confirm_duplicate.cancel_button')}
          </button>
        </Tooltip>
        <Tooltip text={t('modals.confirm_duplicate.confirm_tooltip')}>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-warning-foreground bg-warning hover:bg-warning/90 rounded-md"
          >
            {t('modals.confirm_duplicate.confirm_button')}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ConfirmDuplicateModal;