import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, ClockIcon } from '../../constants';

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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAction = (action?: string, role?: string) => {
    if (window.electronAPI) {
      const actionToSend = action || role;
      if (actionToSend) {
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

  const menuData: { label: string; items: MenuItem[] }[] = [
    {
      label: 'Arxiu',
      items: [
        { label: 'Nou Document', action: 'new-document' },
        { label: 'Obrir...', action: 'open-document' },
        {
            label: 'Obrir Recents',
            submenu: recentFiles.length > 0
                ? recentFiles.map(f => ({ label: f, action: `open-recent:${f}` }))
                : [{ label: 'No hi ha fitxers recents', disabled: true }],
        },
        { separator: true },
        { label: 'Guardar', action: 'save-document', disabled: !isDocumentOpen || !hasUnsavedChanges },
        { label: 'Guardar com...', action: 'save-as-document', disabled: !isDocumentOpen },
        { separator: true },
        {
          label: 'Importar / Exportar',
          submenu: [
            { label: 'Importar Persones...', action: 'import-people' },
            { label: 'Exportar Persones...', action: 'export-people' },
            { separator: true },
            { label: 'Importar Material...', action: 'import-material' },
            { label: 'Exportar Material...', action: 'export-material' },
          ]
        },
        { separator: true },
        {
          label: 'Configuració Google Calendar',
          submenu: [
            { label: 'Sincronitzar', action: 'sync-google' },
            { label: 'Configurar', action: 'config-google' },
            { label: 'Connectar amb Google', action: 'connect-google' },
          ],
        },
        { separator: true },
        {
          label: 'Avançat',
          submenu: [
            { label: 'Restaurar Configuració de Fàbrica...', action: 'factory-reset' },
          ]
        },
        {separator: true},
        {label: 'Sortir', action: 'quit', accelerator: 'CmdOrCtrl+Q'},
      ],
    },
    {
      label: 'Edita',
      items: [
        { label: 'Desfer', action: 'undo', accelerator: 'CmdOrCtrl+Z', disabled: !canUndo },
        { label: 'Refer', action: 'redo', accelerator: 'CmdOrCtrl+Y', disabled: !canRedo },
        { separator: true },
        { label: 'Tallar', role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: 'Copiar', role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: 'Enganxar', role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { separator: true },
        { label: 'Seleccionar tot', role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
      ],
    },
    {
      label: 'Veure',
      items: [
        { label: 'Recarregar', role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { label: 'Forçar Recàrrega', role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { label: 'Eines de Desenvolupament', role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' },
        { separator: true },
        { label: 'Restablir Zoom', role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { label: 'Apropar Zoom', role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
        { label: 'Allunyar Zoom', role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { separator: true },
        { label: 'Pantalla Completa', role: 'togglefullscreen', accelerator: 'F11' },
        { separator: true },
        {
          label: "Mostrar Animació d'Inici",
          action: 'toggle-splash',
          checked: splashScreenEnabled,
        },
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
            {item.accelerator && <span className="text-xs text-muted-foreground">{item.accelerator.replace('CmdOrCtrl', modifierKey)}</span>}
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
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title="Desfer (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refer (Ctrl+Y)"
        >
          <ArrowUturnRightIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenHistory}
          disabled={!canUndo && !canRedo}
          className="p-1 rounded hover:bg-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          title="Historial de canvis"
        >
          <ClockIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleTheme}
          className="p-1 rounded hover:bg-accent focus:outline-none"
          title={theme === 'dark' ? 'Canviar a tema clar' : 'Canviar a tema fosc'}
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5 text-warning" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default CustomMenuBar;
