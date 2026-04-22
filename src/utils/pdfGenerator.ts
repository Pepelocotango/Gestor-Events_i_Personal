/**
 * =============================================================================
 * PDF GENERATOR
 * =============================================================================
 * DESCRIPCIÓ:
 * Mòdul centralitzat per a la generació de documents PDF de l'aplicació.
 *
 * ÍNDEX:
 * - HELPERS & COMUNS: Funcions base per a la creació, paginació i desat de fitxers PDF.
 * - EXPORTACIÓ RESUMS: Generació d'informes resumits d'assignacions de personal.
 * - EXPORTACIÓ DE LLISTA DE MATERIAL: Informes detallats de l'estoc d'inventari.
 * - EXPORTACIÓ DE CONTROL DE MATERIAL: Llistats de control i balanços de material per esdeveniment.
 * - EXPORTACIÓ DE LLIBRETA D'ADRECES: Documents amb informació de contacte del personal.
 * - FITXA TÈCNICA: Generació del document principal (Fitxa de Bolo).
 * - EXPORTACIÓ DE LLISTA D'ESDEVENIMENTS: Llistat general d'esdeveniments registrats.
 * - EXPORTACIÓ D'ACTUACIONS: Escaleta artística i horaris de les actuacions.
 * - FULL DE RUTA DEL REGIDOR: Full de ruta combinat amb horaris i notes de regidoria.
 * - VALIDACIÓ DE DADES: Verificació d'errors en la informació de les actuacions.
 * - CÀLCUL D'AMPLES ÒPTIMS: Ajustament dinàmic de columnes segons contingut (autofit).
 * - ESTILS I DENSITAT: Gestió de l'estètica, colors, fonts i densitat de les taules.
 * - GENERACIÓ DEFINITIVA RIDER: Construcció dinàmica de fitxes tècniques amb opcions personalitzables.
 * - VALIDACIÓ: Procés de control abans de l'exportació final de riders.
 * =============================================================================
 */

import i18next from 'i18next';
import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, MaterialControlRow, Performance, PerformancePdfOptions, ValidationResult } from '../types';
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

// =============================================================================
// HELPERS & COMUNS
// =============================================================================
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
  pdf.text(`${pageCount}`, pageW - 14, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });
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

// =============================================================================
// EXPORTACIÓ RESUMS
// =============================================================================
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
        if (y > 250) {
          pdf.addPage();
          y = createPdfHeader(pdf, `${i18next.t('pdf.summary_title_prefix')}${title}`);
        }
        
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

// =============================================================================
// EXPORTACIÓ DE LLISTA DE MATERIAL
// =============================================================================
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

// =============================================================================
// EXPORTACIÓ DE CONTROL DE MATERIAL
// =============================================================================
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
      const body = eventData.items.map(item => [item.quantity.toString(), item.name, item.category, item.location]);

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

// =============================================================================
// EXPORTACIÓ DE LLIBRETA D'ADRECES
// =============================================================================
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
      const contactInfo = [p.tel1, p.tel2, p.email, p.web].filter(Boolean).join('\n');
      return [p.name, p.role || '-', contactInfo || '-', p.notes || '-'];
    });

    autoTable(pdf, {
      head,
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
      columnStyles: { 2: { cellWidth: 60 }, 3: { cellWidth: 'auto' } },
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

// =============================================================================
// FITXA TÈCNICA
// =============================================================================
export const generateTechSheetPdfObject = (
  formData: TechSheetData,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 10;
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

  const headerBody = [
    [{ content: i18next.t('pdf.tech_sheet.main_title'), colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],
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
    y = (pdf as any).lastAutoTable.finalY + 3;
  }

  if (formData.parking?.status === 'yes' || formData.parking?.status === 'no') {
    y = checkPageBreak(y);
    const parkingDetails = formData.parking.status === 'yes' ? (sane(formData.parking.details) !== '-' ? sane(formData.parking.details) : i18next.t('pdf.yes')) : i18next.t('pdf.no');
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
            if (role.printNotes && sane(role.notes) !== '-') { hasAnyNotes = true; row.push(sane(role.notes)); }
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
      tableBody.push([{ content: sane(formData.technicalPersonnelNotes), colSpan: totalColumns, styles: { fontStyle: 'italic' as const, halign: 'left' as const } }]);
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
      headStyles: { ...headStyles, halign: 'center' as const },
      columnStyles: hasAnyNotes ? { 0: { cellWidth: 15, halign: 'right' as const }, 3: { cellWidth: 'auto' } } : { 0: { cellWidth: 15, halign: 'right' as const } }
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
    y = (pdf as any).lastAutoTable.finalY + 3;
  }

  if (formData.schedule?.status === 'yes' && formData.schedule.data && formData.schedule.data.length > 0) {
    y = checkPageBreak(y);
    const groupedSchedule = formData.schedule.data.reduce((acc, item) => {
      const date = item.date || i18next.t('pdf.tech_sheet.no_date');
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    const scheduleBody: any[][] = [];
    const dateSubHeadStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold' };
    if (formData.showScheduleNotesInPdf && sane(formData.schedule.details) !== '-') {
      scheduleBody.push([{ content: sane(formData.schedule.details), colSpan: 2, styles: { fontStyle: 'italic' as const } }]);
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
    y = (pdf as any).lastAutoTable.finalY + 3;
  }

  const logisticsBody: any[][] = [];
  if (formData.dressingRooms?.status === 'yes') { logisticsBody.push([i18next.t('pdf.tech_sheet.dressing_rooms'), sane(formData.dressingRooms.details) !== '-' ? sane(formData.dressingRooms.details) : 'SI', '']); }
  if (formData.actorsInfo?.status === 'yes') { logisticsBody.push([i18next.t('pdf.tech_sheet.actors'), sane(formData.actorsInfo.data?.number), sane(formData.actorsInfo.data?.names)]); }
  if (formData.techniciansInfo?.status === 'yes') { logisticsBody.push([i18next.t('pdf.tech_sheet.tech_cia'), sane(formData.techniciansInfo.data?.number), sane(formData.techniciansInfo.data?.names)]); }
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
    needsBody.push([{ content: sane(formData.technicalNeedsNotes), colSpan: 3, styles: { fontStyle: 'italic' as const } }]);
  }
  const addNeedsToBody = (title: string, section: any) => {
    if (!section || section.status !== 'yes') return;
    const hasDetails = sane(section.details) !== '-';
    const validNeeds = (section.data?.needs || []).filter((n: any) => sane(n.description) !== '-' || sane(n.quantity) !== '-');
    if (hasDetails || validNeeds.length > 0) {
      needsBody.push([{ content: title, colSpan: 3, styles: subHeadStyles }]);
      if (hasDetails) needsBody.push([{ content: section.details!, colSpan: 3, styles: { fontStyle: 'italic' as const } }]);
      validNeeds.forEach((n: any) => { needsBody.push([{ content: sane(n.quantity), styles: { halign: 'right' as const } }, sane(n.description), sane(n.origin)]); });
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
    y = (pdf as any).lastAutoTable.finalY + 3;
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
        contactBody.push([sane(contact.name), sane(contact.role), `Email: ${sane(contact.email)}\nTel: ${sane(contact.phone)}`]);
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
    y = (pdf as any).lastAutoTable.finalY + 3;
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
  for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(pdf, i); }
  return pdf;
};

export const exportTechSheetToPdf = async (formData: TechSheetData, eventName: string, getPersonGroupById: (id: string) => PersonGroup | undefined, showToast: ShowToastFunction) => {
  try {
    const pdf = generateTechSheetPdfObject(formData, getPersonGroupById);
    const fileName = generateTechSheetFileName(eventName, formData.date || '');
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) { showToast(`Error generant PDF: ${(error as Error).message}`, 'error'); }
};

// =============================================================================
// EXPORTACIÓ DE LLISTA D'ESDEVENIMENTS
// =============================================================================
export const exportEventListToPdf = async (eventFrames: EventFrame[], peopleGroups: PersonGroup[], showToast: ShowToastFunction, activeFilters: ActiveFilters) => {
  try {
    const pdf = new jsPDF('l', 'mm', 'a4');
    let y = createPdfHeader(pdf, i18next.t('pdf.event_list_title'));
    const head = [[i18next.t('pdf.table_headers.event_name'), i18next.t('pdf.table_headers.location'), i18next.t('pdf.table_headers.dates'), i18next.t('pdf.table_headers.personnel_notes'), i18next.t('pdf.table_headers.status'), i18next.t('pdf.table_headers.general_notes')]];
    const body = eventFrames.map(ef => {
      const personnelText = ef.assignments.length > 0 ? ef.assignments.map((a: any) => { const person = peopleGroups.find(p => p.id === a.personGroupId); return `${person ? person.name : 'N/A'} ${getStatusSummaryText(a)}${a.notes ? `  └ Nota: ${a.notes}` : ''}`; }).join('\n\n') : i18next.t('pdf.no_assignments');
      return [ef.name, ef.place || '-', formatDateRangeDMY(ef.startDate, ef.endDate), personnelText, ef.personnelComplete ? i18next.t('pdf.complete_status') : i18next.t('pdf.incomplete_status'), ef.generalNotes || '-'];
    });
    autoTable(pdf, { head, body, startY: y, theme: 'grid', styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' }, columnStyles: { 3: { cellWidth: 85 }, 5: { cellWidth: 60 } }, didDrawPage: (data: any) => { if (data.pageNumber > 1) createPdfHeader(pdf, i18next.t('pdf.event_list_title')); }, margin: { top: 30, bottom: 15 } });
    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(pdf, i); }
    const fileName = generateFileName('Llista_Esdeveniments', activeFilters, eventFrames, 'pdf');
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) { showToast(`${i18next.t('common.error')}: ${(error as Error).message}`, 'error'); }
};

// =============================================================================
// EXPORTACIÓ D'ACTUACIONS
// =============================================================================
export const generateEventPerformancesPdfObject = (eventFrame: EventFrame, performances: Performance[]): jsPDF => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
  const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
  const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };
  let y = 10;
  autoTable(pdf, { body: [[{ content: `${i18next.t('pdf.event_runsheet_title')} - ${eventFrame.name}`, colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],[{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],[{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)]], theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 2 } });
  y = (pdf as any).lastAutoTable.finalY + 10;
  if (performances.length > 0) {
    const sortedPerformances = performances.filter(p => p.showTime).sort((a, b) => (a.showTime || '23:59').localeCompare(b.showTime || '23:59'));
    autoTable(pdf, { head: [[{ content: i18next.t('pdf.artistic_runsheet'), colSpan: 6, styles: headStyles }], [i18next.t('pdf.time'), i18next.t('pdf.artist'), i18next.t('pdf.type'), i18next.t('pdf.status'), i18next.t('pdf.duration'), i18next.t('pdf.notes')]], body: sortedPerformances.map(p => [sane(p.showTime), sane(p.name), sane(p.type), sane(p.status), sane(p.duration), sane(p.notes)]), startY: y, theme: 'grid', styles: { fontSize: 10, cellPadding: 2 }, headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' }, margin: { left: 10, right: 10 } });
  }
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(pdf, i); }
  return pdf;
};

export const exportEventPerformancesSummaryPdf = async (eventFrame: EventFrame, performances: Performance[], showToast: ShowToastFunction) => {
  try { const pdf = generateEventPerformancesPdfObject(eventFrame, performances); const fileName = `Escaleta_${eventFrame.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`; await savePdfWithDialog(pdf, fileName, showToast); } catch (error) { showToast(`Error generant PDF: ${(error as Error).message}`, 'error'); }
};

// =============================================================================
// FULL DE RUTA DEL REGIDOR
// =============================================================================
export const exportRegidoriaSummaryPdf = async (eventFrame: EventFrame, performances: Performance[], techSheetData: TechSheetData | undefined, showToast: ShowToastFunction) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' };
    const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 50 };
    let y = 10;
    autoTable(pdf, { body: [[{ content: `${i18next.t('pdf.regidoria_summary_title')} - ${eventFrame.name}`, colSpan: 2, styles: { halign: 'center' as const, fontSize: 16, fontStyle: 'bold' as const } }],[{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)],[{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)]], theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 2 } });
    y = (pdf as any).lastAutoTable.finalY + 10;
    const allScheduleItems: any[] = [];
    if (techSheetData?.schedule?.status === 'yes' && techSheetData.schedule.data) techSheetData.schedule.data.forEach(item => allScheduleItems.push({ time: sane(item.time), endTime: sane(item.timeEnd), description: sane(item.description), type: i18next.t('pdf.general_schedule'), notes: '', priority: 1 }));
    performances.forEach(p => {
      if (p.arrivalTime) allScheduleItems.push({ time: p.arrivalTime, endTime: p.soundCheckTime || '', description: `[ARRIBADA] ${sane(p.name)}`, type: i18next.t('pdf.arrival'), notes: extractRegidoriaNotes(p), priority: 2 });
      if (p.soundCheckTime) allScheduleItems.push({ time: p.soundCheckTime, endTime: p.showTime || '', description: `[PROVES] ${sane(p.name)}`, type: i18next.t('pdf.soundcheck'), notes: extractRegidoriaNotes(p), priority: 2 });
      if (p.showTime) allScheduleItems.push({ time: p.showTime, endTime: p.departureTime || '', description: `[SHOW] ${sane(p.name)}`, type: i18next.t('pdf.show'), notes: extractRegidoriaNotes(p), priority: 2 });
    });
    allScheduleItems.sort((a, b) => a.priority !== b.priority ? a.priority - b.priority : (a.time || '23:59').localeCompare(b.time || '23:59'));
    if (allScheduleItems.length > 0) autoTable(pdf, { head: [[{ content: i18next.t('pdf.combined_schedule'), colSpan: 4, styles: headStyles }], [i18next.t('pdf.time'), i18next.t('pdf.description'), i18next.t('pdf.type'), i18next.t('pdf.regidoria_notes')]], body: allScheduleItems.map(item => [item.endTime && item.endTime !== item.time ? `${item.time} - ${item.endTime}` : item.time, item.description, item.type, item.notes]), startY: y, theme: 'grid', styles: { fontSize: 10, cellPadding: 2 }, headStyles: { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 35 } }, margin: { left: 10, right: 10 } });
    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(pdf, i); }
    const fileName = `Full_Ruta_Regidoria_${eventFrame.name.replace(/[^a-zA-Z0-9]/g, '_')}_${formatDateDMY(eventFrame.startDate)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) { showToast(`Error generant PDF: ${(error as Error).message}`, 'error'); }
};

const extractRegidoriaNotes = (p: Performance): string => {
  const notes: string[] = [];
  if (p.techData?.stageRequirements) notes.push(`Escenari: ${p.techData.stageRequirements.substring(0, 50)}...`);
  if (p.hospitalityData?.dietaryRequirements) notes.push(`Dietes: ${p.hospitalityData.dietaryRequirements.substring(0, 50)}...`);
  if (p.hospitalityData?.travelLogistics) notes.push(`Viatge: ${p.hospitalityData.travelLogistics.substring(0, 50)}...`);
  if (p.notes) notes.push(`General: ${p.notes.substring(0, 50)}...`);
  return notes.join(' | ');
};

// =============================================================================
// VALIDACIÓ DE DADES
// =============================================================================
export const validatePerformanceData = (p: Performance): ValidationResult => {
  const errors: string[] = [], warnings: string[] = [];
  if (!p.name?.trim()) errors.push(i18next.t('performances.pdf_validation_error', { message: "El nom de l'actuació és obligatori" }));
  if (p.contactEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactEmail)) warnings.push(i18next.t('performances.pdf_validation_warning', { message: "Format d'email invàlid" }));
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  ['arrivalTime', 'soundCheckTime', 'showTime', 'departureTime'].forEach(f => { if (p[f as keyof Performance] && !timeRegex.test(p[f as keyof Performance] as string)) warnings.push(i18next.t('performances.pdf_validation_warning', { message: `Format de ${f} invàlid (HH:MM)` })); });
  return { errors, warnings, isValid: errors.length === 0 };
};

// =============================================================================
// CÀLCUL D'AMPLES ÒPTIMS TIPUS FULLA DE CÀLCUL (AUTOFIT)
// =============================================================================
const calculateOptimalColumnWidths = (columnConfig: any, data: any[], orientation: 'portrait' | 'landscape' = 'portrait') => {
  // Ample útil amb marge de seguretat (188 en portrait, 275 en landscape)
  const usableWidth = orientation === 'landscape' ? 275 : 188;
  const fontSize = orientation === 'landscape' ? 8.5 : 7;
  
  // Estimació de mm per caràcter (font Helvetica és aprox 0.35mm per punt de font)
  const mmPerChar = (fontSize * 0.45) * 0.3527; 
  const paddingW = 4; // 2mm a cada costat

  // 1. Definició de regles base
  const rules: Record<string, { isFixed: boolean; width?: number; minW: number; align: 'left' | 'center' }> = {
    'patch': { isFixed: true, width: orientation === 'landscape' ? 13 : 11, minW: 10, align: 'center' },
    'channel': { isFixed: true, width: orientation === 'landscape' ? 13 : 11, minW: 10, align: 'center' },
    'outputChannel': { isFixed: true, width: orientation === 'landscape' ? 13 : 11, minW: 10, align: 'center' },
    'label': { isFixed: false, minW: 15, align: 'left' },
    'rider': { isFixed: false, minW: 15, align: 'left' },
    'contra': { isFixed: false, minW: 15, align: 'left' },
    'stand': { isFixed: false, minW: 12, align: 'left' },
    'notes': { isFixed: false, minW: 20, align: 'left' },
    'exclusive': { isFixed: true, width: 8, minW: 8, align: 'center' }
  };

  const fieldMapping: Record<string, string> = {
    'patch': 'patchNumber', 'channel': 'channel', 'outputChannel': 'outputChannel',
    'label': 'label',
    'rider': data[0]?.micRider !== undefined ? 'micRider' : 'mixRider',
    'contra': data[0]?.micContra !== undefined ? 'micContra' : 'mixContra',
    'stand': data[0]?.stand !== undefined ? 'stand' : 'mixStand',
    'notes': data[0]?.extres !== undefined ? 'extres' : 'notes'
  };

  const activeKeys = ['patch', 'channel', 'outputChannel', 'label', 'rider', 'contra', 'stand', 'notes', 'exclusive'].filter(k => columnConfig[k]);
  if (activeKeys.length === 0) return {};

  // 2. Mesurar requeriment IDEAL de cada columna segons el text real
  const idealWidths: Record<string, number> = {};
  let fixedSum = 0;
  let elasticSum = 0;

  activeKeys.forEach(key => {
    const rule = rules[key];
    if (rule.isFixed) {
      idealWidths[key] = rule.width || rule.minW;
      fixedSum += idealWidths[key];
    } else {
      const field = fieldMapping[key];
      const maxLen = field ? Math.max(...data.map(item => String(item[field] || '').trim().length), 0) : 0;
      // Amplada segons text + padding
      idealWidths[key] = Math.max(rule.minW, (maxLen * mmPerChar) + paddingW);
      elasticSum += idealWidths[key];
    }
  });

  // 3. Ajustar a l'ample de la pàgina
  const availableForElastic = Math.max(0, usableWidth - fixedSum);
  const finalColStyles: Record<string, any> = {};

  if (elasticSum <= availableForElastic) {
    // CAS A: Sobra espai! Donem l'espai restant a la columna de 'notes' (si existeix) 
    // o el repartim per a que la taula s'eixampli fins al final.
    const extra = availableForElastic - elasticSum;
    activeKeys.forEach(key => {
      const rule = rules[key];
      let finalW = idealWidths[key];
      if (key === 'notes' || (!activeKeys.includes('notes') && key === 'label')) {
        finalW += extra; // Les notes es queden tot el sobrant per no deformar l'Instrument
      }
      finalColStyles[key] = { cellWidth: finalW, halign: rule.align };
    });
  } else {
    // CAS B: Falta espai! Reduïm totes les elàstiques proporcionalment
    const scale = availableForElastic / elasticSum;
    activeKeys.forEach(key => {
      const rule = rules[key];
      let finalW = idealWidths[key];
      if (!rule.isFixed) finalW *= scale;
      finalColStyles[key] = { cellWidth: finalW, halign: rule.align };
    });
  }

  return finalColStyles;
};

// =============================================================================
// ESTILS I DENSITAT
// =============================================================================
const getPerformanceStyles = () => {
  const sane = (v: any): string => (!v || String(v).trim() === '' || String(v).trim() === '--') ? '-' : String(v);
  const headStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold', fontSize: 8.5, cellPadding: 1.5 };
  const labelStyles: Partial<Styles> = { fillColor: hslToRgb(...themeHslColors.grayMuted), textColor: hslToRgb(...themeHslColors.foreground), fontStyle: 'bold', cellWidth: 35, fontSize: 8.5 };
  const emptySectionStyles: Partial<Styles> = { fontStyle: 'italic', textColor: hslToRgb(...themeHslColors.grayMuted) };
  return { sane, headStyles, labelStyles, emptySectionStyles };
};

const getTableDensityStyles = (orientation: 'portrait' | 'landscape') => {
  if (orientation === 'landscape') return { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }, overflow: 'linebreak' as const, minCellHeight: 8, valign: 'middle' as const };
  return { fontSize: 7.5, cellPadding: { top: 1, bottom: 1, left: 1.5, right: 1.5 }, overflow: 'linebreak' as const, minCellHeight: 6, valign: 'middle' as const };
};

const checkPageBreak = (pdf: jsPDF, currentY: number, requiredHeight: number = 20): number => {
  if (currentY > 282 - requiredHeight) { pdf.addPage(); return 15; }
  return currentY;
};

export const exportPerformanceToPdf = async (performance: Performance, eventFrame: EventFrame) => {
  const defaultOptions: PerformancePdfOptions = { includeBasicInfo: true, includeInputs: true, includeMonitors: true, includeCable: true, includeSpare: true, includeTechnicalNotes: true, includeHospitality: true, includeGeneralNotes: true, showEmptySections: false };
  return generatePerformancePdfObjectWithOptions(performance, eventFrame, defaultOptions);
};

// =============================================================================
// GENERACIÓ DEFINITIVA RIDER
// =============================================================================
export const generatePerformancePdfObjectWithOptions = (performance: Performance, eventFrame: EventFrame, options: PerformancePdfOptions): jsPDF => {
  const orientation = options.pdfOrientation || 'portrait';
  const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
  const { sane, headStyles, labelStyles } = getPerformanceStyles();
  const densityStyles = getTableDensityStyles(orientation);
  let y = 15;
  const mainTitle = `${i18next.t('pdf.performance_rider_title')} - ${performance.name}`;

  // 1. Capçalera
  const headerBody = options.includeBasicInfo 
    ? [[{ content: mainTitle, colSpan: 2, styles: { halign: 'center' as const, fontSize: 12, fontStyle: 'bold' as const, fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), cellPadding: 2 } }], [{ content: i18next.t('pdf.event_name'), styles: labelStyles }, sane(eventFrame.name)], [{ content: i18next.t('pdf.location'), styles: labelStyles }, sane(eventFrame.place)], [{ content: i18next.t('pdf.date'), styles: labelStyles }, formatDateRangeDMY(eventFrame.startDate, eventFrame.endDate)]]
    : [[{ content: mainTitle, styles: { halign: 'center' as const, fontSize: 12, fontStyle: 'bold' as const, fillColor: hslToRgb(...themeHslColors.grayDark), textColor: hslToRgb(...themeHslColors.foregroundWhite), cellPadding: 2 } }]];
  
  autoTable(pdf, { body: headerBody, theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 8 }, tableWidth: 'wrap' });
  y = (pdf as any).lastAutoTable.finalY + 5;

  // 2. Info Artista
  if (options.includeBasicInfo) {
    y = checkPageBreak(pdf, y, 40);
    autoTable(pdf, { body: [[{ content: i18next.t('pdf.artist_info'), colSpan: 2, styles: headStyles }], [{ content: i18next.t('pdf.artist_name'), styles: labelStyles }, sane(performance.name)], [{ content: i18next.t('pdf.artist_type'), styles: labelStyles }, sane(performance.type)], [{ content: i18next.t('pdf.contact_name'), styles: labelStyles }, sane(performance.contactName)], [{ content: i18next.t('pdf.contact_phone'), styles: labelStyles }, sane(performance.contactPhone)], [{ content: i18next.t('pdf.contact_email'), styles: labelStyles }, sane(performance.contactEmail)], [{ content: i18next.t('pdf.status'), styles: labelStyles }, sane(performance.status)]], theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 8 }, tableWidth: 'wrap' });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // 3. Horaris
  if (options.includeBasicInfo) {
    y = checkPageBreak(pdf, y, 30);
    autoTable(pdf, { body: [[{ content: i18next.t('pdf.schedule'), colSpan: 2, styles: headStyles }], [{ content: i18next.t('pdf.arrival_time'), styles: labelStyles }, sane(performance.arrivalTime)], [{ content: i18next.t('pdf.soundcheck_time'), styles: labelStyles }, sane(performance.soundCheckTime)], [{ content: i18next.t('pdf.show_time'), styles: labelStyles }, sane(performance.showTime)], [{ content: i18next.t('pdf.departure_time'), styles: labelStyles }, sane(performance.departureTime)], [{ content: i18next.t('pdf.duration'), styles: labelStyles }, sane(performance.duration)]], theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 8 }, tableWidth: 'wrap' });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // 4. Input List
  if (options.includeInputs && performance.techData?.inputList?.length) {
    y = checkPageBreak(pdf, y, 50);
    const cols = options.inputColumns || { patch: true, channel: true, label: true, rider: true, contra: true, stand: true, notes: true, exclusive: true };
    const colsWithData = { patch: cols.patch && performance.techData.inputList.some(i => i.patchNumber), channel: cols.channel && performance.techData.inputList.some(i => i.channel), label: cols.label && performance.techData.inputList.some(i => i.label), rider: cols.rider && performance.techData.inputList.some(i => i.micRider), contra: cols.contra && performance.techData.inputList.some(i => i.micContra), stand: cols.stand && performance.techData.inputList.some(i => i.stand), notes: cols.notes && performance.techData.inputList.some(i => i.extres), exclusive: cols.exclusive && performance.techData.inputList.some(i => i.exclusive) };
    const optW = calculateOptimalColumnWidths(colsWithData, performance.techData.inputList, orientation);
    
    const head: any[] = []; const cStyles: any = {}; let cIdx = 0;
    const patchColorMap: any = { red:[239, 68, 68], blue: [59, 130, 246], green:[34, 197, 94], yellow:[250, 204, 21], orange:[249, 115, 22], purple: [168, 85, 247], brown: [180, 83, 9] };
    
    const columnDefinitions = [
      { key: 'patch', label: i18next.t('pdf.patch') },
      { key: 'channel', label: i18next.t('pdf.channel') },
      { key: 'label', label: i18next.t('pdf.label') },
      { key: 'rider', label: i18next.t('pdf.mic_rider') },
      { key: 'contra', label: i18next.t('pdf.mic_contra') },
      { key: 'stand', label: i18next.t('pdf.stand') },
      { key: 'notes', label: i18next.t('pdf.notes') },
      { key: 'exclusive', label: i18next.t('pdf.exclusive') }
    ];

    columnDefinitions.forEach(col => {
      if (colsWithData[col.key as keyof typeof colsWithData]) {
        head.push(col.label);
        cStyles[cIdx++] = optW[col.key];
      }
    });

    autoTable(pdf, {
      head: [[{ content: i18next.t('pdf.input_list'), colSpan: head.length, styles: headStyles }], head],
      body: performance.techData.inputList.map(i => {
        const r: any[] = []; 
        if (colsWithData.patch) {
          const hasC = i.patchColor && i.patchColor !== 'transparent';
          r.push({ content: sane(i.patchNumber), styles: { cellPadding: { left: hasC ? 6 : 1.5, top: 0.8, bottom: 0.8, right: 1 } }, customColor: i.patchColor });
        }
        if (colsWithData.channel) r.push(sane(i.channel)); 
        if (colsWithData.label) r.push(sane(i.label)); 
        if (colsWithData.rider) r.push(sane(i.micRider)); 
        if (colsWithData.contra) r.push(sane(i.micContra)); 
        if (colsWithData.stand) r.push(sane(i.stand)); 
        if (colsWithData.notes) r.push(sane(i.extres)); 
        if (colsWithData.exclusive) r.push(i.exclusive ? '✓' : '');
        return r;
      }),
      startY: y, theme: 'grid', headStyles, columnStyles: cStyles, margin: { left: 10, right: 10 },
      didDrawCell: (d) => { if (d.section === 'body' && d.column.index === 0 && colsWithData.patch) { const raw = d.cell.raw as any; if (raw?.customColor && patchColorMap[raw.customColor]) { pdf.setFillColor(...(patchColorMap[raw.customColor] as [number, number, number])); pdf.circle(d.cell.x + 2.5, d.cell.y + (d.cell.height / 2), 1.5, 'F'); } } },
      styles: { ...densityStyles }
    });
    y = (pdf as any).lastAutoTable.finalY + 5;
  }

  // 5. Monitor List
  if (options.includeMonitors && performance.techData?.monitorList?.length) {
    y = checkPageBreak(pdf, y, 50);
    const mCols = options.monitorColumns || { patch: true, outputChannel: true, label: true, rider: true, contra: true, stand: true, notes: true, exclusive: true };
    const mColsWithData = { patch: mCols.patch && performance.techData.monitorList.some(i => i.patchNumber), outputChannel: mCols.outputChannel && performance.techData.monitorList.some(i => i.outputChannel), label: mCols.label && performance.techData.monitorList.some(i => i.label), rider: mCols.rider && performance.techData.monitorList.some(i => i.mixRider), contra: mCols.contra && performance.techData.monitorList.some(i => i.mixContra), stand: mCols.stand && performance.techData.monitorList.some(i => i.mixStand), notes: mCols.notes && performance.techData.monitorList.some(i => i.notes), exclusive: mCols.exclusive && performance.techData.monitorList.some(i => i.exclusive) };
    const mOptW = calculateOptimalColumnWidths(mColsWithData, performance.techData.monitorList, orientation);
    
    const mHead: any[] = []; const mcStyles: any = {}; let mcIdx = 0;
    const patchColorMap: any = { red:[239, 68, 68], blue: [59, 130, 246], green:[34, 197, 94], yellow:[250, 204, 21], orange:[249, 115, 22], purple: [168, 85, 247], brown: [180, 83, 9] };

    const mColumnDefinitions = [
      { key: 'patch', label: i18next.t('pdf.patch') },
      { key: 'outputChannel', label: i18next.t('pdf.output_channel') },
      { key: 'label', label: i18next.t('pdf.label') },
      { key: 'rider', label: i18next.t('pdf.monitor_rider') },
      { key: 'contra', label: i18next.t('pdf.monitor_contra') },
      { key: 'stand', label: i18next.t('pdf.monitor_stand') },
      { key: 'notes', label: i18next.t('pdf.notes') },
      { key: 'exclusive', label: i18next.t('pdf.exclusive') }
    ];

    mColumnDefinitions.forEach(col => {
      if (mColsWithData[col.key as keyof typeof mColsWithData]) {
        mHead.push(col.label);
        mcStyles[mcIdx++] = mOptW[col.key];
      }
    });

    if (mHead.length) {
      autoTable(pdf, {
        head: [[{ content: i18next.t('pdf.monitor_list'), colSpan: mHead.length, styles: headStyles }], mHead],
        body: performance.techData.monitorList.map(i => {
          const r: any[] = []; 
          if (mColsWithData.patch) {
            const hasC = i.patchColor && i.patchColor !== 'transparent';
            r.push({ content: sane(i.patchNumber), styles: { cellPadding: { left: hasC ? 6 : 1.5, top: 0.8, bottom: 0.8, right: 1 } }, customColor: i.patchColor });
          }
          if (mColsWithData.outputChannel) r.push(sane(i.outputChannel)); 
          if (mColsWithData.label) r.push(sane(i.label)); 
          if (mColsWithData.rider) r.push(sane(i.mixRider)); 
          if (mColsWithData.contra) r.push(sane(i.mixContra)); 
          if (mColsWithData.stand) r.push(sane(i.mixStand)); 
          if (mColsWithData.notes) r.push(sane(i.notes)); 
          if (mColsWithData.exclusive) r.push(i.exclusive ? '✓' : '');
          return r;
        }),
        startY: y, theme: 'grid', headStyles, columnStyles: mcStyles, margin: { left: 10, right: 10 },
        didDrawCell: (d) => { if (d.section === 'body' && d.column.index === 0 && mColsWithData.patch) { const raw = d.cell.raw as any; if (raw?.customColor && patchColorMap[raw.customColor]) { pdf.setFillColor(...(patchColorMap[raw.customColor] as [number, number, number])); pdf.circle(d.cell.x + 2.5, d.cell.y + (d.cell.height / 2), 1.5, 'F'); } } },
        styles: { ...densityStyles }
      });
      y = (pdf as any).lastAutoTable.finalY + 5;
    }
  }

  // 6. Cablejat i Spare
  if (options.includeCable && performance.techData?.cableList?.length) {
    y = checkPageBreak(pdf, y, 25);
    autoTable(pdf, { head: [[{ content: i18next.t('pdf.cable_list'), colSpan: 3, styles: headStyles }], [i18next.t('pdf.qty'), i18next.t('pdf.material'), i18next.t('pdf.notes')]], body: performance.techData.cableList.map(i => [(i.qty || 1).toString(), sane(i.itemName), sane(i.notes)]), startY: y, theme: 'grid', styles: { fontSize: 7.5, cellPadding: 1 }, headStyles, columnStyles: { 0: { cellWidth: 15, halign: 'center' } }, margin: { left: 10, right: 10 }, tableWidth: 'wrap' });
    y = (pdf as any).lastAutoTable.finalY + 3;
  }
  if (options.includeSpare && performance.techData?.spareList?.length) {
    y = checkPageBreak(pdf, y, 25);
    autoTable(pdf, { head: [[{ content: i18next.t('pdf.spare_list'), colSpan: 3, styles: headStyles }], [i18next.t('pdf.qty'), i18next.t('pdf.material'), i18next.t('pdf.notes')]], body: performance.techData.spareList.map(i => [(i.qty || 1).toString(), sane(i.itemName), sane(i.notes)]), startY: y, theme: 'grid', styles: { fontSize: 7.5, cellPadding: 1 }, headStyles, columnStyles: { 0: { cellWidth: 15, halign: 'center' } }, margin: { left: 10, right: 10 }, tableWidth: 'wrap' });
    y = (pdf as any).lastAutoTable.finalY + 3;
  }

  // 7. Notes Tècniques i Hospitality
  if (options.includeTechnicalNotes) {
    const tN = [];
    if (performance.techData?.lightingNotes) tN.push([{ content: i18next.t('pdf.lighting_notes'), styles: labelStyles }, sane(performance.techData.lightingNotes)]);
    if (performance.techData?.videoNotes) tN.push([{ content: i18next.t('pdf.video_notes'), styles: labelStyles }, sane(performance.techData.videoNotes)]);
    if (performance.techData?.stageRequirements) tN.push([{ content: i18next.t('pdf.stage_requirements'), styles: labelStyles }, sane(performance.techData.stageRequirements)]);
    if (tN.length) {
      y = checkPageBreak(pdf, y, 30); tN.unshift([{ content: i18next.t('pdf.technical_notes'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, { body: tN, theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 7.5 }, tableWidth: 'wrap' });
      y = (pdf as any).lastAutoTable.finalY + 3;
    }
  }
  if (options.includeHospitality) {
    const hN = [];
    if (performance.hospitalityData?.dressingRooms) hN.push([{ content: i18next.t('pdf.dressing_rooms'), styles: labelStyles }, sane(performance.hospitalityData.dressingRooms)]);
    if (performance.hospitalityData?.cateringNotes) hN.push([{ content: i18next.t('pdf.catering'), styles: labelStyles }, sane(performance.hospitalityData.cateringNotes)]);
    if (performance.hospitalityData?.dietaryRequirements) hN.push([{ content: i18next.t('pdf.dietary_requirements'), styles: labelStyles }, sane(performance.hospitalityData.dietaryRequirements)]);
    if (performance.hospitalityData?.travelLogistics) hN.push([{ content: i18next.t('pdf.travel_logistics'), styles: labelStyles }, sane(performance.hospitalityData.travelLogistics)]);
    if (performance.hospitalityData?.parkingNotes) hN.push([{ content: i18next.t('pdf.parking'), styles: labelStyles }, sane(performance.hospitalityData.parkingNotes)]);
    if (hN.length) {
      y = checkPageBreak(pdf, y, 30); hN.unshift([{ content: i18next.t('pdf.hospitality'), colSpan: 2, styles: headStyles }]);
      autoTable(pdf, { body: hN, theme: 'grid', startY: y, margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 7.5 }, tableWidth: 'wrap' });
      y = (pdf as any).lastAutoTable.finalY + 3;
    }
  }

  // 8. Notes Generals
  if (options.includeGeneralNotes && performance.notes) {
    y = checkPageBreak(pdf, y, 20);
    autoTable(pdf, { head: [[{ content: i18next.t('pdf.general_notes'), styles: headStyles }]], body: [[sane(performance.notes)]], startY: y, theme: 'grid', margin: { left: 10, right: 10 }, styles: { cellPadding: 1, fontSize: 7.5 }, tableWidth: 'wrap' });
    y = (pdf as any).lastAutoTable.finalY + 3;
  }

  // 9. Balanç Consolidat
  if (options.showBalance !== false && options.balanceData?.length) {
    const translateSection = (s: string) => { switch(s) { case 'Inputs': return i18next.t('pdf.inputs'); case 'Monitors': return i18next.t('pdf.monitors'); case 'Cablejat': return i18next.t('pdf.cable_list'); case 'Material Spare': return i18next.t('pdf.spare_list'); default: return s; } };
    const bData: any[] = []; let curS = '';
    options.balanceData.forEach(i => {
      if (i.section !== curS) { bData.push([{ content: translateSection(i.section), colSpan: 4, styles: { ...headStyles, fillColor: hslToRgb(...themeHslColors.primary) } }]); curS = i.section; }
      bData.push([sane(i.name), sane(i.location), i.qty.toString(), `${i.available} / ${i.total}`]);
    });
    y = checkPageBreak(pdf, y, 30);
    autoTable(pdf, { head: [[{ content: i18next.t('pdf.balance_title'), colSpan: 4, styles: headStyles }], [i18next.t('pdf.material'), i18next.t('pdf.location'), i18next.t('pdf.quantity'), i18next.t('pdf.stock_balance')]], body: bData, startY: y, theme: 'grid', styles: { fontSize: 7.5, cellPadding: 1 }, headStyles, columnStyles: { 0: { cellWidth: orientation === 'landscape' ? 120 : 80 }, 1: { cellWidth: orientation === 'landscape' ? 80 : 60 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 30, halign: 'center' } }, margin: { left: 10, right: 10 }, tableWidth: 'wrap' });
  }

  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { pdf.setPage(i); addFooter(pdf, i); }
  return pdf;
};

// =============================================================================
// VALIDACIÓ
// =============================================================================
export const exportPerformanceToPdfWithOptions = async (performance: Performance, eventFrame: EventFrame, options: PerformancePdfOptions, showToast: ShowToastFunction) => {
  try {
    const validation = validatePerformanceData(performance);
    if (!validation.isValid) { validation.errors.forEach(e => showToast(e, 'error')); return; }
    validation.warnings.forEach(w => showToast(w, 'info'));
    const pdf = generatePerformancePdfObjectWithOptions(performance, eventFrame, options);
    const fileName = `${performance.name.replace(/[^a-zA-Z0-9]/g, '_')}_Rider.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) { showToast(`Error: ${(error as Error).message}`, 'error'); }
};
