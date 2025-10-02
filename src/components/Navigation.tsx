import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarIcon, BoxIcon, UsersIcon } from '../constants';
import Tooltip from './ui/Tooltip';

const DocumentTextIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Navigation: React.FC = () => {
  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1 px-1.5 text-xs font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow'
        : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
    }`;

  return (
    <nav className="flex justify-center">
      <div className="flex space-x-0.5 bg-gray-200 dark:bg-gray-800 rounded-lg">
        <Tooltip text="Anar a la vista principal del calendari i llista d'esdeveniments">
          <NavLink to="/" className={getLinkClassName}>
            <CalendarIcon className="h-5 w-5" />
            <span>Calendari i Llista</span>
          </NavLink>
        </Tooltip>
        
        <Tooltip text="Anar a la gestió de fitxes tècniques (bolos)">
          <NavLink to="/tech-sheets" className={getLinkClassName}>
            <DocumentTextIcon className="h-5 w-5" />
            <span>Fitxes de Bolo</span>
          </NavLink>
        </Tooltip>

        <Tooltip text="Anar a la gestió de persones i grups">
          <NavLink to="/people" className={getLinkClassName}>
            <UsersIcon className="h-5 w-5" />
            <span>Persones</span>
          </NavLink>
        </Tooltip>

        <Tooltip text="Anar a la gestió d'inventari de material">
          <NavLink to="/material" className={getLinkClassName}>
            <BoxIcon className="h-5 w-5" />
            <span>Material</span>
          </NavLink>
        </Tooltip>
      
      </div>
    </nav>
  );
};

export default Navigation;