import React, { useMemo } from 'react';
import { useEventDataStore, AssignmentStatus, SummaryRow, ShowToastFunction, EventFrame, formatDateDMY, formatDateRangeDMY, getStatusSummaryText, exportSummariesToPdf, escapeCsvCell, generateFileName } from '@gep/core';
import { CsvIcon, ChevronUpIcon, ChevronDownIcon, PdfIcon } from '../constants';
import Tooltip from './ui/Tooltip';
import { saveFileWithDialog } from '../utils/fileSaver';

type ActiveFilters = {
  filterText?: string | null;
  filterStatus?: string | null;
  filterDate?: string | null;
  localFilterUIPerson?: string | null;
  filterPlace?: string | null;
  filterUIEventFrame?: string | null;
};

interface SummaryReportsProps {
  setToastMessage: ShowToastFunction;
  filteredEventFrames: EventFrame[];
  activeFilters: ActiveFilters;
}

const SummaryReports: React.FC<SummaryReportsProps> = ({ setToastMessage, filteredEventFrames, activeFilters }) => {
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);

  const allAssignmentsSummary = useMemo((): SummaryRow[] => {
    const summary: SummaryRow[] = [];
    filteredEventFrames.forEach(ef => {
      ef.assignments.forEach(a => {
        const personName = peopleMap.get(a.personGroupId);
        summary.push({
          id: `${ef.id}-${a.id}`,
          primaryGrouping: ef.name,
          secondaryGrouping: personName || 'N/A',
          eventFrameName: ef.name,
          eventFramePlace: ef.place || '',
          eventFrameStartDate: ef.startDate,
          eventFrameEndDate: ef.endDate,
          assignmentPersonName: personName || 'N/A',
          assignmentStartDate: a.startDate,
          assignmentEndDate: a.endDate,
          assignmentStatus: a.status,
          assignmentNotes: a.notes || '',
          eventFrameGeneralNotes: ef.generalNotes || '',
          isMixedStatusAssignment: a.status === AssignmentStatus.Mixed,
          assignmentObject: a,
        });
      });
    });
    return summary;
  }, [filteredEventFrames, peopleMap]);

  const [summarySortOrder, setSummarySortOrder] = React.useState<'asc' | 'desc'>('desc');

  const summaryByEventName = useMemo((): Map<string, SummaryRow[]> => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
        if (!map.has(row.eventFrameName)) {
            map.set(row.eventFrameName, []);
        }
        map.get(row.eventFrameName)!.push(row);
    });
    return new Map([...map.entries()].sort((a, b) => {
        const dateA = new Date(a[1][0].eventFrameStartDate).getTime();
        const dateB = new Date(b[1][0].eventFrameStartDate).getTime();
        return summarySortOrder === 'asc'
          ? dateA - dateB || a[0].localeCompare(b[0])
          : dateB - dateA || a[0].localeCompare(b[0]);
    }));
  }, [allAssignmentsSummary, summarySortOrder]);

  const summaryByStartDate = useMemo((): Map<string, SummaryRow[]> => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
        const dateStr = formatDateDMY(row.assignmentStartDate);
        if (!map.has(dateStr)) {
            map.set(dateStr, []);
        }
        map.get(dateStr)!.push(row);
    });
    return new Map([...map.entries()].sort((a, b) => {
      const dateA = new Date(a[0].split('/').reverse().join('-')).getTime();
      const dateB = new Date(b[0].split('/').reverse().join('-')).getTime();
      return summarySortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }));
  }, [allAssignmentsSummary, summarySortOrder]);

  const summaryByPerson = useMemo((): Map<string, SummaryRow[]> => {
    const map = new Map<string, SummaryRow[]>();
    allAssignmentsSummary.forEach(row => {
        if (!map.has(row.assignmentPersonName)) map.set(row.assignmentPersonName, []);
        map.get(row.assignmentPersonName)!.push(row);
    });
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [allAssignmentsSummary]);

  const handleExportPdf = async (title: string, data: Map<string, SummaryRow[]>, dataType: 'event-name' | 'start-date' | 'person') => {
    try {
      const { pdfDoc, fileName } = exportSummariesToPdf(title, data, dataType, activeFilters, filteredEventFrames);
      const pdfData = pdfDoc.output('arraybuffer');

      await saveFileWithDialog(
        {
          title: 'Desar PDF',
          defaultPath: fileName,
          filters: [{ name: 'Documents PDF', extensions: ['pdf'] }],
          data: pdfData,
        },
        setToastMessage
      );
    } catch (error) {
      setToastMessage(`Error generant PDF: ${(error as Error).message}`, 'error');
    }
  };

  const generateDetailedCsv = (dataType: 'event-name' | 'start-date' | 'person', groupKey: string | null = null): string => {
    let assignmentsToProcess: SummaryRow[] = allAssignmentsSummary;

    if (groupKey) {
        assignmentsToProcess = assignmentsToProcess.filter(a => {
            if (dataType === 'event-name') return a.eventFrameName === groupKey;
            if (dataType === 'start-date') return formatDateDMY(a.assignmentStartDate) === groupKey;
            if (dataType === 'person') return a.assignmentPersonName === groupKey;
            return false;
        });
    }

    const csvRows: string[][] = [];
    const headers = [
        'Agrupació Principal', 'Esdeveniment Marc', 'Dates Marc', 'Lloc Marc', 
        'Persona/Grup Assignat', 'Dates Assignació', 'Estat General', 'Detall Estats (si mixt)', 'Notes Assignació'
    ];
    csvRows.push(headers);

    assignmentsToProcess.forEach(a => {
        const statusDetail = a.isMixedStatusAssignment ? getStatusSummaryText(a.assignmentObject) : a.assignmentStatus;
        csvRows.push([
            a.primaryGrouping,
            a.eventFrameName,
            formatDateRangeDMY(a.eventFrameStartDate, a.eventFrameEndDate),
            a.eventFramePlace || '',
            a.assignmentPersonName,
            formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate),
            a.assignmentStatus,
            statusDetail,
            a.assignmentNotes || ''
        ]);
    });
    
    return csvRows.map(row => row.map(escapeCsvCell).join(',')).join('\n');
  };

  const handleExportCsv = async (dataType: 'event-name' | 'start-date' | 'person', groupKey: string | null = null) => {
    try {
        const csvContent = generateDetailedCsv(dataType, groupKey);
        const prefix = `Resum_Per_${dataType === 'event-name' ? 'Esdeveniment' : (dataType === 'start-date' ? 'Data' : 'Persona')}`;
        const { eventFrames, peopleGroups } = useEventDataStore.getState();
        const fileName = generateFileName(prefix, activeFilters, filteredEventFrames, 'csv', eventFrames, peopleGroups);

        if (!csvContent.trim() || csvContent.split('\n').length <= 1) {
            setToastMessage("No hi ha dades per exportar en aquest resum.", 'info');
            return;
        }

        await saveFileWithDialog(
          {
            title: 'Desar CSV',
            defaultPath: fileName,
            filters: [{ name: 'CSV', extensions: ['csv'] }],
            data: "\uFEFF" + csvContent,
          },
          setToastMessage
        );
    } catch (error) {
        setToastMessage(`Error generant CSV: ${(error as Error).message}`, 'error');
    }
  };
  
  const renderSummaryCard = (title: string, data: Map<string, SummaryRow[]>, dataType: 'event-name' | 'start-date' | 'person', showSortButton: boolean) => (
    <div className="bg-card p-4 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        <div className="flex items-center gap-3">
          {showSortButton && (
            <Tooltip text={`Ordena per data ${summarySortOrder === 'asc' ? 'descendent' : 'ascendent'}`}>
              <button
                onClick={() => setSummarySortOrder(summarySortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-secondary text-secondary-foreground hover:bg-accent text-xs font-medium"
              >
                {summarySortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />} Ordena
              </button>
            </Tooltip>
          )}
          <div className="flex items-center gap-2">
            <Tooltip text="Exportar a CSV">
              <button
                  onClick={() => handleExportCsv(dataType)}
                  className="p-1.5 rounded-full bg-success/10 text-success hover:bg-success/20"
                  aria-label={`Exportar tot el resum ${title} a CSV`}
              > <CsvIcon className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip text="Exportar a PDF">
              <button
                  onClick={() => handleExportPdf(title, data, dataType)}
                  className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                  aria-label={`Exportar tot el resum ${title} a PDF`}
              > <PdfIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {Array.from(data.entries()).length === 0 ? <p className="text-sm text-muted-foreground">No hi ha dades per aquest resum.</p> : null}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2"> 
        {Array.from(data.entries()).map(([groupKey, assignments]) => (
          <div key={groupKey}>
            <div className="flex justify-between items-center mb-1 sticky top-0 bg-card/80 backdrop-blur-sm py-1 z-10">
              <h4 className="font-medium text-md text-primary flex-grow">{groupKey}</h4>
              <div className="flex items-center">
                <Tooltip text={`Exportar només "${groupKey}" a CSV`}>
                  <button
                    onClick={() => handleExportCsv(dataType, groupKey)}
                    className="p-1 rounded-full hover:bg-accent flex-shrink-0 ml-2"
                  >
                    <CsvIcon className="w-4 h-4 text-success" />
                  </button>
                </Tooltip>
                <Tooltip text={`Exportar només "${groupKey}" a PDF`}>
                  <button
                    onClick={() => {
                      const singleGroupMap = new Map([[groupKey, assignments]]);
                      handleExportPdf(groupKey, singleGroupMap, dataType);
                    }}
                    className="p-1 rounded-full hover:bg-accent flex-shrink-0 ml-1"
                  >
                    <PdfIcon className="w-4 h-4 text-primary" />
                  </button>
                </Tooltip>
              </div>
            </div>
            <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
              {assignments.map(a => {
                const statusColors: { [key in AssignmentStatus]: string } = {
                  [AssignmentStatus.Yes]: 'text-success',
                  [AssignmentStatus.Pending]: 'text-warning',
                  [AssignmentStatus.No]: 'text-destructive',
                  [AssignmentStatus.Mixed]: 'text-primary',
                };
                
                const getLabel = () => {
                  if (dataType === 'person') return `${a.eventFrameName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
                  if (dataType === 'start-date') return `${a.assignmentPersonName} - ${a.eventFrameName}`;
                  return `${a.assignmentPersonName} (${formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate)})`;
                };

                return (
                <li key={a.id} className="text-muted-foreground">
                  {getLabel()}
                  {' - '}
                  
                  {a.assignmentStatus === AssignmentStatus.Mixed && a.assignmentObject.dailyStatuses ? (
                    <>
                      <span className={`font-semibold ${statusColors[AssignmentStatus.Mixed]}`}> (Mixt)</span>
                      <ul className="pl-5 mt-1 text-xs list-none">
                        {Object.entries(a.assignmentObject.dailyStatuses)
                          .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                          .map(([date, status]) => (
                          <li key={date} className={`font-semibold ${statusColors[status]}`}>
                            {formatDateDMY(date)} - {status}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span className={`font-semibold ${statusColors[a.assignmentStatus as AssignmentStatus]}`}>
                      ({a.assignmentStatus})
                    </span>
                  )}
                </li>
              )})}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
      {renderSummaryCard("Per Nom d'Esdeveniment", summaryByEventName, "event-name", true)}
      {renderSummaryCard("Per Data d'Inici d'Assignació", summaryByStartDate, "start-date", true)}
      {renderSummaryCard("Per Persona/Grup", summaryByPerson, "person", false)}
    </div>
  );
};

export default SummaryReports;
