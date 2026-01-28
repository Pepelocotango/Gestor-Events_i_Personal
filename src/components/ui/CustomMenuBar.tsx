import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SunIcon, MoonIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ClockIcon } from '../../constants';

import LanguageSelector from '../LanguageSelector';

// Define the structure of menu items
interface MenuItem {
  label?: string;
  action?: string;
  separator?: boolean;
  submenu?: MenuItem[];
  role?: string;
  accelerator?: string;
  disabled?: boolean;
  checked?: boolean;
}

interface CustomMenuBarProps {
  canUndo: boolean;
  canRedo: boolean;
  splashScreenEnabled: boolean;
  onToggleSplashScreen: () => void;
  isDocumentOpen: boolean;
  hasUnsavedChanges: boolean;
  recentFiles: string[];
  theme: string;
  onToggleTheme: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenHistory: () => void;
  modifierKey: string;
}

const CustomMenuBar: React.FC<CustomMenuBarProps> = ({
  canUndo,
  canRedo,
  splashScreenEnabled,
  onToggleSplashScreen,
  isDocumentOpen,
  hasUnsavedChanges,
  recentFiles,
  theme,
  onToggleTheme,
  onUndo,
  onRedo,
  onOpenHistory,
  modifierKey,
}) => {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAction = (action?: string, role?: string) => {
    console.log(`[CustomMenuBar] handleAction called: ${action || role}`);
    console.log(`[CustomMenuBar] window.electronAPI available:`, !!window.electronAPI);
    
    if (window.electronAPI) {
      const actionToSend = action || role;
      if (actionToSend) {
        console.log(`[CustomMenuBar] Sending action: ${actionToSend}`);
        window.electronAPI.triggerMenuAction(actionToSend);
      }
    } else {
      console.warn(`Menu action "${action || role}" clicked, but Electron API is not available.`);
    }
    setOpenMenu(null);
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatAccelerator = (acc?: string) => {
    if (!acc) return '';
    // If it already contains symbol characters, return as-is to avoid double-translating
    if (/[⌘⌥⌃]/.test(acc)) return acc;

    let s = acc;
    // Replace the generic token with the platform modifier (Cmd or Ctrl)
    s = s.replace(/CmdOrCtrl/g, modifierKey);

    // Normalize some token names to display-friendly symbols on mac
    if (modifierKey === '⌘') {
      s = s.replace(/\bAlt\b/g, '⌥');
      s = s.replace(/\bOption\b/g, '⌥');
      s = s.replace(/\bCtrl\b/g, '⌃');
      s = s.replace(/\bPlus\b/g, '+');
      s = s.replace(/\bMinus\b/g, '-');
    } else {
      // Non-mac: make small token normalizations
      s = s.replace(/\bPlus\b/g, '+');
      s = s.replace(/\bMinus\b/g, '-');
    }

    return s;
  };

  const menuData: { label: string; items: MenuItem[] }[] = [
    {
      label: t('menu.file.label'),
      items: [
        { label: t('menu.file.new'), action: 'new-document' },
        { label: t('menu.file.open'), action: 'open-document' },
        {
          label: t('menu.file.open_recent'),
          submenu: recentFiles.length > 0
            ? recentFiles.map(f => ({ label: f, action: `open-recent:${f}` }))
            : [{ label: t('menu.file.no_recent'), disabled: true }],
        },
        { separator: true },
        { label: t('menu.file.save'), action: 'save-document', disabled: !isDocumentOpen || !hasUnsavedChanges },
        { label: t('menu.file.save_as'), action: 'save-as-document', disabled: !isDocumentOpen },
        { separator: true },
        {
          label: t('menu.file.import_export'),
          submenu: [
            { label: t('menu.file.import_people'), action: 'import-people' },
            { label: t('menu.file.export_people'), action: 'export-people' },
            { separator: true },
            { label: t('menu.file.import_material'), action: 'import-material' },
            { label: t('menu.file.export_material'), action: 'export-material' },
          ]
        },
        { separator: true },
        {
          label: t('menu.file.google_calendar'),
          submenu: [
            { label: t('menu.file.sync'), action: 'sync-google' },
            { label: t('menu.file.config'), action: 'config-google' },
            { label: t('menu.file.connect_google'), action: 'connect-google' },
          ],
        },
        { separator: true },
        {
          label: t('menu.file.advanced'),
          submenu: [
            { label: t('menu.file.factory_reset'), action: 'factory-reset' },
          ]
        },
        { separator: true },
        { label: t('menu.file.exit'), action: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: t('menu.edit.label'),
      items: [
        { label: t('menu.edit.undo'), action: 'undo', accelerator: 'CmdOrCtrl+Z', disabled: !canUndo },
        { label: t('menu.edit.redo'), action: 'redo', accelerator: 'CmdOrCtrl+Y', disabled: !canRedo },
        { separator: true },
        { label: t('menu.edit.cut'), role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: t('menu.edit.copy'), role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: t('menu.edit.paste'), role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { separator: true },
        { label: t('menu.edit.select_all'), role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: t('menu.view.label'),
      items: [
        { label: t('menu.view.reload'), role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { label: t('menu.view.force_reload'), role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        // Use tokenized accelerator so we can format it consistently for each platform
        { label: t('menu.view.dev_tools'), role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Alt+I' },
        { separator: true },
        { label: t('menu.view.reset_zoom'), role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { label: t('menu.view.zoom_in'), role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
        { label: t('menu.view.zoom_out'), role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { separator: true },
        { label: t('menu.view.fullscreen'), role: 'togglefullscreen', accelerator: modifierKey === '⌘' ? 'Ctrl+CmdOrCtrl+F' : 'F11' },
        { separator: true },
        {
          label: t('menu.view.toggle_splash'),
          action: 'toggle-splash',
          checked: splashScreenEnabled,
        },
      ],
    },
    {
      label: t('menu.help.label'),
      items: [
        { label: t('menu.help.about'), action: 'open-about-modal' },
        { separator: true },
        { label: t('menu.help.open_backups'), action: 'open-backups-folder' },
        { label: t('menu.help.open_logs'), action: 'open-logs-folder' },
      ],
    },
  ];

  const DropdownMenu: React.FC<{ items: MenuItem[] }> = ({ items }) => (
    <div className="absolute top-full left-0 mt-1 py-1 bg-popover text-popover-foreground border border-border rounded-md z-50 min-w-[240px]">
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="h-px bg-border my-1" />;
        }
        if (item.submenu) {
          return (
            <div key={item.label} className="relative group">
              <div className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex justify-between items-center cursor-default">
                <span>{item.label}</span>
                <svg className="w-4 h-4 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <div className="absolute left-full -top-1 mt-0 py-1 bg-popover border border-border rounded-md hidden group-hover:block min-w-max">
                {item.submenu.map(subItem => (
                  <button
                    key={subItem.label}
                    onClick={() => handleAction(subItem.action, subItem.role)}
                    disabled={subItem.disabled}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
                  >
                    <span>{subItem.label}</span>
                    {subItem.accelerator && <span className="text-xs text-muted-foreground">{subItem.accelerator}</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        }
        return (
          <button
            key={item.label}
            onClick={() => {
              if (item.action === 'toggle-splash') {
                onToggleSplashScreen();
                setOpenMenu(null);
              } else {
                handleAction(item.action, item.role);
              }
            }}
            disabled={item.disabled}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
          >
            <span className="flex items-center">
              <span className="w-4 mr-2 text-center">{item.checked ? '✓' : ''}</span>
              <span>{item.label}</span>
            </span>
            {item.accelerator && <span className="text-xs text-muted-foreground">
              {formatAccelerator(item.accelerator)}
            </span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={menuRef} className="relative flex h-8 bg-secondary text-secondary-foreground w-full justify-between" style={{ userSelect: 'none' }}>
      <div className="flex">
        {menuData.map(menu => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => { if (openMenu) setOpenMenu(menu.label) }}
              className={`px-3 py-1 text-sm h-full ${openMenu === menu.label ? 'bg-accent' : ''} hover:bg-accent focus:outline-none`}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && <DropdownMenu items={menu.items} />}
          </div>
        ))}
      </div>

      {/* Icones de desfer/refer/historial i tema a la dreta */}
      <div className="flex items-center gap-1 px-2">
        <LanguageSelector />
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title={`${t('menu.edit.undo')} (${modifierKey}+Z)`}
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title={`${t('menu.edit.redo')} (${modifierKey}+Y)`}
        >
          <ArrowUturnRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenHistory}
          disabled={!canUndo && !canRedo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('common.history_tooltip')}
        >
          <ClockIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-1 rounded hover:bg-accent focus:outline-none"
          title={theme === 'dark' ? t('common.theme_light') : t('common.theme_dark')}
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5 text-warning" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default CustomMenuBar;
