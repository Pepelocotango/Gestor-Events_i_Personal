/**
 * =============================================================================
 * CONTROLS
 * =============================================================================
 * DESCRIPCIÓ:
 * Component de controls principals amb botons per guardar, sincronitzar i configuració.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: Controls amb botons d'acció i menú desplegable.
 * - HANDLERS: Gestió de sincronització i obertura de modals.
 * =============================================================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { startGoogleAuthFlow } from '../stores/googleConfigStore';
import { GoogleIcon, CloudArrowUpIcon, ChevronDownIcon, ChevronUpIcon } from '../constants';
import Tooltip from './ui/Tooltip';

interface ControlsProps {
  theme: string;
  toggleTheme: () => void;
  currentFilePath: string | null;
}

const Controls: React.FC<ControlsProps> = ({ currentFilePath }) => {
  const { t } = useTranslation();
  const { syncWithGoogle } = useEventDataStore.getState();
  const isSyncing = useEventDataStore(state => state.isSyncing);
  const { openModal } = useModalStore.getState();

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => setIsExpanded(prev => !prev);

  return (
    <div className="bg-card text-card-foreground rounded-lg w-full p-2">
      <Tooltip text={isExpanded ? t('controls.collapse_tooltip') : t('controls.expand_tooltip')}>
        <div
          onClick={toggleExpansion}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpansion();
            }
          }}
          role="button"
          tabIndex={0}
          className="flex justify-between items-center w-full cursor-pointer"
        >
          {/* Aquest div atura la propagació de l'esdeveniment onMouseEnter per evitar que es mostrin dos tooltips alhora */}
          <div onMouseEnter={(e) => e.stopPropagation()}>
            <Tooltip text={currentFilePath || t('controls.no_file_loaded')}>
              <div className="text-xs text-muted-foreground truncate">
                {t('controls.data_file_label')} <strong>{currentFilePath || t('controls.new_document_unsaved')}</strong>
              </div>
            </Tooltip>
          </div>

          <div>
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </div>
        </div>
      </Tooltip>

      {isExpanded && (
        <div className="pt-2 mt-2 border-t border-border flex flex-col gap-1">
          <div className="flex items-center justify-end w-full">
            <div className="border border-border rounded-lg p-1 flex items-center gap-0.5">
              <Tooltip text={t('controls.sync_google_tooltip')}>
                <button
                  onClick={syncWithGoogle}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1 bg-warning hover:bg-warning/90 text-warning-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait w-40"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('controls.syncing')}</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon />
                      <span>{t('controls.sync_button')}</span>
                    </>
                  )}
                </button>
              </Tooltip>
              <Tooltip text={t('controls.config_google_tooltip')}>
                <button onClick={() => openModal('googleSettings')} className="flex items-center justify-center gap-1 bg-secondary hover:bg-accent text-secondary-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm">
                  <GoogleIcon /> {t('controls.config_button')}
                </button>
              </Tooltip>
              <Tooltip text={t('controls.connect_google_tooltip')}>
                <button
                  onClick={startGoogleAuthFlow}
                  className="flex items-center justify-center gap-1 bg-background hover:bg-accent text-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm border border-border"
                >
                  <GoogleIcon />
                  <span>{t('controls.connect_google_button')}</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;