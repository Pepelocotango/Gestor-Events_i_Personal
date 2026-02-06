import i18next from 'i18next';
import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, Assignment, NeedItem, MaterialControlRow, Performance } from '../types';
import { formatDateDMY, formatDateRangeDMY } from './dateFormat';
import { getStatusSummaryText } from './statusUtils';
import { themeHslColors } from './themeDefinition';
import { hslToRgb } from './colorUtils';
import { generateFileName, generateTechSheetFileName } from './fileNameUtils';

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
    let pageCount = 1;

    const addPageIfNeeded = (currentY: number) => {
      if (currentY > 280) {
        addFooter(pdf, pageCount);
        pdf.addPage();
        pageCount++;
        return 10; // Y inicial per a la nova pàgina
      }
      return currentY;
    };

    if (data.size === 0) {
      pdf.setFontSize(12);
      pdf.text(i18next.t('pdf.no_data_message'), 14, y);
    } else {
      data.forEach((assignments, groupKey) => {
        y = addPageIfNeeded(y);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(groupKey, 14, y);
        y += 8;

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
          theme: 'striped',
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
          margin: { top: 15, bottom: 15 }
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
      body.push([{ content: category, colSpan: 4, styles: { fontStyle: 'bold', fillColor: hslToRgb(...themeHslColors.grayBorder), textColor: hslToRgb(...themeHslColors.foreground) } }]);
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
      styles: { fontSize: 10, cellPadding: 2.5 },
      headStyles: { fillColor: hslToRgb(...themeHslColors.success), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
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
      styles: { fontSize: 9, cellPadding: 2 },
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

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const eventTitle = `${eventData.eventName} (${formatDateRangeDMY(eventDetails?.startDate, eventDetails?.endDate)})`;
      pdf.text(eventTitle, 14, y);
      y += 8;

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
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
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
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: hslToRgb(...themeHslColors.orange), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
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
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayMedium), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
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

export const exportPerformanceToPdf = async (
  performance: Performance,
  eventFrame: EventFrame,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, `${i18next.t('pdf.performance_rider_title')} - ${performance.name}`);

    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
    const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };

    // --- Capçalera de l'Esdeveniment ---
    const headerBody = [
      [{ content: i18next.t('pdf.event_info'), colSpan: 2, styles: { halign: 'center' as const, fontSize: 14, fontStyle: 'bold' as const } }],
      [{ content: i18next.t('pdf.event_name'), styles: labelStyles }, sane(eventFrame.name)],
      [{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],
      [{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)],
    ];
    autoTable(pdf, {
      body: headerBody,
      theme: 'grid',
      startY: y,
      margin: { left: 10, right: 10 },
      styles: { cellPadding: 2 }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;

    // --- Info de l'Artista ---
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

    // --- Horaris ---
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

    // --- Input List ---
    if (performance.techData?.inputList && performance.techData.inputList.length > 0) {
      const inputHead = [[
        i18next.t('pdf.patch'),
        i18next.t('pdf.channel'),
        i18next.t('pdf.label'),
        i18next.t('pdf.mic_rider'),
        i18next.t('pdf.mic_contra'),
        i18next.t('pdf.stand'),
        i18next.t('pdf.notes')
      ]];
      const inputBody = performance.techData.inputList.map(input => [
        sane(input.patchColor && input.patchColor !== 'transparent' ? `${input.patchColor} ${input.patchNumber || ''}` : ''),
        sane(input.channel),
        sane(input.label),
        sane(input.micRider),
        sane(input.micContra),
        sane(input.stand),
        sane(input.notes)
      ]);

      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.input_list'), colSpan: 7, styles: headStyles }]],
        body: [inputHead, ...inputBody],
        startY: y,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
        margin: { left: 10, right: 10 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }

    // --- Notes Tècniques ---
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
      techNotes.unshift([{ content: i18next.t('pdf.technical_notes'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, {
        body: techNotes,
        theme: 'grid',
        startY: y,
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }

    // --- Hospitality ---
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
      hospitalityNotes.unshift([{ content: i18next.t('pdf.hospitality'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, {
        body: hospitalityNotes,
        theme: 'grid',
        startY: y,
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }

    // --- Notes Generals ---
    if (performance.notes) {
      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.general_notes'), styles: headStyles }]],
        body: [[sane(performance.notes)]],
        startY: y,
        theme: 'grid',
        margin: { left: 10, right: 10 },
        styles: { cellPadding: 2 }
      });
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

    const fileName = `Rider_${performance.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);

  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

export const exportEventPerformancesSummaryPdf = async (
  eventFrame: EventFrame,
  performances: Performance[],
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, `${i18next.t('pdf.event_runsheet_title')} - ${eventFrame.name}`);

    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };

    // --- Info de l'Esdeveniment ---
    const eventInfo = [
      [{ content: i18next.t('pdf.event_info'), colSpan: 2, styles: { halign: 'center' as const, fontSize: 14, fontStyle: 'bold' as const } }],
      [{ content: i18next.t('pdf.location'), styles: { fillColor: hslToRgb(...themeHslColors.grayMuted), fontStyle: 'bold' as const, cellWidth: 50 } }, sane(eventFrame.place)],
      [{ content: i18next.t('pdf.date'), styles: { fillColor: hslToRgb(...themeHslColors.grayMuted), fontStyle: 'bold' as const, cellWidth: 50 } }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)],
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

      const runsheetHead = [[
        i18next.t('pdf.time'),
        i18next.t('pdf.artist'),
        i18next.t('pdf.type'),
        i18next.t('pdf.status'),
        i18next.t('pdf.duration'),
        i18next.t('pdf.notes')
      ]];

      const runsheetBody = sortedPerformances.map(performance => [
        sane(performance.showTime),
        sane(performance.name),
        sane(performance.type),
        sane(performance.status),
        sane(performance.duration),
        sane(performance.notes)
      ]);

      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.artistic_runsheet'), colSpan: 6, styles: headStyles }]],
        body: [runsheetHead, ...runsheetBody],
        startY: y,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
        margin: { left: 10, right: 10 }
      });
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i);
    }

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
    let y = createPdfHeader(pdf, `${i18next.t('pdf.regidoria_summary_title')} - ${eventFrame.name}`);

    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
    const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };

    // --- Capçalera de l'Esdeveniment ---
    const headerBody = [
      [{ content: i18next.t('pdf.event_info'), colSpan: 2, styles: { halign: 'center' as const, fontSize: 14, fontStyle: 'bold' as const } }],
      [{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],
      [{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)],
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
      const combinedScheduleHead = [[
        i18next.t('pdf.time'),
        i18next.t('pdf.description'),
        i18next.t('pdf.type'),
        i18next.t('pdf.regidoria_notes')
      ]];

      const combinedScheduleBody = allScheduleItems.map(item => [
        item.endTime && item.endTime !== item.time 
          ? `${item.time} - ${item.endTime}`
          : item.time,
        item.description,
        item.type,
        item.notes
      ]);

      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.combined_schedule'), colSpan: 4, styles: headStyles }]],
        body: [combinedScheduleHead, ...combinedScheduleBody],
        startY: y,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
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