import React, { useState, useEffect, useRef } from 'react';

// Define the structure of menu items
interface MenuItem {
  label?: string;
  action?: string;
  separator?: boolean;
  submenu?: MenuItem[];
  role?: string; // For view actions
}

const CustomMenuBar: React.FC = () => {
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
        { label: 'Carregar Tot', action: 'load-all' },
        { label: 'Guardar Tot', action: 'save-all' },
        { label: 'Carregar Material', action: 'load-material' },
        { label: 'Carregar Persones', action: 'load-people' },
        { separator: true },
        { label: 'Guardar Persones', action: 'save-people' },
        { label: 'Guardar Material', action: 'save-material' },
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
        { label: 'Començar de Zero', action: 'hard-reset' },
        { label: 'Tema Clar/Fosc', action: 'toggle-theme' },
        { separator: true },
        { label: 'Sortir', action: 'quit' },
      ],
    },
    {
      label: 'Veure',
      items: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Forçar Recàrrega', role: 'forceReload' },
        { label: 'Eines de Desenvolupament', role: 'toggleDevTools' },
        { separator: true },
        { label: 'Restablir Zoom', role: 'resetZoom' },
        { label: 'Apropar Zoom', role: 'zoomIn' },
        { label: 'Allunyar Zoom', role: 'zoomOut' },
        { separator: true },
        { label: 'Pantalla Completa', role: 'togglefullscreen' },
      ],
    },
  ];

  const DropdownMenu: React.FC<{ items: MenuItem[] }> = ({ items }) => (
    <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 min-w-[240px]">
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={`separator-${index}`} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
        }
        if (item.submenu) {
          return (
            <div key={item.label} className="relative group">
              <div className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center cursor-default">
                <span>{item.label}</span>
                <svg className="w-4 h-4 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <div className="absolute left-full -top-1 mt-0 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg hidden group-hover:block min-w-max">
                {item.submenu.map(subItem => (
                   <button
                      key={subItem.label}
                      onClick={() => handleAction(subItem.action, subItem.role)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {subItem.label}
                    </button>
                ))}
              </div>
            </div>
          )
        }
        return (
          <button
            key={item.label}
            onClick={() => handleAction(item.action, item.role)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={menuRef} className="relative flex h-8 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full" style={{ userSelect: 'none' }}>
      <div className="flex">
        {menuData.map(menu => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => { if (openMenu) setOpenMenu(menu.label) }}
              className={`px-3 py-1 text-sm h-full ${openMenu === menu.label ? 'bg-gray-300 dark:bg-gray-700' : ''} hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none`}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && <DropdownMenu items={menu.items} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomMenuBar;
