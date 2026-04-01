import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, BoxIcon, UsersIcon, ChartBarIcon, MicrophoneIcon, LayoutGridIcon } from '../constants';
import Tooltip from './ui/Tooltip';

const DocumentTextIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1 px-1.5 text-xs font-medium rounded-md transition-colors ${isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`;

  return (
    <nav className="flex justify-center">
      <div className="flex space-x-2 bg-muted p-1 rounded-lg border border-border">
        <Tooltip text={t('main.nav_calendar_list_tooltip')}>
          <NavLink to="/" className={getLinkClassName}>
            <CalendarIcon className="h-5 w-5" />
            <span>{t('main.nav_calendar_list')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_summaries_tooltip')}>
          <NavLink to="/summaries" className={getLinkClassName}>
            <ChartBarIcon className="h-5 w-5" />
            <span>{t('main.nav_summaries')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_tech_sheets_tooltip')}>
          <NavLink to="/tech-sheets" className={getLinkClassName}>
            <DocumentTextIcon className="h-5 w-5" />
            <span>{t('main.nav_tech_sheets')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_people_tooltip')}>
          <NavLink to="/people" className={getLinkClassName}>
            <UsersIcon className="h-5 w-5" />
            <span>{t('main.nav_people')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_material_tooltip')}>
          <NavLink to="/material" className={getLinkClassName}>
            <BoxIcon className="h-5 w-5" />
            <span>{t('main.nav_material')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_performances_tooltip')}>
          <NavLink to="/performances" className={getLinkClassName}>
            <MicrophoneIcon className="h-5 w-5" />
            <span>{t('performances.nav_title')}</span>
          </NavLink>
        </Tooltip>

        <Tooltip text={t('main.nav_riders_tooltip')}>
          <NavLink to="/riders" className={getLinkClassName}>
            <LayoutGridIcon className="h-5 w-5" />
            <span>{t('main.nav_riders')}</span>
          </NavLink>
        </Tooltip>

      </div>
    </nav>
  );
};

export default Navigation;