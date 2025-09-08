import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { EventFrame, Assignment, AssignmentStatus, ShowToastFunction, SummaryRow } from '../types';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import Tooltip from './ui/Tooltip';
import { PlusIcon, CalendarIcon, ListIcon, ChartBarIcon, ChevronUpIcon, ChevronDownIcon, PdfIcon } from '../constants';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import caLocale from '@fullcalendar/core/locales/ca';
import SummaryReports from './SummaryReports';
import Modal from './ui/Modal';
import { addDaysISO, formatDateDMY } from '../utils/dateFormat';
import { exportEventListToPdf } from '../utils/pdfGenerator';
import EventFrameCard from './EventFrameCard';
import { escapeCsvCell } from '../utils/csvUtils';

interface MainDisplayProps {
  setToastMessage: ShowToastFunction;
  currentFilterHighlight: string;
  setCurrentFilterHighlight: (filter: string) => void;
  filterToShowEventFrameId: string | null;
  setFilterToShowEventFrameId: (id: string | null) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false, id }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const buttonId = id ? `${id}-button` : undefined;
  const contentId = id ? `${id}-content` : undefined;
  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);
  return (
    <div className="mb-2 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <Tooltip text={isOpen ? `Col·lapsar secció ${title}` : `Expandir secció ${title}`}>
        <button id={buttonId} onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-1.5 text-left text-base font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t-lg" aria-expanded={isOpen} aria-controls={contentId}>
          <div className="flex items-center gap-1.5">
            {icon && <React.Fragment>{icon}</React.Fragment>}
            <span>{title}</span>
          </div>
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </Tooltip>
      {isOpen && <div id={contentId} className="p-1.5 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
};

const MainDisplay = forwardRef<{ exportCurrentViewToCsv: () => void; handleResize: () => void; }, MainDisplayProps>(({
    setToastMessage,
    currentFilterHighlight,
    setCurrentFilterHighlight,
    filterToShowEventFrameId,
    setFilterToShowEventFrameId,
}, ref) => {
  const calendarRef = useRef<FullCalendar>(null);
  const openModal = useModalStore(state => state.openModal);
  const getPersonGroupById = useEventDataStore(state => state.getPersonGroupById);
  const getEventFrameById = useEventDataStore(state => state.getEventFrameById);
  const getAssignmentById = useEventDataStore(state => state.getAssignmentById);
  const updateAssignment = useEventDataStore(state => state.updateAssignment);
  const updateEventFrame = useEventDataStore(state => state.updateEventFrame);
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const googleEvents = useEventDataStore(state => state.googleEvents);
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const [conflictDialog, setConflictDialog] = useState<{ message: string; personName: string | null } | null>(null);

  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | ''>('');
  const [filterDate, setFilterDate] = useState('');
  const [localFilterUIPerson, setLocalFilterUIPerson] = useState<string>('');
  const [filterUIEventFrame, setFilterUIEventFrame] = useState<string>('');
  const [filterPlace, setFilterPlace] = useState('');
  const eventFrameRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [manualExpandedFrameIds, setManualExpandedFrameIds] = useState<Set<string>>(new Set());
  const [manualExpandedDailyView, setManualExpandedDailyView] = useState<Set<string>>(new Set());

  const filteredAndSortedEventFrames = useMemo(() => {
    let frames = [...eventFrames];
    if (filterUIEventFrame) frames = frames.filter(ef => ef.id === filterUIEventFrame);
    if (filterPlace) {
      const normPlace = filterPlace.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      frames = frames.filter(ef => ef.place && ef.place.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normPlace));
    }
    if (!filterUIEventFrame) {
      if (filterText) {
        const lowerFilterText = filterText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        frames = frames.filter(ef => {
          const efFields = [ef.name, ef.place || '', ef.generalNotes || ''].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const assignFields = ef.assignments.map(a => [getPersonGroupById(a.personGroupId)?.name || '', a.notes || ''].join(' ')).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return efFields.includes(lowerFilterText) || assignFields.includes(lowerFilterText);
        });
      }
      if (filterStatus) frames = frames.filter(ef => ef.assignments.some(a => a.status === filterStatus || (a.status === AssignmentStatus.Mixed && a.dailyStatuses && Object.values(a.dailyStatuses).includes(filterStatus))));
      if (localFilterUIPerson) frames = frames.filter(ef => ef.assignments.some(a => a.personGroupId === localFilterUIPerson));
      if (filterDate) frames = frames.filter(ef => new Date(ef.startDate) <= new Date(filterDate) && new Date(ef.endDate) >= new Date(filterDate));
    }
    return frames.sort((a,b) => sortOrder === 'asc'
      ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [eventFrames, filterText, filterPlace, filterStatus, filterDate, localFilterUIPerson, filterUIEventFrame, peopleGroups, sortOrder]);

  const isAnyFilterActive = !!(filterText || filterPlace || filterStatus || filterDate || localFilterUIPerson || filterUIEventFrame);

  const expandedEventFrameIds = useMemo(() =>
    isAnyFilterActive
      ? new Set(filteredAndSortedEventFrames.map(ef => ef.id))
      : manualExpandedFrameIds,
    [isAnyFilterActive, filteredAndSortedEventFrames, manualExpandedFrameIds]
  );

  const expandedDailyViewAssignmentIds = useMemo(() => {
    if (!isAnyFilterActive) return manualExpandedDailyView;
    const newExpandedAssignments = new Set<string>();
    filteredAndSortedEventFrames.forEach(ef => {
      if (localFilterUIPerson || filterStatus) {
        ef.assignments.forEach(a => {
          const personMatch = !localFilterUIPerson || a.personGroupId === localFilterUIPerson;
          const statusMatch = !filterStatus || a.status === filterStatus || (a.status === AssignmentStatus.Mixed && a.dailyStatuses && Object.values(a.dailyStatuses).includes(filterStatus));
          if (personMatch && statusMatch) {
            newExpandedAssignments.add(a.id);
          }
        });
      }
    });
    return newExpandedAssignments;
  }, [isAnyFilterActive, filteredAndSortedEventFrames, localFilterUIPerson, filterStatus, manualExpandedDailyView]);

  const handleToggleExpand = (id: string) => {
    setManualExpandedFrameIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleToggleDailyView = (id: string) => {
    setManualExpandedDailyView(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const generateAndExportCsv = () => {
    const dataToExport: SummaryRow[] = [];
    filteredAndSortedEventFrames.forEach(ef => {
      if (ef.assignments.length > 0) {
        ef.assignments.forEach(a => {
          const person = getPersonGroupById(a.personGroupId);
          if (!localFilterUIPerson || a.personGroupId === localFilterUIPerson) {
            dataToExport.push({
              id: ef.id + "_" + a.id, primaryGrouping: ef.name, secondaryGrouping: person?.name || 'N/A',
              eventFrameName: ef.name, eventFramePlace: ef.place, eventFrameStartDate: formatDateDMY(ef.startDate),
              eventFrameEndDate: formatDateDMY(ef.endDate), assignmentPersonName: person?.name || 'N/A',
              assignmentStartDate: formatDateDMY(a.startDate), assignmentEndDate: formatDateDMY(a.endDate),
              assignmentStatus: a.status, assignmentNotes: a.notes, eventFrameGeneralNotes: ef.generalNotes,
              assignmentObject: a,
            });
          }
        });
      } else {
        if (!localFilterUIPerson) {
          dataToExport.push({
            id: ef.id, primaryGrouping: ef.name, secondaryGrouping: "Sense assignacions",
            eventFrameName: ef.name, eventFramePlace: ef.place, eventFrameStartDate: formatDateDMY(ef.startDate),
            eventFrameEndDate: formatDateDMY(ef.endDate), assignmentPersonName: 'N/A',
            assignmentStartDate: 'N/A', assignmentEndDate: 'N/A', assignmentStatus: '',
            assignmentNotes: '', eventFrameGeneralNotes: ef.generalNotes,
            assignmentObject: { id: `placeholder-${ef.id}`, personGroupId: '', eventFrameId: ef.id, startDate: '', endDate: '', status: AssignmentStatus.Pending, notes: '' },
          });
        }
      }
    });

    if (dataToExport.length === 0) {
      setToastMessage("No hi ha dades a la vista actual per exportar.", 'info');
      return;
    }

    const headers: (keyof SummaryRow)[] = ["primaryGrouping", "secondaryGrouping", "eventFrameName", "eventFramePlace", "eventFrameStartDate", "eventFrameEndDate", "assignmentPersonName", "assignmentStartDate", "assignmentEndDate", "assignmentStatus", "assignmentNotes", "eventFrameGeneralNotes"];
    const headerDisplayNames: { [key in keyof SummaryRow]?: string } = {
      primaryGrouping: "Agrupació Principal (Nom Esdeveniment Marc)", secondaryGrouping: "Agrupació Secundària (Persona/Grup o 'Sense assignacions')",
      eventFrameName: "Nom Esdeveniment Marc", eventFramePlace: "Lloc Esdeveniment Marc", eventFrameStartDate: "Inici Esdeveniment Marc",
      eventFrameEndDate: "Fi Esdeveniment Marc", assignmentPersonName: "Persona Assignada", assignmentStartDate: "Inici Assignació",
      assignmentEndDate: "Fi Assignació", assignmentStatus: "Estat Assignació", assignmentNotes: "Notes Assignació", eventFrameGeneralNotes: "Notes Generals Marc"
    };
    const headerString = headers.map(h => escapeCsvCell(headerDisplayNames[h] || h)).join(',');
    const rows = dataToExport.map(row => headers.map(header => escapeCsvCell(row[header])).join(','));
    const csvContent = [headerString, ...rows].join('\n');

    const date = new Date();
    const formattedDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
    const personName = localFilterUIPerson ? getPersonGroupById(localFilterUIPerson)?.name?.replace(/[^a-zA-Z0-9]/g, '_') || "persona_filtrada" : "totes";
    const fileName = `llista_vista_actual_${personName}_${formattedDate}.csv`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Vista actual exportada a CSV.", 'success');
  };

  const handleExportListToPdf = () => {
    if (filteredAndSortedEventFrames.length === 0) {
      setToastMessage("No hi ha dades a la vista actual per exportar.", 'info');
      return;
    }
    exportEventListToPdf(filteredAndSortedEventFrames, peopleGroups, setToastMessage);
  };

  useImperativeHandle(ref, () => ({
    handleResize: () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        setTimeout(() => { calendarApi.updateSize(); }, 50);
      }
    },
    exportCurrentViewToCsv: generateAndExportCsv,
  }));

  const calendarEvents = useMemo(() => {
    const localEventGoogleIds = new Set(eventFrames.map(ef => ef.googleEventId).filter(Boolean));
    const localEventsForCalendar = eventFrames.map(ef => ({
      id: ef.id, title: ef.name, start: ef.startDate, end: addDaysISO(ef.endDate, 1), allDay: true,
      className: ef.personnelComplete ? 'event-complete' : 'event-incomplete',
      extendedProps: { type: 'local', googleEventId: ef.googleEventId } 
    }));
    const filteredGoogleEventsForCalendar = googleEvents
      .filter(gEvent => !localEventGoogleIds.has(gEvent.id))
      .map(gEvent => ({
        ...gEvent, backgroundColor: gEvent.backgroundColor, borderColor: gEvent.borderColor,
        extendedProps: { ...gEvent.extendedProps, type: 'google' }
      }));
    return [...localEventsForCalendar, ...filteredGoogleEventsForCalendar];
  }, [eventFrames, googleEvents]);

  const handleGeneralStatusChange = (eventFrameId: string, assignmentId: string, newStatus: AssignmentStatus) => {
    const assignment = getAssignmentById(eventFrameId, assignmentId);
    if (!assignment) return;
    const performUpdate = () => {
        const result = updateAssignment({ ...assignment, status: newStatus, dailyStatuses: undefined });
        if (result.success) {
            setToastMessage(`Estat general de l'assignació actualitzat a ${newStatus}`, 'success');
            setManualExpandedDailyView(prev => {
                const newSet = new Set(prev);
                newSet.delete(assignmentId);
                return newSet;
            });
            if (result.warningMessage && newStatus !== AssignmentStatus.No) {
                setConflictDialog({ message: result.warningMessage, personName: getPersonGroupById(assignment.personGroupId)?.name || 'N/A' });
            }
        } else if (result.message) {
            setToastMessage(result.message, 'error');
        }
    };
    if (assignment.status === AssignmentStatus.Mixed) {
        openModal('confirmDeleteEventFrame', {
            itemType: "Actualització massiva",
            itemName: `Estàs a punt de canviar l'estat general de l'assignació de <strong>${getPersonGroupById(assignment.personGroupId)?.name || ''}</strong>. Això <strong>esborrarà tots els estats diaris personalitzats</strong>. Vols continuar?`,
            onConfirmSpecial: performUpdate, titleOverride: "Confirmar Canvi General", confirmButtonText: "Sí, canviar tot", cancelButtonText: "No, mantenir estats diaris"
        });
    } else {
        performUpdate();
    }
  };
  
  const handleDailyStatusChange = (_efId: string, assign: Assignment, dateYYYYMMDD: string, newDailyStatus: AssignmentStatus) => {
    const person = getPersonGroupById(assign.personGroupId);
    const newDailyStatuses = assign.dailyStatuses ? { ...assign.dailyStatuses } : 
        Array.from({ length: (new Date(assign.endDate).getTime() - new Date(assign.startDate).getTime()) / (1000 * 3600 * 24) + 1 }, (_, i) => addDaysISO(assign.startDate, i))
       .reduce((acc, date) => { acc[date] = assign.status; return acc; }, {} as { [date: string]: AssignmentStatus });
        newDailyStatuses[dateYYYYMMDD] = newDailyStatus;
    const newAssignmentData = { ...assign, status: AssignmentStatus.Mixed, dailyStatuses: newDailyStatuses };
    const result = updateAssignment(newAssignmentData, false, { changedDate: dateYYYYMMDD });
    if (result.success) {
      setToastMessage(`Estat del dia actualitzat a ${newDailyStatus}`, 'success');
      if (result.warningMessage && newDailyStatus !== AssignmentStatus.No) {
        const message = result.warningMessage.startsWith('DUPLICATE_CONFLICT:')
          ? result.warningMessage.replace('DUPLICATE_CONFLICT:', '')
          : result.warningMessage;
        setConflictDialog({ message, personName: person?.name || 'Desconeguda' });
      }
    } else if (result.message) {
      setToastMessage(result.message, 'error');
    }
  };

  useEffect(() => {
    if (filterToShowEventFrameId && eventFrameRefs.current[filterToShowEventFrameId]) {
        const element = eventFrameRefs.current[filterToShowEventFrameId];
        const listSectionButton = document.getElementById('event-list-section-button');
        if (listSectionButton && listSectionButton.getAttribute('aria-expanded') === 'false') {
            listSectionButton.click();
        }
        setTimeout(() => {
            if (element) {
                setManualExpandedFrameIds(prev => new Set(prev).add(filterToShowEventFrameId));
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400', 'transition-all', 'duration-1000', 'ease-in-out', 'rounded-lg');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400');
                    setCurrentFilterHighlight('');
                    setFilterToShowEventFrameId(null);
                }, 3000);
            }
        }, 200);
    }
  }, [filterToShowEventFrameId, setCurrentFilterHighlight, setFilterToShowEventFrameId]);

  useEffect(() => {
    if (currentFilterHighlight && eventFrameRefs.current[currentFilterHighlight]) {
        const element = eventFrameRefs.current[currentFilterHighlight];
        const listSectionButton = document.getElementById('event-list-section-button');
        if (listSectionButton && listSectionButton.getAttribute('aria-expanded') === 'false') {
            listSectionButton.click();
        }
        setTimeout(() => {
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400', 'transition-all', 'duration-1000', 'ease-in-out', 'rounded-lg');
                if (!manualExpandedFrameIds.has(currentFilterHighlight)) {
                    setManualExpandedFrameIds(prev => new Set(prev).add(currentFilterHighlight));
                }
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-blue-400');
                    setCurrentFilterHighlight('');
                }, 3000);
            }
        }, 200);
    }
  }, [currentFilterHighlight, setCurrentFilterHighlight, manualExpandedFrameIds]);

  const handleEditAssignment = (eventFrameId: string, assignmentId: string) => {
    setManualExpandedFrameIds(prev => new Set(prev).add(eventFrameId));
    const eventFrame = getEventFrameById(eventFrameId);
    const assignment = getAssignmentById(eventFrameId, assignmentId);
    if (eventFrame && assignment) openModal('editAssignment', { eventFrame, assignmentToEdit: assignment });
  };

  const handleDeleteAssignment = (eventFrameId: string, assignmentId: string) => {
    setManualExpandedFrameIds(prev => new Set(prev).add(eventFrameId));
    const eventFrame = getEventFrameById(eventFrameId);
    const assignment = getAssignmentById(eventFrameId, assignmentId);
    const person = assignment ? getPersonGroupById(assignment.personGroupId) : null;
    if (eventFrame && assignment) {
      openModal('confirmDeleteAssignment', {
        itemType: "Assignació", itemName: `${person?.name || 'Desconeguda'} a ${eventFrame.name}`,
        eventFrameId, assignmentId
      });
    }
  };

    return (
    <div className="space-y-2">
      <CollapsibleSection title="Vista de Calendari" icon={<CalendarIcon />} defaultOpen={true} id="calendar-section">
        <div className="calendar-wrapper" style={{ padding: '0.25rem' }}>
          <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
                initialView="multiMonth2"
                views={{
                  dayGridMonth: { buttonText: 'Mes' },
                  timeGridWeek: { buttonText: 'Setmana' },
                  listWeek: { buttonText: 'Agenda' },
                  multiMonth2: { type: 'multiMonth', duration: { months: 2 }, buttonText: '2 Mesos', multiMonthMaxColumns: 2 },
                  multiMonth4: { type: 'multiMonth', duration: { months: 4 }, buttonText: '4 Mesos', multiMonthMaxColumns: 2 },
                  multiMonth6: { type: 'multiMonth', duration: { months: 6 }, buttonText: '6 Mesos', multiMonthMaxColumns: 2 }
                }}
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'multiMonth6,multiMonth4,multiMonth2,dayGridMonth,timeGridWeek,listWeek' }}
                locale={caLocale}
                buttonText={{ today: 'Avui' }}
                height="auto"
                contentHeight="auto"
                aspectRatio={1.5}
                events={calendarEvents}
                dateClick={(info) => openModal('addEventFrame', { startDate: info.dateStr })}
                eventClick={(info) => {
                if (info.event.extendedProps.type === 'google') {
                info.jsEvent.preventDefault();
                return;
                }
                const ef = getEventFrameById(info.event.id);
                if (ef) openModal('eventFrameDetails', { eventFrame: ef });
                }}
                />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title={`Llista d'Esdeveniments (${filteredAndSortedEventFrames.length})`} icon={<ListIcon />} defaultOpen={true} id="event-list-section">
        <div className="mb-1 flex justify-start items-center gap-1">
          <Tooltip text="Crear un nou marc d'esdeveniment">
            <button onClick={() => openModal('addEventFrame', {})} className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center gap-1">
              <PlusIcon className="w-4 h-4"/> Afegir Nou Marc
            </button>
          </Tooltip>
          <Tooltip text={`Ordena per data ${sortOrder === 'asc' ? 'descendent' : 'ascendent'}`}>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 text-xs font-medium"
            >
              {sortOrder === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} Ordena
            </button>
          </Tooltip>
        </div>
        
        <div className="mb-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-wrap items-end gap-1">
            <div className="flex-grow min-w-[180px]"><label htmlFor="filterText" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Cerca general</label><Tooltip text="Cerca per nom d'esdeveniment, lloc, notes o nom de persona assignada"><input type="text" id="filterText" value={filterText} onChange={e => setFilterText(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Nom, lloc, persona..."/></Tooltip></div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIEventFrame" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Marc</label><Tooltip text="Filtrar per un marc d'esdeveniment específic"><select id="filterUIEventFrame" value={filterUIEventFrame} onChange={e => setFilterUIEventFrame(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{eventFrames.map(ef => <option key={ef.id} value={ef.id}>{ef.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIPerson" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Persona</label><Tooltip text="Filtrar per persona o grup assignat"><select id="filterUIPerson" value={localFilterUIPerson} onChange={e => setLocalFilterUIPerson(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Totes --</option>{peopleGroups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[110px]"><label htmlFor="filterStatus" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Estat</label><Tooltip text="Filtrar per estat de l'assignació"><select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as AssignmentStatus | '')} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{Object.values(AssignmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></Tooltip></div>
            
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Conté Data</label>
              <Tooltip text="Mostrar només esdeveniments que estiguin actius en aquesta data">
                <input type="date" id="filterDate" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </Tooltip>
               
                {filterDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5"><span className="font-semibold">Filtre:</span> {formatDateDMY(filterDate)}</p>}
            </div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterPlace" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Lloc</label><Tooltip text="Filtrar per lloc de l'esdeveniment"><select id="filterPlace" value={filterPlace} onChange={e => setFilterPlace(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean))).sort().map(place => (<option key={place} value={place!}>{place}</option>))}</select></Tooltip></div>            <div className="flex items-center gap-1">
              <Tooltip text="Exportar la vista actual a PDF">
                <button onClick={handleExportListToPdf} className="p-1.5 rounded-md text-sm font-medium flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                    <PdfIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text="Netejar tots els filtres">
                <button onClick={() => {setFilterText(''); setFilterPlace(''); setFilterStatus(''); setFilterDate(''); setLocalFilterUIPerson(''); setFilterUIEventFrame(''); setFilterToShowEventFrameId(null);}} className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-500 hover:bg-gray-300 dark:hover:bg-gray-400 rounded-md shadow-sm border border-gray-300 dark:border-gray-600">Netejar</button>
              </Tooltip>
            </div>
        </div>

        {filteredAndSortedEventFrames.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No s'han trobat marcs d'esdeveniment.</p>}
        {filteredAndSortedEventFrames.map((ef: EventFrame) => (
          <EventFrameCard
            ref={el => { if (el) eventFrameRefs.current[ef.id] = el; }}
            key={ef.id}
            eventFrame={ef}
            isExpanded={expandedEventFrameIds.has(ef.id)}
            expandedDailyViewAssignmentIds={expandedDailyViewAssignmentIds}
            filters={{ person: localFilterUIPerson, status: filterStatus }}
            onToggleExpand={handleToggleExpand}
            onToggleDailyView={handleToggleDailyView}
            onUpdateEventFrame={updateEventFrame}
            onGeneralStatusChange={handleGeneralStatusChange}
            onDailyStatusChange={handleDailyStatusChange}
            onEditAssignment={handleEditAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            setToastMessage={setToastMessage}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Resums" icon={<ChartBarIcon />} defaultOpen={false} id="summary-section">
         <SummaryReports setToastMessage={setToastMessage} />
      </CollapsibleSection>

      {conflictDialog && <Modal isOpen={true} onClose={() => setConflictDialog(null)} title="Conflicte detectat"><p>{conflictDialog.message}</p><p><strong>Persona:</strong> {conflictDialog.personName}</p><button onClick={() => setConflictDialog(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tanca</button></Modal>}
    </div>
  );
});

export default MainDisplay;
