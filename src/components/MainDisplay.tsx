import React, { useState, useRef, useEffect, useMemo, useImperativeHandle } from 'react';
import { Assignment, AssignmentStatus, ShowToastFunction, EventFrame } from '../types';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import Tooltip from './ui/Tooltip';
import { PlusIcon, CalendarIcon, ListIcon, ChartBarIcon, ChevronUpIcon, ChevronDownIcon } from '../constants';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import caLocale from '@fullcalendar/core/locales/ca';
import SummaryReports from './SummaryReports';
import { addDaysISO, formatDateDMY } from '../utils/dateFormat';
import EventFrameCard from './EventFrameCard';
import { selectFilteredEventFrames } from '../utils/selectors';
import logger from '../utils/logger';

interface MainDisplayProps {
  setToastMessage: ShowToastFunction;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false, id, isOpen: controlledIsOpen, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(prev => !prev);
    }
  };

  useEffect(() => {
    if (!isControlled) {
      setInternalIsOpen(defaultOpen);
    }
  }, [defaultOpen, isControlled]);

  const buttonId = id ? `${id}-button` : undefined;
  const contentId = id ? `${id}-content` : undefined;

  return (
    <div className="mb-2 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <Tooltip text={isOpen ? `Col·lapsar secció ${title}` : `Expandir secció ${title}`}>
        <button id={buttonId} onClick={handleToggle} className="w-full flex justify-between items-center p-1.5 text-left text-base font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-t-lg" aria-expanded={isOpen} aria-controls={contentId}>
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

const MainDisplay = React.forwardRef<
  { resize: () => void },
  MainDisplayProps
>(({ setToastMessage }, ref) => {
  const calendarRef = useRef<FullCalendar>(null);
  const openModal = useModalStore(state => state.openModal);

  useImperativeHandle(ref, () => ({
    resize: () => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    },
  }));

  // --- State from Zustand Store (Reactive) ---
  const eventFrames = useEventDataStore(state => state.eventFrames);
  const googleEvents = useEventDataStore(state => state.googleEvents);
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);
  
  // Filtres centralitzats de l'store
  const filterText = useEventDataStore(state => state.filterText);
  const filterStatus = useEventDataStore(state => state.filterStatus);
  const filterDate = useEventDataStore(state => state.filterDate);
  const localFilterUIPerson = useEventDataStore(state => state.localFilterUIPerson);
  const filterPlace = useEventDataStore(state => state.filterPlace);
  const filterUIEventFrame = useEventDataStore(state => state.filterUIEventFrame);
  const setManualExpandedFrameIds = useEventDataStore(state => state.setManualExpandedFrameIds);

  // --- Actions from Zustand Store (Non-reactive) ---
  // Actions are stable and can be safely retrieved once.
  const {
    getPersonGroupById,
    getEventFrameById,
    getAssignmentById,
    updateAssignment,
    updateEventFrame, // This is intentionally kept for the child component
    setFilterText,
    setFilterStatus,
    setFilterDate,
    setLocalFilterUIPerson,
    setFilterPlace,
    setFilterUIEventFrame,
    clearAllFilters,
  } = useEventDataStore.getState();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estats d'expansió centralitzats
  const isEventListExpanded = useEventDataStore(state => state.isEventListExpanded);
  const manualExpandedFrameIds = useEventDataStore(state => state.manualExpandedFrameIds);
  const [manualExpandedDailyView, setManualExpandedDailyView] = useState<Set<string>>(new Set());

  const highlightedEventId = useEventDataStore(state => state.highlightedEventId);

  // Removed noisy render logs to avoid spamming console and potential perf issues

  const validationResult = useMemo(() => {
  // Validació iniciada

    if (!eventFrames || !Array.isArray(eventFrames)) {
      console.error('[MainDisplay] Error: eventFrames no és vàlid');
      return { isValid: false, error: 'eventFrames no és vàlid.' };
    }

    if (!googleEvents || !Array.isArray(googleEvents)) {
      console.error('[MainDisplay] Error: googleEvents no és vàlid');
      return { isValid: false, error: 'googleEvents no és vàlid.' };
    }

    if (!peopleGroups || !Array.isArray(peopleGroups)) {
      console.error('[MainDisplay] Error: peopleGroups no és vàlid');
      return { isValid: false, error: 'peopleGroups no és vàlid.' };
    }

  // Dades carregades correctament
    return { isValid: true, error: null };
  }, [eventFrames, googleEvents, peopleGroups]);

  if (!validationResult.isValid) {
    return <p>Error: {validationResult.error}</p>;
  }

  const filteredEventFrames = useMemo(() => {
    return selectFilteredEventFrames({
      eventFrames,
      peopleGroups,
      filterText,
      filterStatus,
      filterDate,
      localFilterUIPerson,
      filterPlace,
      filterUIEventFrame
    });
  }, [eventFrames, peopleGroups, filterText, filterStatus, filterDate, localFilterUIPerson, filterPlace, filterUIEventFrame]);

  const filteredAndSortedEventFrames = useMemo(() => {
    return filteredEventFrames.sort((a, b) => sortOrder === 'asc'
      ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [filteredEventFrames, sortOrder]);

  useEffect(() => {
    if (highlightedEventId) {
      // Afegeix un petit retard per donar temps al DOM a actualitzar-se,
      // especialment si la secció de la llista estava col·lapsada.
      const effectTimer = setTimeout(() => {
        logger.info(`[Highlight Effect] Effect triggered for ID: ${highlightedEventId}`);
        const element = document.getElementById(`event-card-${highlightedEventId}`);

        if (!element) {
          logger.warn(`[Highlight Effect] Element with ID event-card-${highlightedEventId} not found in DOM.`);
          return;
        }

        logger.info(`[Highlight Effect] Element found. Scrolling and highlighting.`);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-event-frame');

        const highlightEndTimer = setTimeout(() => {
          element.classList.remove('highlight-event-frame');
          useEventDataStore.getState().setHighlightedEventId(null);
        }, 3000);

        return () => clearTimeout(highlightEndTimer);
      }, 100); // 100ms de retard

      return () => clearTimeout(effectTimer);
    }
  }, [highlightedEventId, filteredAndSortedEventFrames]);

  const isAnyFilterActive = !!(filterText || filterPlace || filterStatus || filterDate || localFilterUIPerson || filterUIEventFrame);

  const handleToggleExpand = (id: string) => {
    logger.info(`[UI Interaction] Toggle manual expansion for EventFrame ID: ${id}`);
    setManualExpandedFrameIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandedEventFrameIds = useMemo(() => {
    // When any filter is active, all visible cards are expanded by default to show context.
    if (isAnyFilterActive) {
      return new Set(filteredAndSortedEventFrames.map(ef => ef.id));
    }
    // When no filters are active, expansion is controlled manually by the user.
    return manualExpandedFrameIds;
  }, [isAnyFilterActive, filteredAndSortedEventFrames, manualExpandedFrameIds]);

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

  const handleToggleDailyView = (id: string) => {
    setManualExpandedDailyView((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const calendarEvents = useMemo(() => {
  // Actualitzant esdeveniments del calendari
    try {
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
      const events = [...localEventsForCalendar, ...filteredGoogleEventsForCalendar];
  // Calendari actualitzat
      return events;
    } catch (error) {
      console.error('[MainDisplay] Error actualitzant esdeveniments del calendari:', error);
      return [];
    }
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
                // setConflictDialog({ message: result.warningMessage, personName: peopleMap.get(assignment.personGroupId) || 'N/A' });
            }
        } else if (result.message) {
            setToastMessage(result.message, 'error');
        }
    };
    if (assignment.status === AssignmentStatus.Mixed) {
        openModal('confirmDeleteEventFrame', {
            itemType: "Actualització massiva",
            itemName: `Estàs a punt de canviar l'estat general de l'assignació de <strong>${peopleMap.get(assignment.personGroupId) || ''}</strong>. Això <strong>esborrarà tots els estats diaris personalitzats</strong>. Vols continuar?`,
            onConfirmSpecial: performUpdate, titleOverride: "Confirmar Canvi General", confirmButtonText: "Sí, canviar tot", cancelButtonText: "No, mantenir estats diaris"
        });
    } else {
        performUpdate();
    }
  };
  
  const handleDailyStatusChange = (_efId: string, assign: Assignment, dateYYYYMMDD: string, newDailyStatus: AssignmentStatus) => {
    const newDailyStatuses = assign.dailyStatuses ? { ...assign.dailyStatuses } : 
        Array.from({ length: (new Date(assign.endDate).getTime() - new Date(assign.startDate).getTime()) / (1000 * 3600 * 24) + 1 }, (_, i) => addDaysISO(assign.startDate, i))
       .reduce((acc, date) => { acc[date] = assign.status; return acc; }, {} as { [date: string]: AssignmentStatus });
        newDailyStatuses[dateYYYYMMDD] = newDailyStatus;
    const newAssignmentData = { ...assign, status: AssignmentStatus.Mixed, dailyStatuses: newDailyStatuses };
    const result = updateAssignment(newAssignmentData, false, { changedDate: dateYYYYMMDD });
    if (result.success) {
      setToastMessage(`Estat del dia actualitzat a ${newDailyStatus}`, 'success');
      if (result.warningMessage && newDailyStatus !== AssignmentStatus.No) {
        // setConflictDialog({ message: result.warningMessage, personName: person?.name || 'Desconeguda' });
      }
    } else if (result.message) {
      setToastMessage(result.message, 'error');
    }
  };

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
                dateClick={(info) => openModal('addEventFrame', {
                  name: '',
                  place: '',
                  startDate: info.dateStr,
                  endDate: info.dateStr,
                  generalNotes: '',
                })}
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

      <CollapsibleSection title={`Llista d'Esdeveniments (${filteredAndSortedEventFrames.length})`} icon={<ListIcon />} isOpen={isEventListExpanded} onToggle={() => useEventDataStore.getState().toggleEventListExpanded()} id="event-list-section">
        <div className="mb-1 flex justify-start items-center gap-1">
          <Tooltip text="Crear un nou marc d'esdeveniment">
            <button onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              openModal('addEventFrame', {
                name: '',
                place: '',
                startDate: today,
                endDate: today,
                generalNotes: '',
              });
            }} className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center gap-1">
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
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIEventFrame" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Marc</label><Tooltip text="Filtrar per un marc d'esdeveniment específic"><select id="filterUIEventFrame" value={filterUIEventFrame || ''} onChange={e => setFilterUIEventFrame(e.target.value || null)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{eventFrames.map(ef => <option key={ef.id} value={ef.id}>{ef.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIPerson" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Persona</label><Tooltip text="Filtrar per persona o grup assignat"><select id="filterUIPerson" value={localFilterUIPerson} onChange={e => setLocalFilterUIPerson(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Totes --</option>{peopleGroups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[110px]"><label htmlFor="filterStatus" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Estat</label><Tooltip text="Filtrar per estat de l'assignació"><select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as AssignmentStatus | '')} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{Object.values(AssignmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></Tooltip></div>
            
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Conté Data</label>
              <Tooltip text="Mostrar només esdeveniments que estiguin actius en aquesta data">
                <input type="date" id="filterDate" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </Tooltip>
               
                {filterDate && <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5"><span className="font-semibold">Filtre:</span> {formatDateDMY(filterDate)}</p>}
            </div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterPlace" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Lloc</label><Tooltip text="Filtrar per lloc de l'esdeveniment"><select id="filterPlace" value={filterPlace} onChange={e => setFilterPlace(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"><option value="">-- Tots --</option>{Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean))).sort().map(place => (<option key={place} value={place!}>{place}</option>))}</select></Tooltip></div>            <div className="flex items-center gap-1">
              <Tooltip text="Netejar tots els filtres">
                <button onClick={clearAllFilters} className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-500 hover:bg-gray-300 dark:hover:bg-gray-400 rounded-md shadow-sm border border-gray-300 dark:border-gray-600">Netejar</button>
              </Tooltip>
            </div>
        </div>

        {filteredAndSortedEventFrames.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No s'han trobat marcs d'esdeveniment.</p>}
        {filteredAndSortedEventFrames.map((ef: EventFrame) => (
          <EventFrameCard
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

      {/* {conflictDialog && <Modal isOpen={true} onClose={() => setConflictDialog(null)} title="Conflicte detectat"><p>{conflictDialog.message}</p><p><strong>Persona:</strong> {conflictDialog.personName}</p><button onClick={() => setConflictDialog(null)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tanca</button></Modal>} */}
    </div>
  );
});

export default MainDisplay;
