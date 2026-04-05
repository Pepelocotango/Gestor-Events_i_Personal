import i18next from 'i18next';
import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, Assignment, NeedItem, MaterialControlRow, Performance, PerformancePdfOptions, ValidationResult } from '../types';
import { formatDateDMY, formatDateRangeDMY } from './dateFormat';
import { getStatusSummaryText } from './statusUtils';
import { themeHslColors } from './themeDefinition';
import { hslToRgb } from './colorUtils';
import { generateFileName, generateTechSheetFileName } from './fileNameUtils';
import { useEventDataStore } from '../stores/eventDataStore';

// Define ActiveFilters type locally for this module
type ActiveFilters = {
  filterText?: string | null;
  filterStatus?: string | null;
  filterDate?: string | null;
  localFilterUIPerson?: string | null;
  filterPlace?: string | null;
  filterUIEventFrame?: string | null;
};
const createPdfHeader = (pdf: jsPDF, title: string): number => {
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 14, 20);
  const dateStr = i18next.t('pdf.export_date', { date: formatDateDMY(new Date().toISOString()) });
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, pdf.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
  return 30; // Retorna la posició Y inicial per al contingut
};

// Funció genèrica per gestionar el peu de pàgina
const addFooter = (pdf: jsPDF, pageCount: number) => {
  const pageW = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${pageCount}`, pageW - 14, pdf.internal.pageSize.getHeight() - 15, { align: 'right' });
};

// Funció d'ajuda per al desat dual
async function savePdfWithDialog(
  pdf: jsPDF,
  defaultFileName: string,
  showToast: ShowToastFunction
) {
  if (window.electronAPI?.showSaveDialog) {
    const pdfData = pdf.output('arraybuffer');
    const result = await window.electronAPI.showSaveDialog({
      title: i18next.t('pdf.save_dialog_title'),
      defaultPath: defaultFileName,
      filters: [{ name: i18next.t('pdf.save_dialog_filter_name'), extensions: ['pdf'] }],
      data: pdfData as any, // Pass ArrayBuffer directly
      isDocumentSave: false, // Indica al backend que això NO és un desat de document
    });
    if (result.success) {
      showToast(i18next.t('pdf.save_success_toast'), 'success');
    } else if (!result.canceled) {
      showToast(i18next.t('pdf.save_error_toast', { message: result.message }), 'error');
    }
  } else {
    pdf.save(defaultFileName);
    showToast(i18next.t('pdf.summary_export_success'), 'success');
  }
}

// --- EXPORTACIÓ DE RESUMS ---
export const exportSummariesToPdf = async (
  title: string,
  data: Map<string, SummaryRow[]>,
  dataType: 'event-name' | 'start-date' | 'person',
  showToast: ShowToastFunction,
  activeFilters: ActiveFilters,
  filteredEventFrames: EventFrame[]
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, `${i18next.t('pdf.summary_title_prefix')}${title}`);

    if (data.size === 0) {
      pdf.setFontSize(12);
      pdf.text(i18next.t('pdf.no_data_message'), 14, y);
    } else {
      data.forEach((assignments, groupKey) => {
    // Salt de pàgina si estem massa avall
    if (y > 250) {
      pdf.addPage();
      y = createPdfHeader(pdf, `${i18next.t('pdf.summary_title_prefix')}${title}`);
    }
    
    // Título del grupo con subHeadStyles
        const subHeadStyles = { fillColor: hslToRgb(...themeHslColors.graySubtle), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold' as const };
        autoTable(pdf, {
          body: [[{ content: groupKey, styles: subHeadStyles }]],
          startY: y,
          theme: 'grid',
          margin: { left: 10, right: 10 },
          styles: { cellPadding: 2 }
        });
        y = (pdf as any).lastAutoTable.finalY + 2;

        const head = [[
          i18next.t('pdf.table_headers.event_person'),
          i18next.t('pdf.table_headers.dates'),
          i18next.t('pdf.table_headers.status'),
          i18next.t('pdf.table_headers.notes')
        ]];
        const body = assignments.map(a => {
          let label = '';
          if (dataType === 'person') {
            label = a.eventFrameName;
          } else {
            label = a.assignmentPersonName;
          }

          const statusDetail = a.isMixedStatusAssignment
            ? `Mixt (${getStatusSummaryText(a.assignmentObject)})`
            : a.assignmentStatus;

          return [
            label,
            formatDateRangeDMY(a.assignmentStartDate, a.assignmentEndDate),
            statusDetail,
            a.assignmentNotes || '-'
          ];
        });

        autoTable(pdf, {
          head,
          body,
          startY: y,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
          margin: { left: 10, right: 10, top: 5, bottom: 15 }
        });

        y = (pdf as any).lastAutoTable.finalY + 10;
      });
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const typeLabel = dataType === 'event-name'
      ? i18next.t('pdf.summary_types.event')
      : (dataType === 'start-date' ? i18next.t('pdf.summary_types.date') : i18next.t('pdf.summary_types.person'));
    const prefix = `Resum_Per_${typeLabel}`;
    const fileName = generateFileName(prefix, activeFilters, filteredEventFrames, 'pdf');
    await savePdfWithDialog(pdf, fileName, showToast);

  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};


// --- EXPORTACIó DE LLISTA DE MATERIAL ---
export const exportMaterialToPdf = async (materialItems: MaterialItem[], showToast: ShowToastFunction) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, i18next.t('pdf.material_list_title'));

    const head = [[
      i18next.t('pdf.table_headers.name'),
      i18next.t('pdf.table_headers.stock'),
      i18next.t('pdf.table_headers.location'),
      i18next.t('pdf.table_headers.notes')
    ]];

    const itemsByCategory: { [key: string]: MaterialItem[] } = {};
    materialItems.forEach(item => {
      const category = item.category || i18next.t('pdf.no_category');
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    });

    const body: any[][] = [];
    Object.keys(itemsByCategory).sort().forEach(category => {
      body.push([{ content: category, colSpan: 4, styles: { fontStyle: 'bold', fillColor: hslToRgb(...themeHslColors.graySubtle), textColor: hslToRgb(...themeHslColors.foreground) } }]);
      itemsByCategory[category].forEach(item => {
        body.push([
          item.name,
          item.stock.toString(),
          item.location || '-',
          item.notes || '-'
        ]);
      });
    });

    autoTable(pdf, {
      head,
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      didDrawPage: (_data: any) => {
        if (_data.pageNumber > 1) {
          createPdfHeader(pdf, 'Llista de Material');
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Llista_Material_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- EXPORTACIÓ DE CONTROL DE MATERIAL ---

export const exportMaterialControlSummaryPdf = async (
  data: MaterialControlRow[],
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, i18next.t('pdf.material_control_summary'));

    const head = [[
      i18next.t('pdf.table_headers.name'),
      i18next.t('pdf.table_headers.origin'),
      i18next.t('pdf.table_headers.stock'),
      i18next.t('pdf.table_headers.balance'),
      i18next.t('pdf.table_headers.demand')
    ]];
    const body: any[][] = [];
    let lastCategory = '';
    let lastOrigin = '';

    data.forEach(row => {
      if (row.item.category !== lastCategory) {
        lastCategory = row.item.category;
        lastOrigin = '';
        body.push([{
          content: lastCategory,
          colSpan: 5,
          styles: { fontStyle: 'bold', fillColor: hslToRgb(...themeHslColors.graySubtle), textColor: hslToRgb(...themeHslColors.foreground), fontSize: 11, halign: 'left' }
        }]);
      }

      if (row.item.location !== lastOrigin) {
        lastOrigin = row.item.location;
        body.push([{
          content: `${i18next.t('pdf.origin_prefix')}${lastOrigin}`,
          colSpan: 5,
          styles: { fontStyle: 'italic', fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foregroundMuted), fontSize: 10, halign: 'left' }
        }]);
      }

      body.push([
        row.item.name,
        row.item.location,
        row.item.stock.toString(),
        { content: row.balance.toString(), styles: { fontStyle: 'bold', textColor: row.balance < 0 ? hslToRgb(...themeHslColors.destructive) : hslToRgb(...themeHslColors.success) } },
        row.totalDemand.toString()
      ]);

      if (row.item.notes) {
        body.push([{
          content: `${i18next.t('pdf.note_prefix')}${row.item.notes}`,
          colSpan: 5,
          styles: {
            fillColor: hslToRgb(...themeHslColors.grayLightest),
            textColor: hslToRgb(...themeHslColors.foregroundMuted),
            fontStyle: 'italic',
            fontSize: 8
          }
        }]);
      }
    });

    autoTable(pdf, {
      head,
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          createPdfHeader(pdf, 'Resum de Control de Material');
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Resum_Control_Material_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

export const exportMaterialControlDetailedPdf = async (
  data: MaterialControlRow[],
  eventFrames: EventFrame[],
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, i18next.t('pdf.material_control_detailed'));

    const eventMap = new Map(eventFrames.map(ef => [ef.id, ef]));

    const materialByEvent: Map<string, { eventName: string, items: any[] }> = new Map();
    data.forEach(row => {
      row.breakdown.forEach(bd => {
        if (!materialByEvent.has(bd.eventFrameId)) {
          materialByEvent.set(bd.eventFrameId, { eventName: bd.eventName, items: [] });
        }
        materialByEvent.get(bd.eventFrameId)!.items.push({
          name: row.item.name,
          quantity: bd.quantity,
          category: row.item.category,
          location: row.item.location
        });
      });
    });

    const sortedEventIds = Array.from(materialByEvent.keys()).sort((a, b) => {
      const eventA = eventMap.get(a);
      const eventB = eventMap.get(b);
      if (!eventA || !eventB) return 0;
      return new Date(eventA.startDate).getTime() - new Date(eventB.startDate).getTime();
    });


    for (const eventId of sortedEventIds) {
      const eventData = materialByEvent.get(eventId)!;
      const eventDetails = eventMap.get(eventId);

      if (y > 250) {
        pdf.addPage();
        y = createPdfHeader(pdf, i18next.t('pdf.material_control_detailed'));
      }

      // Título del evento con subHeadStyles
      const subHeadStyles = { fillColor: hslToRgb(...themeHslColors.graySubtle), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold' as const };
      const eventTitle = `${eventData.eventName} (${formatDateRangeDMY(eventDetails?.startDate, eventDetails?.endDate)})`;
      autoTable(pdf, {
        body: [[{ content: eventTitle, styles: subHeadStyles }]],
        startY: y,
        theme: 'grid',
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 2;

      const head = [[
        i18next.t('pdf.table_headers.quantity'),
        i18next.t('pdf.table_headers.name'),
        i18next.t('pdf.table_headers.category'),
        i18next.t('pdf.table_headers.origin')
      ]];
      const body = eventData.items
        .map(item => [item.quantity.toString(), item.name, item.category, item.location]);

      autoTable(pdf, {
        head,
        body,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      });

      y = (pdf as any).lastAutoTable.finalY + 10;
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Detall_Control_Material_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};


// --- EXPORTACIÓ DE LLIBRETA D'ADRECES ---
export const exportPeopleToPdf = async (peopleGroups: PersonGroup[], showToast: ShowToastFunction) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, i18next.t('pdf.address_book_title'));

    const head = [[
      i18next.t('pdf.table_headers.name'),
      i18next.t('pdf.table_headers.rol'),
      i18next.t('pdf.table_headers.contact'),
      i18next.t('pdf.table_headers.notes')
    ]];
    const body = peopleGroups.map(p => {
      const contactInfo = [
        p.tel1,
        p.tel2,
        p.email,
        p.web,
      ].filter(Boolean).join('\n');
      return [p.name, p.role || '-', contactInfo || '-', p.notes || '-'];
    });

    autoTable(pdf, {
      head,
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      columnStyles: {
        2: { cellWidth: 60 },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: (_data: any) => {
        if (_data.pageNumber > 1) {
          createPdfHeader(pdf, "Llibreta d'Adreces");
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Llibreta_Adreces_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- FITXA TÈCNICA ---
export const generateTechSheetPdfObject = (
  formData: TechSheetData,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 10;

  // Define vertical spacing between sections
  const VERTICAL_SPACING = 3;

  const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
  const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
  const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };
  const subHeadStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.graySubtle), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold' };

  const checkPageBreak = (currentY: number): number => {
    if (currentY > 290) {
      pdf.addPage();
      return 10;
    }
    return currentY;
  };

  // --- Header ---
  const headerBody = [
    [{ content: i18next.t('pdf.tech_sheet.main_title'), colSpan: 2, styles: { halign: 'center' as 'center', fontSize: 16, fontStyle: 'bold' as 'bold' } }],
    [{ content: i18next.t('pdf.tech_sheet.event_name'), styles: labelStyles }, sane(formData.eventName)],
    [{ content: i18next.t('pdf.tech_sheet.location'), styles: labelStyles }, sane(formData.location)],
    [{ content: i18next.t('pdf.tech_sheet.date'), styles: labelStyles }, sane(formData.date)],
    [{ content: i18next.t('pdf.tech_sheet.hour'), styles: labelStyles }, formData.showTimes && formData.showTimes.length > 0 ? formData.showTimes.map(st => st.time).join(', ') : '-'],
    [{ content: i18next.t('pdf.tech_sheet.duration'), styles: labelStyles }, sane(formData.showDuration)],
  ];
  autoTable(pdf, {
    body: headerBody,
    theme: 'grid',
    startY: y,
    pageBreak: 'avoid',
    margin: { left: 10, right: 10 },
    styles: { cellPadding: 2 }
  });
  y = (pdf as any).lastAutoTable.finalY + VERTICAL_SPACING;

  if (formData.showGeneralNotesInPdf && sane(formData.generalNotes) !== '-') {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.general_notes'), styles: headStyles }]],
      body: [[sane(formData.generalNotes)]],
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  if (formData.parking?.status === 'yes' || formData.parking?.status === 'no') {
    y = checkPageBreak(y);
    const parkingDetails = formData.parking.status === 'yes'
      ? (sane(formData.parking.details) !== '-' ? sane(formData.parking.details) : i18next.t('pdf.yes'))
      : i18next.t('pdf.no');
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.parking'), styles: headStyles }]],
      body: [[parkingDetails]],
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + VERTICAL_SPACING;
  }

  const personnelBody: any[][] = [];
  let hasAnyNotes = false;

  if (formData.technicalProviders && formData.technicalProviders.length > 0) {
    formData.technicalProviders.forEach(provider => {
      const person = getPersonGroupById(provider.personGroupId);
      if (provider.roles && provider.roles.length > 0) {
        provider.roles.forEach(role => {
          if (sane(role.role) !== '-' || sane(role.quantity) !== '-') {
            const row = [sane(role.quantity), sane(role.role), sane(person?.name)];
            if (role.printNotes && sane(role.notes) !== '-') {
              hasAnyNotes = true;
              row.push(sane(role.notes));
            }
            personnelBody.push(row);
          }
        });
      }
    });
  }
  if (personnelBody.length > 0) {
    y = checkPageBreak(y);
    const tableBody: any[][] = [];
    const totalColumns = hasAnyNotes ? 4 : 3;

    if (formData.showTechnicalPersonnelNotesInPdf && sane(formData.technicalPersonnelNotes) !== '-') {
      tableBody.push([{ content: sane(formData.technicalPersonnelNotes), colSpan: totalColumns, styles: { fontStyle: 'italic' as 'italic', halign: 'left' as 'left' } }]);
    }
    personnelBody.forEach(row => tableBody.push(row));

    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.technical_personnel'), colSpan: totalColumns, styles: headStyles }]],
      body: tableBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      headStyles: { ...headStyles, halign: 'center' as 'center' },
      columnStyles: hasAnyNotes
        ? { 0: { cellWidth: 15, halign: 'right' as 'right' }, 3: { cellWidth: 'auto' } }
        : { 0: { cellWidth: 15, halign: 'right' as 'right' } }
    });
    y = (pdf as any).lastAutoTable.finalY + VERTICAL_SPACING;
  }

  if (formData.preAssembly?.status === 'yes') {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.pre_assembly'), styles: headStyles }]],
      body: [[sane(formData.preAssembly.details)]],
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  if (formData.schedule?.status === 'yes' && formData.schedule.data && formData.schedule.data.length > 0) {
    y = checkPageBreak(y);

    const groupedSchedule = formData.schedule.data.reduce((acc, item) => {
      const date = item.date || i18next.t('pdf.tech_sheet.no_date');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const scheduleBody: any[][] = [];
    const dateSubHeadStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold' };

    if (formData.showScheduleNotesInPdf && sane(formData.schedule.details) !== '-') {
      scheduleBody.push([{ content: sane(formData.schedule.details), colSpan: 2, styles: { fontStyle: 'italic' as 'italic' } }]);
    }

    Object.entries(groupedSchedule).forEach(([date, items]) => {
      scheduleBody.push([{ content: `${i18next.t('pdf.tech_sheet.date_prefix')}${formatDateDMY(date)}`, colSpan: 2, styles: dateSubHeadStyles }]);
      items.forEach(item => {
        const timeRange = [sane(item.time), sane(item.timeEnd)].filter(t => t !== '-').join(' - ');
        scheduleBody.push([timeRange, sane(item.description)]);
      });
    });

    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.schedules'), colSpan: 2, styles: headStyles }]],
      body: scheduleBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 40 } },
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  const logisticsBody: any[][] = [];
  if (formData.dressingRooms?.status === 'yes') {
    const dressingDetails = sane(formData.dressingRooms.details);
    const value = dressingDetails !== '-' ? dressingDetails : 'SI';
    logisticsBody.push([i18next.t('pdf.tech_sheet.dressing_rooms'), value, '']);
  }
  if (formData.actorsInfo?.status === 'yes') {
    const actorsNumber = sane(formData.actorsInfo.data?.number);
    const actorsNames = sane(formData.actorsInfo.data?.names);
    if (actorsNumber !== '-' || actorsNames !== '-') {
      logisticsBody.push([i18next.t('pdf.tech_sheet.actors'), actorsNumber, actorsNames]);
    }
  }
  if (formData.techniciansInfo?.status === 'yes') {
    const techNumber = sane(formData.techniciansInfo.data?.number);
    const techNames = sane(formData.techniciansInfo.data?.names);
    if (techNumber !== '-' || techNames !== '-') {
      logisticsBody.push([i18next.t('pdf.tech_sheet.tech_cia'), techNumber, techNames]);
    }
  }

  if (logisticsBody.length > 0) {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.logistics'), colSpan: 3, styles: headStyles }]],
      body: logisticsBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
    });
    y = (pdf as any).lastAutoTable.finalY + VERTICAL_SPACING;
  }

  const needsBody: any[][] = [];
  if (formData.showTechnicalNeedsNotesInPdf && sane(formData.technicalNeedsNotes) !== '-') {
    needsBody.push([{ content: sane(formData.technicalNeedsNotes), colSpan: 3, styles: { fontStyle: 'italic' as 'italic' } }]);
  }
  const addNeedsToBody = (title: string, section: TechSheetData[keyof TechSheetData]) => {
    const needsSection = section as { status: 'yes' | 'no' | 'unset', details?: string, data?: { needs: NeedItem[] } };
    if (!needsSection || needsSection.status !== 'yes') return;

    const hasDetails = sane(needsSection.details) !== '-';
    const validNeeds = (needsSection.data?.needs || []).filter((n: NeedItem) => sane(n.description) !== '-' || sane(n.quantity) !== '-');

    if (hasDetails || validNeeds.length > 0) {
      needsBody.push([{ content: title, colSpan: 3, styles: subHeadStyles }]);
      if (hasDetails) needsBody.push([{ content: needsSection.details!, colSpan: 3, styles: { fontStyle: 'italic' as 'italic' } }]);
      validNeeds.forEach((n: NeedItem) => {
        needsBody.push([{ content: sane(n.quantity), styles: { halign: 'right' as 'right' } }, sane(n.description), sane(n.origin)]);
      });
    }
  };

  addNeedsToBody(i18next.t('pdf.tech_sheet.lighting'), formData.lighting);
  addNeedsToBody(i18next.t('pdf.tech_sheet.sound'), formData.sound);
  addNeedsToBody(i18next.t('pdf.tech_sheet.video'), formData.video);
  addNeedsToBody(i18next.t('pdf.tech_sheet.machinery'), formData.machinery);
  addNeedsToBody(i18next.t('pdf.tech_sheet.rentals'), formData.rentals);
  addNeedsToBody(i18next.t('pdf.tech_sheet.other_equipment'), formData.otherEquipment);
  addNeedsToBody(i18next.t('pdf.tech_sheet.electrical'), formData.electrical);
  addNeedsToBody(i18next.t('pdf.tech_sheet.structures'), formData.structures);
  addNeedsToBody(i18next.t('pdf.tech_sheet.platforms'), formData.platforms);
  addNeedsToBody(i18next.t('pdf.tech_sheet.consumables'), formData.consumables);
  addNeedsToBody(i18next.t('pdf.tech_sheet.curtains'), formData.curtains);
  addNeedsToBody(i18next.t('pdf.tech_sheet.transport'), formData.transport);

  if (needsBody.length > 0) {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.technical_needs'), colSpan: 3, styles: headStyles }]],
      body: needsBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  const otherDetailsBody = [];
  if (sane(formData.controlLocation) !== '-') otherDetailsBody.push([{ content: i18next.t('pdf.tech_sheet.control_at'), styles: labelStyles }, sane(formData.controlLocation)]);
  if (sane(formData.blueprints) !== '-') otherDetailsBody.push([{ content: i18next.t('pdf.tech_sheet.blueprints'), styles: labelStyles }, sane(formData.blueprints)]);
  if (otherDetailsBody.length > 0) {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.other_details'), colSpan: 2, styles: headStyles }]],
      body: otherDetailsBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + VERTICAL_SPACING;
  }

  const contactBody: any[][] = [];
  if (formData.contacts && formData.contacts.length > 0) {
    formData.contacts.forEach(contact => {
      if (Object.values(contact).some(val => sane(val) !== '-')) {
        const contactInfo = `Email: ${sane(contact.email)}\nTel: ${sane(contact.phone)}`;
        contactBody.push([sane(contact.name), sane(contact.role), contactInfo]);
      }
    });
  }
  if (contactBody.length > 0) {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.company_contacts'), colSpan: 3, styles: headStyles }]],
      body: contactBody,
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 'auto' } },
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  if (sane(formData.observations) !== '-') {
    y = checkPageBreak(y);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.tech_sheet.observations'), styles: headStyles }]],
      body: [[sane(formData.observations)]],
      startY: y,
      theme: 'grid',
      pageBreak: 'avoid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
  }

  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i);
  }

  return pdf;
};

export const exportTechSheetToPdf = async (
  formData: TechSheetData,
  eventName: string,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = generateTechSheetPdfObject(formData, getPersonGroupById);
    const fileName = generateTechSheetFileName(eventName, formData.date || '');
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- EXPORTACIÓ DE LLISTA D'ESDEVENIMENTS ---
export const exportEventListToPdf = async (
  eventFrames: EventFrame[],
  peopleGroups: PersonGroup[],
  showToast: ShowToastFunction,
  activeFilters: ActiveFilters
) => {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' per a format apaïsat (landscape)
    let y = createPdfHeader(pdf, i18next.t('pdf.event_list_title'));

    const head = [[
      i18next.t('pdf.table_headers.event_name'),
      i18next.t('pdf.table_headers.location'),
      i18next.t('pdf.table_headers.dates'),
      i18next.t('pdf.table_headers.personnel_notes'),
      i18next.t('pdf.table_headers.status'),
      i18next.t('pdf.table_headers.general_notes')
    ]];
    const body = eventFrames.map(ef => {
      const personnelText = ef.assignments.length > 0
        ? ef.assignments.map((a: Assignment) => {
          const person = peopleGroups.find(p => p.id === a.personGroupId);
          const personLine = `${person ? person.name : 'N/A'} ${getStatusSummaryText(a)}`;
          const notesLine = a.notes ? `  └ Nota: ${a.notes}` : '';
          return [personLine, notesLine].filter(Boolean).join('\n');
        }).join('\n\n')
        : i18next.t('pdf.no_assignments');

      const statusText = ef.personnelComplete ? i18next.t('pdf.complete_status') : i18next.t('pdf.incomplete_status');

      return [
        ef.name,
        ef.place || '-',
        formatDateRangeDMY(ef.startDate, ef.endDate),
        personnelText,
        statusText,
        ef.generalNotes || '-'
      ];
    });

    autoTable(pdf, {
      head,
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      columnStyles: {
        3: { cellWidth: 85 },
        5: { cellWidth: 60 }
      },
      didDrawPage: (_data: any) => {
        if (_data.pageNumber > 1) {
          createPdfHeader(pdf, i18next.t('pdf.event_list_title'));
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = generateFileName('Llista_Esdeveniments', activeFilters, eventFrames, 'pdf');
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`${i18next.t('common.error')}: ${(error as Error).message}`, 'error');
  }
};

// --- EXPORTACIÓ D'ACTUACIONS ---

export const generateEventPerformancesPdfObject = (
  eventFrame: EventFrame,
  performances: Performance[]
): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
  const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
  // Afegim labelStyles que faltava aquí
  const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };

  let y = 10; // ELIMINEM createPdfHeader I COMENCEM A 10

  // --- Info de l'Esdeveniment (Estil Fitxa de Bolo) ---
  const eventInfo =[[{ content: `${i18next.t('pdf.event_runsheet_title')} - ${eventFrame.name}`, colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],[{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],[{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)],
  ];
  autoTable(pdf, {
    body: eventInfo,
    theme: 'grid',
    startY: y,
    margin: { left: 10, right: 10 },
    styles: { cellPadding: 2 }
  });
  y = (pdf as any).lastAutoTable.finalY + 10;

  // --- Escaleta Artística ---
  if (performances.length === 0) {
    pdf.setFontSize(12);
    pdf.text(i18next.t('pdf.no_performances'), 14, y);
  } else {
    const sortedPerformances = performances
      .filter(p => p.showTime)
      .sort((a, b) => {
        const timeA = a.showTime || '23:59';
        const timeB = b.showTime || '23:59';
        return timeA.localeCompare(timeB);
      });

    const runsheetHead = [
      i18next.t('pdf.time'),
      i18next.t('pdf.artist'),
      i18next.t('pdf.type'),
      i18next.t('pdf.status'),
      i18next.t('pdf.duration'),
      i18next.t('pdf.notes')
    ];

    const runsheetBody = sortedPerformances.map(performance => [
      sane(performance.showTime),
      sane(performance.name),
      sane(performance.type),
      sane(performance.status),
      sane(performance.duration),
      sane(performance.notes)
    ]);

    autoTable(pdf, {
      head: [
        [{ content: i18next.t('pdf.artistic_runsheet'), colSpan: 6, styles: headStyles }],
        runsheetHead
      ],
      body: runsheetBody,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      margin: { left: 10, right: 10 }
    });
  }

  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i);
  }

  return pdf;
};

export const exportEventPerformancesSummaryPdf = async (
  eventFrame: EventFrame,
  performances: Performance[],
  showToast: ShowToastFunction
) => {
  try {
    const pdf = generateEventPerformancesPdfObject(eventFrame, performances);
    const fileName = `Escaleta_${eventFrame.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- FULL DE RUTA DEL REGIDOR ---

export const exportRegidoriaSummaryPdf = async (
  eventFrame: EventFrame,
  performances: Performance[],
  techSheetData: TechSheetData | undefined,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
    const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };

    let y = 10; // ELIMINEM createPdfHeader

    // --- Capçalera de l'Esdeveniment (Estil Fitxa de Bolo) ---
    const headerBody = [[{ content: `${i18next.t('pdf.regidoria_summary_title')} - ${eventFrame.name}`, colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],[{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],[{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)],
    ];
    autoTable(pdf, {
      body: headerBody,
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 10;

    // --- Escaleta Combinada (Horaris d'Actuacions + Generals) ---
    const allScheduleItems: any[] = [];

    // Afegir horaris generals de la Fitxa de Bolo
    if (techSheetData?.schedule?.status === 'yes' && techSheetData.schedule.data) {
      techSheetData.schedule.data.forEach(item => {
        allScheduleItems.push({
          time: sane(item.time),
          endTime: sane(item.timeEnd),
          description: sane(item.description),
          type: i18next.t('pdf.general_schedule'),
          notes: '',
          priority: 1
        });
      });
    }

    // Afegir horaris de les actuacions
    performances.forEach(performance => {
      if (performance.arrivalTime) {
        allScheduleItems.push({
          time: performance.arrivalTime,
          endTime: performance.soundCheckTime || '',
          description: `[ARRIBADA] ${sane(performance.name)}`,
          type: i18next.t('pdf.arrival'),
          notes: extractRegidoriaNotes(performance),
          priority: 2
        });
      }
      
      if (performance.soundCheckTime) {
        allScheduleItems.push({
          time: performance.soundCheckTime,
          endTime: performance.showTime || '',
          description: `[PROVES] ${sane(performance.name)}`,
          type: i18next.t('pdf.soundcheck'),
          notes: extractRegidoriaNotes(performance),
          priority: 2
        });
      }
      
      if (performance.showTime) {
        allScheduleItems.push({
          time: performance.showTime,
          endTime: performance.departureTime || '',
          description: `[SHOW] ${sane(performance.name)}`,
          type: i18next.t('pdf.show'),
          notes: extractRegidoriaNotes(performance),
          priority: 2
        });
      }
    });

    // Ordenar per hora i prioritat
    allScheduleItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });

    if (allScheduleItems.length > 0) {
      const combinedScheduleHead = [
        i18next.t('pdf.time'),
        i18next.t('pdf.description'),
        i18next.t('pdf.type'),
        i18next.t('pdf.regidoria_notes')
      ];

      const combinedScheduleBody = allScheduleItems.map(item => [
        item.endTime && item.endTime !== item.time 
          ? `${item.time} - ${item.endTime}`
          : item.time,
        item.description,
        item.type,
        item.notes
      ]);

      autoTable(pdf, {
        head: [
          [{ content: i18next.t('pdf.combined_schedule'), colSpan: 4, styles: headStyles }],
          combinedScheduleHead
        ],
        body: combinedScheduleBody,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 35 },
          3: { cellWidth: 'auto' }
        },
        margin: { left: 10, right: 10 }
      });
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Full_Ruta_Regidoria_${eventFrame.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);

  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// Funció d'ajuda per extreure notes crítiques de regidoria
const extractRegidoriaNotes = (performance: Performance): string => {
  const notes: string[] = [];
  
  // Notes d'escenari crítiques
  if (performance.techData?.stageRequirements) {
    notes.push(`Escenari: ${performance.techData.stageRequirements.substring(0, 50)}${performance.techData.stageRequirements.length > 50 ? '...' : ''}`);
  }
  
  // Notes d'hospitalitat crítiques
  if (performance.hospitalityData?.dietaryRequirements) {
    notes.push(`Dietes: ${performance.hospitalityData.dietaryRequirements.substring(0, 50)}${performance.hospitalityData.dietaryRequirements.length > 50 ? '...' : ''}`);
  }
  
  if (performance.hospitalityData?.travelLogistics) {
    notes.push(`Viatge: ${performance.hospitalityData.travelLogistics.substring(0, 50)}${performance.hospitalityData.travelLogistics.length > 50 ? '...' : ''}`);
  }
  
  // Notes generals
  if (performance.notes) {
    notes.push(`General: ${performance.notes.substring(0, 50)}${performance.notes.length > 50 ? '...' : ''}`);
  }
  
  return notes.join(' | ');
};

// --- VALIDACIÓ DE DADES D'ACTUACIONS ---

export const validatePerformanceData = (performance: Performance): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validar camps obligatoris
  if (!performance.name?.trim()) {
    errors.push(i18next.t('performances.pdf_validation_error', { message: "El nom de l'actuació és obligatori" }));
  }
  
  // Validar formats
  if (performance.contactEmail && performance.contactEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(performance.contactEmail)) {
      warnings.push(i18next.t('performances.pdf_validation_warning', { message: "Format d'email invàlid" }));
    }
  }
  
  // Validar telèfon
  if (performance.contactPhone && performance.contactPhone.trim()) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(performance.contactPhone)) {
      warnings.push(i18next.t('performances.pdf_validation_warning', { message: "Format de telèfon invàlid" }));
    }
  }
  
  // Validar horaris
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const timeFields = [
    { field: 'arrivalTime', label: "hora d'arribada" },
    { field: 'soundCheckTime', label: "hora de soundcheck" },
    { field: 'showTime', label: "hora d'actuació" },
    { field: 'departureTime', label: "hora de sortida" }
  ];
  
  timeFields.forEach(({ field, label }) => {
    const value = performance[field as keyof Performance];
    if (value && !timeRegex.test(value as string)) {
      warnings.push(i18next.t('performances.pdf_validation_warning', { message: `Format de ${label} invàlid (HH:MM)` }));
    }
  });
  
  return { errors, warnings, isValid: errors.length === 0 };
};

// --- ANÀLISI I ADAPTACIÓ AUTOMÀTICA DE COLUMNES ---

// Funció per calcular l'ample òptim de cada columna segons el contingut i orientació
const calculateOptimalColumnWidths = (
  items: any[], 
  columnConfig: any, 
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const columnWidths: any = {};
  
  // Dimensions segons orientació (en mm)
  const pageDimensions = orientation === 'landscape' 
    ? { width: 297, height: 210, usableWidth: 277 }  // A4 horitzontal
    : { width: 210, height: 297, usableWidth: 190 }; // A4 vertical
  
  // Convertir a units de jspdf-autotable (jspdf-autotable treballa en mm, igual que jsPDF)
  const totalWidthUnits = pageDimensions.usableWidth;
  
  // Identificar les columnes actives per índex
  const activeColumns: number[] = [];
  const columnKeyToIndex: Record<string, number> = {
    'patch': 0,
    'channel': 1, 
    'label': 2,
    'rider': 3,
    'contra': 4,
    'stand': 5,
    'notes': 6,
    'exclusive': 7,
    'outputChannel': 1  // Per monitors
  };
  
  Object.keys(columnConfig).forEach((key) => {
    if (columnConfig[key] && columnKeyToIndex[key] !== undefined) {
      activeColumns.push(columnKeyToIndex[key]);
    }
  });
  
  // Si no hi ha columnes actives, retornar buit
  if (activeColumns.length === 0) {
    return columnWidths;
  }
  
  // Calcular l'ample mínim necessari per cada columna activa
  const minWidths: number[] = [];
  const maxWidths: number[] = [];
  
  activeColumns.forEach((columnIndex) => {
    let maxContentLength = 0;
    
    // Analitzar el contingut de tots els ítems
    items.forEach(item => {
      let content = '';
      
      // Obtenir el contingut segons la columna (adaptat per inputs i monitors)
      if (columnIndex === 0) content = item.patchNumber || '';
      else if (columnIndex === 1) content = item.channel || item.outputChannel || '';
      else if (columnIndex === 2) content = item.label || '';
      else if (columnIndex === 3) content = item.micRider || item.mixRider || '';
      else if (columnIndex === 4) content = item.micContra || item.mixContra || '';
      else if (columnIndex === 5) content = item.stand || item.mixStand || '';
      else if (columnIndex === 6) content = item.notes || '';
      else if (columnIndex === 7) content = item.exclusive ? '✓' : '';
      
      const contentLength = content.length;
      maxContentLength = Math.max(maxContentLength, contentLength);
    });
    
    // Calcular ample mínim i màxim per cada columna (en mm)
    // Adaptat segons orientació i espai disponible
    let minWidth = 12;
    let maxWidth = 80;
    
    if (columnIndex === 0) {
      // Patch: sempre petit (només per colors)
      minWidth = 18;
      maxWidth = 18;
    } else if (columnIndex === 1) {
      // Channel: adaptar segons si hi ha números llargs
      minWidth = 22;
      maxWidth = 25;
    } else if (columnIndex === 2) {
      // Label: flexible segons contingut
      if (maxContentLength > 25) {
        minWidth = orientation === 'landscape' ? 40 : 30;
        maxWidth = orientation === 'landscape' ? 70 : 55;
      } else if (maxContentLength > 15) {
        minWidth = orientation === 'landscape' ? 35 : 25;
        maxWidth = orientation === 'landscape' ? 60 : 45;
      } else if (maxContentLength > 8) {
        minWidth = 25;
        maxWidth = 35;
      } else {
        minWidth = 20;
        maxWidth = 30;
      }
    } else if (columnIndex === 3 || columnIndex === 4) {
      // Mic Rider/Contra: adaptable
      if (maxContentLength > 20) {
        minWidth = orientation === 'landscape' ? 40 : 30;
        maxWidth = orientation === 'landscape' ? 60 : 45;
      } else if (maxContentLength > 12) {
        minWidth = 30;
        maxWidth = 40;
      } else {
        minWidth = 25;
        maxWidth = 35;
      }
    } else if (columnIndex === 5) {
      // Stand: similar a mic
      minWidth = 30;
      maxWidth = 35;
    } else if (columnIndex === 6) {
      // Notes: molt flexible, pot ocupar molt espai
      if (maxContentLength > 40) {
        minWidth = orientation === 'landscape' ? 50 : 40;
        maxWidth = orientation === 'landscape' ? 80 : 60;
      } else if (maxContentLength > 20) {
        minWidth = orientation === 'landscape' ? 40 : 30;
        maxWidth = orientation === 'landscape' ? 60 : 45;
      } else if (maxContentLength > 10) {
        minWidth = 30;
        maxWidth = 40;
      } else {
        minWidth = 20;
        maxWidth = 30;
      }
    } else if (columnIndex === 7) {
      // Exclusive: sempre petit (només ✓)
      minWidth = 13;
      maxWidth = 13;
    }
    
    minWidths.push(minWidth);
    maxWidths.push(maxWidth);
  });
  
  // Calcular l'ample total mínim necessari
  const totalMinWidth = minWidths.reduce((sum, width) => sum + width, 0);
  
  // Si hi ha espai extra, distribuir-lo proporcionalment
  if (totalMinWidth < totalWidthUnits && activeColumns.length > 0) {
    const extraSpace = totalWidthUnits - totalMinWidth;
    const flexibilityScores = maxWidths.map((max, i) => max - minWidths[i]);
    const totalFlexibility = flexibilityScores.reduce((sum, score) => sum + score, 0);
    
    // Distribuir l'espai extra segons la flexibilitat de cada columna
    let finalWidths = minWidths.map((minWidth, i) => {
      if (totalFlexibility > 0) {
        const extraRatio = flexibilityScores[i] / totalFlexibility;
        const extraWidth = extraSpace * extraRatio;
        return Math.min(maxWidths[i], minWidth + extraWidth);
      }
      return minWidth;
    });
    
    // VERIFICACIÓ CRÍTICA: Si encara no hi ha prou espai, ajustar per forçar que tot cabgui
    const totalCalculated = finalWidths.reduce((sum, w) => sum + w, 0);
    if (totalCalculated > totalWidthUnits) {
      // Reduir totes les columnes proporcionalment
      const reductionFactor = totalWidthUnits / totalCalculated;
      finalWidths = finalWidths.map(width => Math.max(10, width * reductionFactor));
    }
    
    // Aplicar els amples calculats als índexs de columna correctes
    activeColumns.forEach((columnIndex, i) => {
      columnWidths[columnIndex] = { cellWidth: Math.round(finalWidths[i]) };
    });
  } else {
    // Si no hi ha espai suficient, usar els amples mínims
    activeColumns.forEach((columnIndex, i) => {
      columnWidths[columnIndex] = { cellWidth: minWidths[i] };
    });
  }
  
  return columnWidths;
};

// --- ESTILS ENRIQUITS PER A ACTUACIONS ---

const getPerformanceStyles = () => {
  const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
  
  const headStyles: Partial<Styles> = { 
    fillColor: hslToRgb(...themeHslColors.grayDark), 
    textColor: hslToRgb(...themeHslColors.foregroundWhite), 
    fontStyle: 'bold' 
  };
  
  const labelStyles: Partial<Styles> = { 
    fillColor: hslToRgb(...themeHslColors.grayMuted), 
    textColor: hslToRgb(...themeHslColors.foreground), 
    fontStyle: 'bold', 
    cellWidth: 50 
  };
  
  const emptySectionStyles: Partial<Styles> = { 
    fontStyle: 'italic', 
    textColor: hslToRgb(...themeHslColors.grayMuted) 
  };
  
  return { sane, headStyles, labelStyles, emptySectionStyles };
};

// --- FUNCIONS DE DENSITAT PER TAULES ---

const getTableDensityStyles = (orientation: 'portrait' | 'landscape') => {
  if (orientation === 'landscape') {
    return {
      fontSize: 9,
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      overflow: 'linebreak' as const,
      minCellHeight: 8,
      valign: 'middle' as const
    };
  }
  // Portrait: màxima densitat (≥32 files/pàgina)
  return {
    fontSize: 8,
    cellPadding: { top: 1, bottom: 1, left: 2, right: 2 },
    overflow: 'linebreak' as const,
    minCellHeight: 7,
    valign: 'middle' as const
  };
};

// --- CONTROL DE SALTS DE PÀGINA ---

const checkPageBreak = (pdf: jsPDF, currentY: number, requiredHeight: number = 20): number => {
  if (currentY > 280 - requiredHeight) {
    pdf.addPage();
    return 10;
  }
  return currentY;
};

// --- EXPORTACIÓ D'ACTUACIONS (WRAPPER PER COMPATIBILITAT) ---

export const exportPerformanceToPdf = async (
  performance: Performance,
  eventFrame: EventFrame,
  showToast: ShowToastFunction
) => {
  // Wrapper per mantenir compatibilitat amb la funció existent
  // Utilitza les opcions per defecte per generar un rider complet
  const defaultOptions: PerformancePdfOptions = {
    includeBasicInfo: true,
    includeInputs: true,
    includeMonitors: true,
    includeCable: true,
    includeSpare: true,
    includeTechnicalNotes: true,
    includeHospitality: true,
    includeGeneralNotes: true,
    showEmptySections: false,
  };
  
  return exportPerformanceToPdfWithOptions(performance, eventFrame, defaultOptions, showToast);
};

// --- EXPORTACIÓ D'ACTUACIONS AMB OPCIONS ---

// --- NOVA FUNCIÓ GENERADORA D'OBJECTES PDF PER A ACTUACIONS ---
export const generatePerformancePdfObjectWithOptions = (
  performance: Performance,
  eventFrame: EventFrame,
  options: PerformancePdfOptions,
  allPerformances?: Performance[],
  materialItems?: MaterialItem[]
): jsPDF => {
  const orientation = options.pdfOrientation || 'portrait';
  const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
  const { sane, headStyles, labelStyles, emptySectionStyles } = getPerformanceStyles();
  
  let y = 10; // ELIMINEM createPdfHeader
  const mainTitle = `${i18next.t('pdf.performance_rider_title')} - ${performance.name}`;

  // --- Capçalera de l'Esdeveniment (Estil Fitxa de Bolo) ---
  if (options.includeBasicInfo) {
    const headerBody = [
      [{ content: mainTitle, colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],
      [{ content: i18next.t('pdf.event_name'), styles: labelStyles }, sane(eventFrame.name)],
      [{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],
      [{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)]
    ];
    autoTable(pdf, {
      body: headerBody,
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  } else {
    // Si l'usuari decideix no incloure la info bàsica, almenys hem de posar el títol del Rider
    autoTable(pdf, {
      body: [[{ content: mainTitle, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }]],
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Info de l'Artista ---
  if (options.includeBasicInfo) {
    y = checkPageBreak(pdf, y, 40);
    const artistBody = [
      [{ content: i18next.t('pdf.artist_info'), colSpan: 2, styles: headStyles }],
      [{ content: i18next.t('pdf.artist_name'), styles: labelStyles }, sane(performance.name)],
      [{ content: i18next.t('pdf.artist_type'), styles: labelStyles }, sane(performance.type)],
      [{ content: i18next.t('pdf.contact_name'), styles: labelStyles }, sane(performance.contactName)],
      [{ content: i18next.t('pdf.contact_phone'), styles: labelStyles }, sane(performance.contactPhone)],
      [{ content: i18next.t('pdf.contact_email'), styles: labelStyles }, sane(performance.contactEmail)],
      [{ content: i18next.t('pdf.status'), styles: labelStyles }, sane(performance.status)],
    ];
    autoTable(pdf, {
      body: artistBody,
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Horaris ---
  if (options.includeBasicInfo) {
    y = checkPageBreak(pdf, y, 30);
    const scheduleBody = [
      [{ content: i18next.t('pdf.schedule'), colSpan: 2, styles: headStyles }],
      [{ content: i18next.t('pdf.arrival_time'), styles: labelStyles }, sane(performance.arrivalTime)],
      [{ content: i18next.t('pdf.soundcheck_time'), styles: labelStyles }, sane(performance.soundCheckTime)],
      [{ content: i18next.t('pdf.show_time'), styles: labelStyles }, sane(performance.showTime)],
      [{ content: i18next.t('pdf.departure_time'), styles: labelStyles }, sane(performance.departureTime)],
      [{ content: i18next.t('pdf.duration'), styles: labelStyles }, sane(performance.duration)],
    ];
    autoTable(pdf, {
      body: scheduleBody,
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Input List ---
  if (options.includeInputs && performance.techData?.inputList && performance.techData.inputList.length > 0) {
    y = checkPageBreak(pdf, y, 50);
    
    // Filtrar columnes segons les opcions i verificar si tenen dades
    const columns = options.inputColumns || {
      patch: true, channel: true, label: true, rider: true, 
      contra: true, stand: true, notes: true, exclusive: true
    };
    
    // Verificar quines columnes tenen dades no buides
    const columnsWithData = {
      patch: columns.patch && performance.techData.inputList.some(input => input.patchNumber),
      channel: columns.channel && performance.techData.inputList.some(input => input.channel),
      label: columns.label && performance.techData.inputList.some(input => input.label),
      rider: columns.rider && performance.techData.inputList.some(input => input.micRider),
      contra: columns.contra && performance.techData.inputList.some(input => input.micContra),
      stand: columns.stand && performance.techData.inputList.some(input => input.stand),
      notes: columns.notes && performance.techData.inputList.some(input => input.extres),
      exclusive: columns.exclusive && performance.techData.inputList.some(input => input.exclusive)
    };
    
    // Calcular els amples òptims de les columnes segons el contingut
    const optimalColumnWidths = calculateOptimalColumnWidths(performance.techData.inputList, columnsWithData, options.pdfOrientation || 'portrait');
    
    // Obtenir estils de densitat segons orientació
    const densityStyles = getTableDensityStyles(options.pdfOrientation || 'portrait');
    
    // Construir capçalera dinàmicament segons les columnes amb dades
    const inputHead = [];
    const columnStyles: any = {};
    let columnIndex = 0;
    
    if (columnsWithData.patch) {
      inputHead.push(i18next.t('pdf.patch'));
      columnStyles[columnIndex] = optimalColumnWidths[0] || { cellWidth: 18 };
      columnIndex++;
    }
    if (columnsWithData.channel) {
      inputHead.push(i18next.t('pdf.channel'));
      columnStyles[columnIndex] = optimalColumnWidths[1] || { cellWidth: 22 };
      columnIndex++;
    }
    if (columnsWithData.label) {
      inputHead.push(i18next.t('pdf.label'));
      columnStyles[columnIndex] = optimalColumnWidths[2] || { cellWidth: 30 };
      columnIndex++;
    }
    if (columnsWithData.rider) {
      inputHead.push(i18next.t('pdf.mic_rider'));
      columnStyles[columnIndex] = optimalColumnWidths[3] || { cellWidth: 25 };
      columnIndex++;
    }
    if (columnsWithData.contra) {
      inputHead.push(i18next.t('pdf.mic_contra'));
      columnStyles[columnIndex] = optimalColumnWidths[4] || { cellWidth: 25 };
      columnIndex++;
    }
    if (columnsWithData.stand) {
      inputHead.push(i18next.t('pdf.stand'));
      columnStyles[columnIndex] = optimalColumnWidths[5] || { cellWidth: 30 };
      columnIndex++;
    }
    if (columnsWithData.notes) {
      inputHead.push(i18next.t('pdf.notes'));
      columnStyles[columnIndex] = optimalColumnWidths[6] || { cellWidth: 40 };
      columnIndex++;
    }
    if (columnsWithData.exclusive) {
      inputHead.push(i18next.t('pdf.exclusive'));
      columnStyles[columnIndex] = optimalColumnWidths[7] || { cellWidth: 13 };
      columnIndex++;
    }
    
    // Si no hi ha cap columna amb dades, ometre la secció
    if (inputHead.length === 0) {
      return pdf; // Ometre aquesta secció completament
    }

    // 1. Mapa de colors per al PDF (Valors RGB equivalents als de Tailwind)
    const patchColorMap: Record<string, [number, number, number]> = {
      red:[239, 68, 68],     
      blue: [59, 130, 246],   
      green:[34, 197, 94],   
      yellow:[250, 204, 21], 
      orange:[249, 115, 22], 
      purple: [168, 85, 247], 
      brown: [180, 83, 9],    
    };

    // 2. Preparem el body filtrant només les columnes amb dades
    const inputBody = performance.techData.inputList.map(input => {
      const row = [];
      const hasColor = input.patchColor && input.patchColor !== 'transparent';
      
      if (columnsWithData.patch) {
        row.push({ 
          content: sane(input.patchNumber), 
          styles: { cellPadding: { left: hasColor ? 8 : 2, top: 2, bottom: 2, right: 2 } },
          customColor: input.patchColor
        });
      }
      if (columnsWithData.channel) row.push(sane(input.channel));
      if (columnsWithData.label) row.push(sane(input.label));
      if (columnsWithData.rider) row.push(sane(input.micRider));
      if (columnsWithData.contra) row.push(sane(input.micContra));
      if (columnsWithData.stand) row.push(sane(input.stand));
      if (columnsWithData.notes) row.push(sane(input.extres));
      if (columnsWithData.exclusive) row.push(input.exclusive ? '✓' : '');
      
      return row;
    });

    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.input_list'), colSpan: inputHead.length, styles: headStyles }],
        inputHead
      ],
      body: inputBody,
      startY: y,
      theme: 'grid',
      headStyles: { 
        fillColor: hslToRgb(...themeHslColors.grayDark), 
        textColor: hslToRgb(...themeHslColors.foregroundWhite), 
        fontStyle: 'bold',
        fontSize: densityStyles.fontSize,
        cellPadding: densityStyles.cellPadding,
      },
      columnStyles: columnStyles,
      margin: { left: 10, right: 10 },
      // 3. AQUESTA ÉS LA MÀGIA: Dibuixem el cercle just després de renderitzar la cel·la
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const raw = data.cell.raw as any;
          if (raw && raw.customColor && raw.customColor !== 'transparent' && patchColorMap[raw.customColor]) {
            const rgb = patchColorMap[raw.customColor];
            pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
            
            // Calculem el centre vertical de la cel·la
            const x = data.cell.x + 4; // 4mm des del marge esquerre
            const y = data.cell.y + (data.cell.height / 2);
            
            // Dibuixem un cercle de 2mm de radi ple ('F' = Fill)
            pdf.circle(x, y, 2, 'F');
          }
        }
      },
      // 4. Configuració de densitat per permetre múltiples files en cel·les
      styles: densityStyles
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  } else if (options.includeInputs && options.showEmptySections) {
    y = checkPageBreak(pdf, y, 20);
    pdf.setFontSize(12);
    pdf.text(i18next.t('pdf.no_inputs'), 14, y);
    y += 10;
  }

  // --- Monitor List ---
  if (options.includeMonitors && performance.techData?.monitorList && performance.techData.monitorList.length > 0) {
    y = checkPageBreak(pdf, y, 50);
    
    // Filtrar columnes segons les opcions i verificar si tenen dades
    const monitorColumns = options.monitorColumns || {
      patch: true, outputChannel: true, label: true, rider: true, 
      contra: true, stand: true, notes: true, exclusive: true
    };
    
    // Verificar quines columnes tenen dades no buides
    const columnsWithData = {
      patch: monitorColumns.patch && performance.techData.monitorList.some(monitor => monitor.patchNumber),
      outputChannel: monitorColumns.outputChannel && performance.techData.monitorList.some(monitor => monitor.outputChannel),
      label: monitorColumns.label && performance.techData.monitorList.some(monitor => monitor.label),
      rider: monitorColumns.rider && performance.techData.monitorList.some(monitor => monitor.mixRider),
      contra: monitorColumns.contra && performance.techData.monitorList.some(monitor => monitor.mixContra),
      stand: monitorColumns.stand && performance.techData.monitorList.some(monitor => monitor.mixStand),
      notes: monitorColumns.notes && performance.techData.monitorList.some(monitor => monitor.notes),
      exclusive: monitorColumns.exclusive && performance.techData.monitorList.some(monitor => monitor.exclusive)
    };
    
    // Calcular els amples òptims de les columnes segons el contingut
    const optimalColumnWidths = calculateOptimalColumnWidths(performance.techData.monitorList, columnsWithData, options.pdfOrientation || 'portrait');
    
    // Obtenir estils de densitat segons orientació
    const densityStyles = getTableDensityStyles(options.pdfOrientation || 'portrait');
    
    // Construir capçalera només amb columnes que tenen dades
    const monitorHead = [];
    const columnStyles: any = {};
    let columnIndex = 0;
    
    if (columnsWithData.patch) {
      monitorHead.push(i18next.t('pdf.patch'));
      columnStyles[columnIndex] = optimalColumnWidths[0] || { cellWidth: 12 };
      columnIndex++;
    }
    if (columnsWithData.outputChannel) {
      monitorHead.push(i18next.t('pdf.output_channel'));
      columnStyles[columnIndex] = optimalColumnWidths[1] || { cellWidth: 12 };
      columnIndex++;
    }
    if (columnsWithData.label) {
      monitorHead.push(i18next.t('pdf.label'));
      columnStyles[columnIndex] = optimalColumnWidths[2] || { cellWidth: 25 };
      columnIndex++;
    }
    if (columnsWithData.rider) {
      monitorHead.push(i18next.t('pdf.monitor_rider'));
      columnStyles[columnIndex] = optimalColumnWidths[3] || { cellWidth: 20 };
      columnIndex++;
    }
    if (columnsWithData.contra) {
      monitorHead.push(i18next.t('pdf.monitor_contra'));
      columnStyles[columnIndex] = optimalColumnWidths[4] || { cellWidth: 20 };
      columnIndex++;
    }
    if (columnsWithData.stand) {
      monitorHead.push(i18next.t('pdf.monitor_stand'));
      columnStyles[columnIndex] = optimalColumnWidths[5] || { cellWidth: 15 };
      columnIndex++;
    }
    if (columnsWithData.notes) {
      monitorHead.push(i18next.t('pdf.notes'));
      columnStyles[columnIndex] = optimalColumnWidths[6] || { cellWidth: 30 };
      columnIndex++;
    }
    if (columnsWithData.exclusive) {
      monitorHead.push(i18next.t('pdf.exclusive'));
      columnStyles[columnIndex] = optimalColumnWidths[7] || { cellWidth: 10 };
      columnIndex++;
    }
    
    // Si no hi ha cap columna amb dades, ometre la secció
    if (monitorHead.length === 0) {
      // Ometre aquesta secció
    } else {
      // Mapa de colors per al PDF (mateix que per inputs)
      const patchColorMap: Record<string, [number, number, number]> = {
        red:[239, 68, 68],     
        blue: [59, 130, 246],   
        green:[34, 197, 94],   
        yellow:[250, 204, 21], 
        orange:[249, 115, 22], 
        purple: [168, 85, 247], 
        brown: [180, 83, 9],    
      };

      // Preparem el body filtrant només les columnes amb dades
      const monitorBody = performance.techData.monitorList.map(monitor => {
        const row = [];
        const hasColor = monitor.patchColor && monitor.patchColor !== 'transparent';
        
        if (columnsWithData.patch) {
          row.push({ 
            content: sane(monitor.patchNumber), 
            styles: { cellPadding: { left: hasColor ? 8 : 2, top: 2, bottom: 2, right: 2 } },
            customColor: monitor.patchColor
          });
        }
        if (columnsWithData.outputChannel) row.push(sane(monitor.outputChannel));
        if (columnsWithData.label) row.push(sane(monitor.label));
        if (columnsWithData.rider) row.push(sane(monitor.mixRider));
        if (columnsWithData.contra) row.push(sane(monitor.mixContra));
        if (columnsWithData.stand) row.push(sane(monitor.mixStand));
        if (columnsWithData.notes) row.push(sane(monitor.notes));
        if (columnsWithData.exclusive) row.push(monitor.exclusive ? '✓' : '');
        
        return row;
      });

      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.monitor_list'), colSpan: monitorHead.length, styles: headStyles }],
          monitorHead
        ],
        body: monitorBody,
        startY: y,
        theme: 'grid',
        headStyles: { 
          fillColor: hslToRgb(...themeHslColors.grayDark), 
          textColor: hslToRgb(...themeHslColors.foregroundWhite), 
          fontStyle: 'bold',
          fontSize: densityStyles.fontSize,
          cellPadding: densityStyles.cellPadding,
        },
        columnStyles: columnStyles,
        margin: { left: 10, right: 10 },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const raw = data.cell.raw as any;
            if (raw && raw.customColor && raw.customColor !== 'transparent' && patchColorMap[raw.customColor]) {
              const rgb = patchColorMap[raw.customColor];
              pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
              
              const x = data.cell.x + 4;
              const y = data.cell.y + (data.cell.height / 2);
              pdf.circle(x, y, 2, 'F');
            }
          }
        },
        // Configuració de densitat per permetre múltiples files en cel·les
        styles: densityStyles
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }
  }

  // --- Cablejat ---
  if (options.includeCable && performance.techData?.cableList && performance.techData.cableList.length > 0) {
    y = checkPageBreak(pdf, y, 30);
    const cableHead = [i18next.t('pdf.qty'), i18next.t('pdf.material'), i18next.t('pdf.notes')];
    const cableBody = performance.techData.cableList.map(item => [
      (item.qty ?? 1).toString(),
      sane(item.itemName),
      sane(item.notes)
    ]);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.cable_list', { defaultValue: 'Cablejat' }), colSpan: 3, styles: headStyles }], cableHead],
      body: cableBody,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15, halign: 'center' } },
      margin: { left: 10, right: 10 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Material Spare ---
  if (options.includeSpare && performance.techData?.spareList && performance.techData.spareList.length > 0) {
    y = checkPageBreak(pdf, y, 30);
    const spareHead = [i18next.t('pdf.qty'), i18next.t('pdf.material'), i18next.t('pdf.notes')];
    const spareBody = performance.techData.spareList.map(item => [
      (item.qty ?? 1).toString(),
      sane(item.itemName),
      sane(item.notes)
    ]);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.spare_list', { defaultValue: 'Material Spare' }), colSpan: 3, styles: headStyles }], spareHead],
      body: spareBody,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15, halign: 'center' } },
      margin: { left: 10, right: 10 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Notes Tècniques ---
  if (options.includeTechnicalNotes) {
    const techNotes = [];
    if (performance.techData?.lightingNotes) {
      techNotes.push([{ content: i18next.t('pdf.lighting_notes'), styles: labelStyles }, sane(performance.techData.lightingNotes)]);
    }
    if (performance.techData?.videoNotes) {
      techNotes.push([{ content: i18next.t('pdf.video_notes'), styles: labelStyles }, sane(performance.techData.videoNotes)]);
    }
    if (performance.techData?.stageRequirements) {
      techNotes.push([{ content: i18next.t('pdf.stage_requirements'), styles: labelStyles }, sane(performance.techData.stageRequirements)]);
    }

    if (techNotes.length > 0) {
      y = checkPageBreak(pdf, y, 30);
      techNotes.unshift([{ content: i18next.t('pdf.technical_notes'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, {
        body: techNotes,
        theme: 'grid',
        startY: y,
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    } else if (options.showEmptySections) {
      y = checkPageBreak(pdf, y, 20);
      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.technical_notes'), styles: headStyles }]],
        body: [[{ content: i18next.t('performances.no_technical_notes'), styles: emptySectionStyles }]],
        startY: y,
        theme: 'grid',
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }
  }

  // --- Hospitality ---
  if (options.includeHospitality) {
    const hospitalityNotes = [];
    if (performance.hospitalityData?.dressingRooms) {
      hospitalityNotes.push([{ content: i18next.t('pdf.dressing_rooms'), styles: labelStyles }, sane(performance.hospitalityData.dressingRooms)]);
    }
    if (performance.hospitalityData?.cateringNotes) {
      hospitalityNotes.push([{ content: i18next.t('pdf.catering'), styles: labelStyles }, sane(performance.hospitalityData.cateringNotes)]);
    }
    if (performance.hospitalityData?.dietaryRequirements) {
      hospitalityNotes.push([{ content: i18next.t('pdf.dietary_requirements'), styles: labelStyles }, sane(performance.hospitalityData.dietaryRequirements)]);
    }
    if (performance.hospitalityData?.travelLogistics) {
      hospitalityNotes.push([{ content: i18next.t('pdf.travel_logistics'), styles: labelStyles }, sane(performance.hospitalityData.travelLogistics)]);
    }
    if (performance.hospitalityData?.parkingNotes) {
      hospitalityNotes.push([{ content: i18next.t('pdf.parking'), styles: labelStyles }, sane(performance.hospitalityData.parkingNotes)]);
    }

    if (hospitalityNotes.length > 0) {
      y = checkPageBreak(pdf, y, 30);
      hospitalityNotes.unshift([{ content: i18next.t('pdf.hospitality'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, {
        body: hospitalityNotes,
        theme: 'grid',
        startY: y,
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    } else if (options.showEmptySections) {
      y = checkPageBreak(pdf, y, 20);
      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.hospitality'), styles: headStyles }]],
        body: [[{ content: i18next.t('performances.no_hospitality'), styles: emptySectionStyles }]],
        startY: y,
        theme: 'grid',
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }
  }

  // --- Notes Generals ---
  if (options.includeGeneralNotes && performance.notes) {
    y = checkPageBreak(pdf, y, 20);
    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.general_notes'), styles: headStyles }]],
      body: [[sane(performance.notes)]],
      startY: y,
      theme: 'grid',
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // --- Balanç Consolidat ---
  if (options.showBalance !== false) {
    // Funció per traduir els noms tècnics de les seccions al PDF
    const translateSection = (section: string) => {
      switch(section) {
        case 'Inputs': return i18next.t('pdf.inputs', { defaultValue: 'Inputs' });
        case 'Monitors': return i18next.t('pdf.monitors', { defaultValue: 'Monitors' });
        case 'Cablejat': return i18next.t('pdf.cable_list', { defaultValue: 'Cablejat' });
        case 'Material Spare': return i18next.t('pdf.spare_list', { defaultValue: 'Material Spare' });
        default: return section;
      }
    };

    // WYSIWYG: Utilitzar dades directes del RiderBalance si estan disponibles
    if (options.balanceData && options.balanceData.length > 0) {
      // Utilitzar dades directes (WYSIWYG)
      const balanceData: any[] = [];
      let currentSection = '';
      
      options.balanceData.forEach(item => {
        // Afegir separador de secció si canvia
        if (item.section !== currentSection) {
          balanceData.push([
            { content: translateSection(item.section), colSpan: 4, styles: { ...headStyles, fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite) } }
          ]);
          currentSection = item.section;
        }
        
        balanceData.push([
          sane(item.name),
          sane(item.location),
          item.qty.toString(),
          `${item.available} / ${item.total}` 
        ]);
      });

      if (balanceData.length > 0) {
        y = checkPageBreak(pdf, y, 30);
        const balanceHead = [
          i18next.t('pdf.material'),
          i18next.t('pdf.location'),
          i18next.t('pdf.quantity'),
          i18next.t('pdf.stock_balance', { defaultValue: 'Estoc (Disp/Total)' })
        ];
        
        autoTable(pdf, {
          head: [[{ content: i18next.t('pdf.balance_title'), colSpan: 4, styles: headStyles }],
            balanceHead
          ],
          body: balanceData,
          startY: y,
          theme: 'grid',
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
          margin: { left: 10, right: 10 }
        });
        y = (pdf as any).lastAutoTable.finalY + 5;
      }
    } else if (allPerformances && materialItems) {
      // Mètode antic (recalcul) - Només si no hi ha dades directes
    // Calcular el balanç com al RiderBalance component
    const usage: Record<string, { id: string; name: string; qty: number; location: string; category: string; section: string }> = {};

    const countMaterial = (matId: string | undefined, matName: string | undefined, qty: number = 1, section: string) => {
      if (!matId || !matName) return;
      if (!usage[matId]) {
        const found = materialItems.find(mi => mi.id === matId);
        usage[matId] = { id: matId, name: matName, qty: 0, location: found?.location || '-', category: found?.category || '', section };
      }
      usage[matId].qty += qty;
    };

    allPerformances.forEach(perf => {
      (perf.techData?.inputList || []).forEach(input => {
        countMaterial(input.micContraId, input.micContra, 1, 'Inputs');
        countMaterial(input.standId,     input.stand, 1, 'Inputs');
        countMaterial(input.extresId,    input.extres, 1, 'Inputs');
      });
      (perf.techData?.monitorList || []).forEach(monitor => {
        countMaterial(monitor.mixContraId, monitor.mixContra, monitor.monitorQty ?? 1, 'Monitors');
        countMaterial(monitor.mixStandId,  monitor.mixStand,  monitor.standQty   ?? 1, 'Monitors');
      });
      (perf.techData?.cableList || []).forEach(cable => {
        countMaterial(cable.itemId, cable.itemName, cable.qty ?? 1, 'Cablejat');
      });
      (perf.techData?.spareList || []).forEach(spare => {
        countMaterial(spare.itemId, spare.itemName, spare.qty ?? 1, 'Material Spare');
      });
    });

    // Obtenir la funció getMaterialAvailability del store
    const { getMaterialAvailability } = useEventDataStore.getState();

    // Ordenar per secció primer
    const sectionOrder = { 'Inputs': 0, 'Monitors': 1, 'Cablejat': 2, 'Material Spare': 3 };
    
    // Funció per traduir els noms tècnics de les seccions al PDF
    const translateSection = (section: string) => {
      switch(section) {
        case 'Inputs': return i18next.t('pdf.inputs', { defaultValue: 'Inputs' });
        case 'Monitors': return i18next.t('pdf.monitors', { defaultValue: 'Monitors' });
        case 'Cablejat': return i18next.t('pdf.cable_list', { defaultValue: 'Cablejat' });
        case 'Material Spare': return i18next.t('pdf.spare_list', { defaultValue: 'Material Spare' });
        default: return section;
      }
    };

    // Calcular disponibilitat i errors com al RiderBalance
    const usageWithAvailability = Object.values(usage).map(u => {
      const globalAvail = getMaterialAvailability(u.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
      return { ...u, available: globalAvail.available, total: globalAvail.total, isError: globalAvail.available < 0 };
    });

    // Aplicar ordenament: primer per secció, després per errors, després pels altres criteris
    const sortedUsage = usageWithAvailability.sort((a, b) => {
      // Primer ordenar per secció (Inputs → Monitors → Cablejat → Material Spare)
      const sectionDiff = sectionOrder[a.section as keyof typeof sectionOrder] - sectionOrder[b.section as keyof typeof sectionOrder];
      if (sectionDiff !== 0) return sectionDiff;
      
      // Després ordenar per errors (sempre prioritari)
      const errorDiff = (b.isError ? 1 : 0) - (a.isError ? 1 : 0);
      if (errorDiff !== 0) return errorDiff;

      // Després aplicar els filtres d'ordenament
      if (options.balanceSortByCategory && options.balanceSortByLocation) {
        // Ambdós actius: primer per categoria, després per ubicació
        const categoryDiff = a.category.localeCompare(b.category);
        if (categoryDiff !== 0) return categoryDiff;
        return a.location.localeCompare(b.location);
      } else if (options.balanceSortByCategory) {
        // Només categoria
        return a.category.localeCompare(b.category);
      } else if (options.balanceSortByLocation) {
        // Només ubicació
        return a.location.localeCompare(b.location);
      } else {
        // Sense ordenament específic, per nom
        return a.name.localeCompare(b.name);
      }
    });

    // Crear dades del balanç amb separadors de secció
    const balanceData: any[] = [];
    let currentSection = '';
    
    sortedUsage.forEach(item => {
      // Afegir separador de secció si canvia
      if (item.section !== currentSection) {
        balanceData.push([
          { content: translateSection(item.section), colSpan: 4, styles: { ...headStyles, fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite) } }
        ]);
        currentSection = item.section;
      }
      
      balanceData.push([
        sane(item.name),
        sane(item.location),
        item.qty.toString(),
        `${item.available} / ${item.total}` 
      ]);
    });

    if (balanceData.length > 0) {
      y = checkPageBreak(pdf, y, 30);
      const balanceHead = [
        i18next.t('pdf.material'),
        i18next.t('pdf.location'),
        i18next.t('pdf.quantity'),
        i18next.t('pdf.stock_balance', { defaultValue: 'Estoc (Disp/Total)' })
      ];
      
      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.balance_title'), colSpan: 4, styles: headStyles }],
          balanceHead
        ],
        body: balanceData,
        startY: y,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
        margin: { left: 10, right: 10 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }
    }
  }

  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, i);
  }

  return pdf;
};

// --- FUNCIÓ REFACTORITZADA D'EXPORTACIÓ ---
export const exportPerformanceToPdfWithOptions = async (
  performance: Performance,
  eventFrame: EventFrame,
  options: PerformancePdfOptions,
  showToast: ShowToastFunction,
  allPerformances?: Performance[],
  materialItems?: MaterialItem[]
) => {
  try {
    // Validar dades primer i mostrar errors/warnings
    const validation = validatePerformanceData(performance);
    if (!validation.isValid) {
      validation.errors.forEach(error => showToast(error, 'error'));
      return;
    }
    validation.warnings.forEach(warning => showToast(warning, 'info'));
    
    const pdf = generatePerformancePdfObjectWithOptions(performance, eventFrame, options, allPerformances, materialItems);
    const fileName = `CustomRider_${performance.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);

  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};