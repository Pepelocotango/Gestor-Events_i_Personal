import React, { useState, useRef, useEffect, useMemo, useImperativeHandle } from 'react';
import { Assignment, AssignmentStatus, ShowToastFunction, EventFrame } from '../types';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import Tooltip from './ui/Tooltip';
import { PlusIcon, CalendarIcon, ListIcon, ChartBarIcon, ChevronUpIcon, ChevronDownIcon, DocumentArrowDownIcon, ArchiveIcon } from '../constants';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import caLocale from '@fullcalendar/core/locales/ca';
import SummaryReports from './SummaryReports';
import { addDaysISO, formatDateDMY } from '../utils/dateFormat';
import { exportEventListToPdf } from '../utils/pdfGenerator';
import { exportEventListToCsv } from '../utils/csvUtils';
import EventFrameCard from './EventFrameCard';
import { selectFilteredEventFrames } from '../utils/selectors';
import logger from '../utils/logger';

import CollapsibleSection from './ui/CollapsibleSection';

interface MainDisplayProps {
  setToastMessage: ShowToastFunction;
}

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
    archiveOldEventFrames,
    confirmArchiveEventFrames,
  } = useEventDataStore.getState();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);

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
      filterUIEventFrame,
      showArchived,
    });
  }, [eventFrames, peopleGroups, filterText, filterStatus, filterDate, localFilterUIPerson, filterPlace, filterUIEventFrame, showArchived]);

  const filteredAndSortedEventFrames = useMemo(() => {
    return filteredEventFrames.sort((a, b) => sortOrder === 'asc'
      ? new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [filteredEventFrames, sortOrder]);

  useEffect(() => {
    logger.info(`[MainDisplay] Highlight useEffect triggered. highlightedEventId: ${highlightedEventId}`);
    if (highlightedEventId) {
      // Afegeix un petit retard per donar temps al DOM a actualitzar-se,
      // especialment si la secció de la llista estava col·lapsada.
      const effectTimer = setTimeout(() => {
        logger.info(`[MainDisplay] Highlight setTimeout running for ID: ${highlightedEventId}`);
        const element = document.getElementById(`event-card-${highlightedEventId}`);

        if (!element) {
          logger.warn(`[MainDisplay] Highlight Effect: Element with ID event-card-${highlightedEventId} not found in DOM.`);
          return;
        }

        logger.info(`[MainDisplay] Highlight Effect: Element found. Scrolling and highlighting.`);
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

  useEffect(() => {
    logger.info(`[MainDisplay] manualExpandedFrameIds state changed:`, Array.from(manualExpandedFrameIds));
  }, [manualExpandedFrameIds]);

  const isAnyFilterActive = !!(filterText || filterPlace || filterStatus || filterDate || localFilterUIPerson || filterUIEventFrame);

  const handleToggleExpand = (id: string) => {
    logger.info(`[MainDisplay] handleToggleExpand called for ID: ${id}`);
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

  const areAllVisibleExpanded = useMemo(() => {
    if (isAnyFilterActive || filteredAndSortedEventFrames.length === 0) return true;
    return filteredAndSortedEventFrames.every(ef => manualExpandedFrameIds.has(ef.id));
  }, [manualExpandedFrameIds, filteredAndSortedEventFrames, isAnyFilterActive]);

  const handleToggleAllCards = () => {
    if (areAllVisibleExpanded) {
      // If all are expanded, collapse all
      setManualExpandedFrameIds(() => new Set());
    } else {
      // If some or none are expanded, expand all
      const allVisibleIds = new Set(filteredAndSortedEventFrames.map(ef => ef.id));
      setManualExpandedFrameIds(() => allVisibleIds);
    }
  };

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

    const performUpdate = (force = false) => {
        const result = updateAssignment({ ...assignment, status: newStatus, dailyStatuses: undefined }, force);
        if (result.success) {
            if (result.warningMessage && result.warningMessage.startsWith('DUPLICATE_CONFLICT:')) {
                openModal('confirmDuplicate', {
                    message: result.warningMessage.replace('DUPLICATE_CONFLICT:', ''),
                    onConfirm: () => performUpdate(true),
                });
            } else {
                setToastMessage(`Estat general de l'assignació actualitzat a ${newStatus}`, 'success');
                setManualExpandedDailyView(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(assignmentId);
                    return newSet;
                });
            }
        } else if (result.message) {
            setToastMessage(result.message, 'error');
        }
    };

    if (assignment.status === AssignmentStatus.Mixed) {
        openModal('confirmDeleteEventFrame', {
            itemType: "Actualització massiva",
            itemName: `Estàs a punt de canviar l'estat general de l'assignació de <strong>${peopleMap.get(assignment.personGroupId) || ''}</strong>. Això <strong>esborrarà tots els estats diaris personalitzats</strong>. Vols continuar?`,
            onConfirmSpecial: () => performUpdate(false),
            titleOverride: "Confirmar Canvi General",
            confirmButtonText: "Sí, canviar tot",
            cancelButtonText: "No, mantenir estats diaris"
        });
    } else {
        performUpdate(false);
    }
  };
  
  const handleDailyStatusChange = (_efId: string, assign: Assignment, dateYYYYMMDD: string, newDailyStatus: AssignmentStatus) => {
    const performUpdate = (force = false) => {
        const newDailyStatuses = assign.dailyStatuses ? { ...assign.dailyStatuses } :
            Array.from({ length: (new Date(assign.endDate).getTime() - new Date(assign.startDate).getTime()) / (1000 * 3600 * 24) + 1 }, (_, i) => addDaysISO(assign.startDate, i))
           .reduce((acc, date) => { acc[date] = assign.status; return acc; }, {} as { [date: string]: AssignmentStatus });

        newDailyStatuses[dateYYYYMMDD] = newDailyStatus;
        const newAssignmentData = { ...assign, status: AssignmentStatus.Mixed, dailyStatuses: newDailyStatuses };
        const result = updateAssignment(newAssignmentData, force, { changedDate: dateYYYYMMDD });

        if (result.success) {
            if (result.warningMessage && result.warningMessage.startsWith('DUPLICATE_CONFLICT:')) {
                openModal('confirmDuplicate', {
                    message: result.warningMessage.replace('DUPLICATE_CONFLICT:', ''),
                    onConfirm: () => performUpdate(true),
                });
            } else {
                setToastMessage(`Estat del dia actualitzat a ${newDailyStatus}`, 'success');
            }
        } else if (result.message) {
          setToastMessage(result.message, 'error');
        }
    };
    performUpdate(false);
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
    <CollapsibleSection
      title="Calendari i Llista"
      defaultOpen={true}
      onHeaderDoubleClick={handleToggleAllCards}
    >
      <div className="space-y-1">
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
                eventClick={async (info) => {
                  info.jsEvent.preventDefault(); // Prevenim l'acció per defecte per a tots els clics

                  if (info.event.extendedProps.type === 'google') {
                    if (window.electronAPI) {
                      const { calendarId } = info.event.extendedProps;
                      const eventId = info.event.id;

                      try {
                        const result = await window.electronAPI.getEventDetails(calendarId, eventId);
                        if (result.success && result.event) {
                          openModal('googleEventDetails', { eventData: result.event });
                        } else {
                          setToastMessage(result.message || "No s'han pogut obtenir els detalls de l'esdeveniment.", 'error');
                        }
                      } catch (error) {
                        setToastMessage(`Error de comunicació: ${(error as Error).message}`, 'error');
                      }
                    }
                  } else {
                    const ef = getEventFrameById(info.event.id);
                    if (ef) openModal('eventFrameDetails', { eventFrame: ef });
                  }
                }}
                />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={showArchived ? `Esdeveniments Arxivats (${filteredAndSortedEventFrames.length})` : `Llista d'Esdeveniments (${filteredAndSortedEventFrames.length})`}
        icon={<ListIcon />}
        isExpanded={isEventListExpanded}
        onToggle={() => useEventDataStore.getState().toggleEventListExpanded()}
        id="event-list-section"
      >
        <div className="mb-1 flex justify-start items-center gap-1">
          <Tooltip text="Crear un nou marc d'esdeveniment">
            <button data-testid="add-event-frame-button" onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              openModal('addEventFrame', {
                name: '',
                place: '',
                startDate: today,
                endDate: today,
                generalNotes: '',
              });
            }} className="px-2 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold flex items-center gap-1">
              <PlusIcon className="w-4 h-4"/> Afegir Nou Marc
            </button>
          </Tooltip>
          <Tooltip text={`Ordena per data ${sortOrder === 'asc' ? 'descendent' : 'ascendent'}`}>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs font-medium"
            >
              {sortOrder === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} Ordena
            </button>
          </Tooltip>
            <div className="border-l border-border h-6 mx-1"></div>
            <Tooltip text="Mostrar o ocultar els esdeveniments arxivats">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="showArchived"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
                    />
                    <label htmlFor="showArchived" className="ml-2 text-sm font-medium text-foreground">
                        Mostrar arxivats
                    </label>
                </div>
            </Tooltip>
            <Tooltip text={areAllVisibleExpanded ? "Col·lapsar totes les targetes" : "Expandir totes les targetes"}>
              <button
                onClick={handleToggleAllCards}
                className="px-2 py-0.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs font-medium"
                disabled={isAnyFilterActive || filteredAndSortedEventFrames.length === 0}
              >
                {areAllVisibleExpanded ? "Col·lapsar Tot" : "Expandir Tot"}
              </button>
            </Tooltip>
            <div className="flex-grow"></div>
            <Tooltip text="Arxivar esdeveniments antics (finalitzats fa més d'un mes)">
                <button
                    onClick={() => {
                        const eventsToArchive = archiveOldEventFrames();
                        if (eventsToArchive.length > 0) {
                            const oneMonthAgo = new Date();
                            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                            const formattedDate = oneMonthAgo.toLocaleDateString('ca-ES');

                            openModal('confirmDelete', {
                                itemType: 'Esdeveniments',
                                itemName: `S'arxivaran <strong>${eventsToArchive.length}</strong> esdeveniments finalitzats abans del <strong>${formattedDate}</strong>.`,
                                onConfirm: () => {
                                    const eventIds = eventsToArchive.map(e => e.id);
                                    confirmArchiveEventFrames(eventIds);
                                    setToastMessage(`${eventIds.length} esdeveniment(s) arxivat(s) correctament.`, 'success');
                                },
                                titleOverride: "Confirmació Arxivar",
                                confirmButtonText: "Arxivar Antics",
                                suppressSuccessToast: true,
                                intent: 'destructive'
                            });
                        } else {
                            setToastMessage("No hi ha esdeveniments antics per arxivar.", 'info');
                        }
                    }}
                    className="flex items-center justify-center gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm"
                >
                    <ArchiveIcon className="w-4 h-4" /> Arxivar Antics
                </button>
            </Tooltip>
              <Tooltip text="Exportar la llista d'esdeveniments i assignacions a PDF">
                <button
                  onClick={() => exportEventListToPdf(
                    filteredAndSortedEventFrames,
                    peopleGroups,
                    setToastMessage,
                    { filterText, filterStatus, filterDate, localFilterUIPerson, filterPlace, filterUIEventFrame }
                  )}
                  className="flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> PDF
                </button>
              </Tooltip>
              <Tooltip text="Exportar la llista d'esdeveniments i assignacions a CSV">
                <button
                  onClick={() => exportEventListToCsv(
                    filteredAndSortedEventFrames,
                    peopleGroups,
                    setToastMessage,
                    { filterText, filterStatus, filterDate, localFilterUIPerson, filterPlace, filterUIEventFrame }
                  )}
                  className="flex items-center justify-center gap-1 bg-success hover:bg-success/90 text-success-foreground font-semibold py-1 px-2 rounded-md transition-colors text-sm"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" /> CSV
                </button>
              </Tooltip>
        </div>
        
        <div className="mb-1 p-1 bg-muted rounded-lg flex flex-wrap items-end gap-1">
            <div className="flex-grow min-w-[180px]"><label htmlFor="filterText" className="block text-xs font-medium text-muted-foreground">Cerca general</label><Tooltip text="Cerca per nom d'esdeveniment, lloc, notes o nom de persona assignada"><input type="text" id="filterText" value={filterText} onChange={e => setFilterText(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Nom, lloc, persona..."/></Tooltip></div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIEventFrame" className="block text-xs font-medium text-muted-foreground">Marc</label><Tooltip text="Filtrar per un marc d'esdeveniment específic"><select id="filterUIEventFrame" value={filterUIEventFrame || ''} onChange={e => setFilterUIEventFrame(e.target.value || null)} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"><option value="">-- Tots --</option>{eventFrames.map(ef => <option key={ef.id} value={ef.id}>{ef.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterUIPerson" className="block text-xs font-medium text-muted-foreground">Persona</label><Tooltip text="Filtrar per persona o grup assignat"><select id="filterUIPerson" value={localFilterUIPerson} onChange={e => setLocalFilterUIPerson(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"><option value="">-- Totes --</option>{peopleGroups.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Tooltip></div>
            <div className="flex-grow min-w-[110px]"><label htmlFor="filterStatus" className="block text-xs font-medium text-muted-foreground">Estat</label><Tooltip text="Filtrar per estat de l'assignació"><select id="filterStatus" value={filterStatus} onChange={e => setFilterStatus(e.target.value as AssignmentStatus | '')} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"><option value="">-- Tots --</option>{Object.values(AssignmentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></Tooltip></div>
            
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterDate" className="block text-xs font-medium text-muted-foreground">Conté Data</label>
              <Tooltip text="Mostrar només esdeveniments que estiguin actius en aquesta data">
                <input type="date" id="filterDate" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm" />
              </Tooltip>
               
                {filterDate && <p className="text-xs text-primary mt-0.5"><span className="font-semibold">Filtre:</span> {formatDateDMY(filterDate)}</p>}
            </div>
            <div className="flex-grow min-w-[140px]"><label htmlFor="filterPlace" className="block text-xs font-medium text-muted-foreground">Lloc</label><Tooltip text="Filtrar per lloc de l'esdeveniment"><select id="filterPlace" value={filterPlace} onChange={e => setFilterPlace(e.target.value)} className="mt-1 block w-full px-1.5 py-0.5 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm"><option value="">-- Tots --</option>{Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean))).sort().map(place => (<option key={place} value={place!}>{place}</option>))}</select></Tooltip></div>
            <div className="flex items-center gap-1">
              <Tooltip text="Netejar tots els filtres">
                <button onClick={clearAllFilters} className="px-2 py-1 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md shadow-sm border border-border">Netejar</button>
              </Tooltip>
            </div>
        </div>

        {filteredAndSortedEventFrames.length === 0 && <p className="text-center text-muted-foreground py-4">No s'han trobat marcs d'esdeveniment.</p>}
        {filteredAndSortedEventFrames.map((ef: EventFrame) => (
          <EventFrameCard
            key={ef.id}
            eventFrame={ef}
            isArchived={showArchived}
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
         <SummaryReports
            setToastMessage={setToastMessage}
            filteredEventFrames={filteredAndSortedEventFrames}
            activeFilters={{ filterText, filterStatus, filterDate, localFilterUIPerson, filterPlace, filterUIEventFrame }}
         />
      </CollapsibleSection>
    </div>
  </CollapsibleSection>
  );
});

export default MainDisplay;