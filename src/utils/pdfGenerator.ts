import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, Assignment, NeedItem, MaterialControlRow } from '../types';
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
  const date = `Data d'exportació: ${formatDateDMY(new Date().toISOString())}`;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(date, pdf.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
  return 30; // Retorna la posició Y inicial per al contingut
};

// Funció genèrica per gestionar el peu de pàgina
const addFooter = (pdf: jsPDF, pageCount: number) => {
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Pàgina ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
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
      title: 'Desar PDF',
      defaultPath: defaultFileName,
      filters: [{ name: 'Documents PDF', extensions: ['pdf'] }],
      data: pdfData as any, // Pass ArrayBuffer directly
    });
    if (result.success) {
      showToast('PDF desat amb èxit!', 'success');
    } else if (!result.canceled) {
      showToast(`Error en desar el PDF: ${result.message}`, 'error');
    }
  } else {
    pdf.save(defaultFileName);
    showToast('Resum exportat a PDF amb èxit!', 'success');
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
    let y = createPdfHeader(pdf, `Resum: ${title}`);
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
      pdf.text("No hi ha dades per mostrar en aquest resum.", 14, y);
    } else {
      data.forEach((assignments, groupKey) => {
        y = addPageIfNeeded(y);

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(groupKey, 14, y);
        y += 8;

        const head = [['Esdeveniment/Persona', 'Dates', 'Estat', 'Notes']];
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
          didDrawPage: (_data: any) => {
            addFooter(pdf, pageCount);
          },
          margin: { top: 15, bottom: 15 }
        });

        y = (pdf as any).lastAutoTable.finalY + 10;
      });
    }

    const prefix = `Resum_Per_${dataType === 'event-name' ? 'Esdeveniment' : (dataType === 'start-date' ? 'Data' : 'Persona')}`;
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
    let y = createPdfHeader(pdf, 'Llista de Material');
    let pageCount = 1;

    const head = [['Nom', 'Estoc', 'Ubicació', 'Notes']];
    
    const itemsByCategory: { [key: string]: MaterialItem[] } = {};
    materialItems.forEach(item => {
      const category = item.category || 'Sense Categoria';
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
        addFooter(pdf, pageCount);
        if (_data.pageNumber > 1) {
            createPdfHeader(pdf, 'Llista de Material');
        }
      },
      margin: { top: 30, bottom: 15 }
    });

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
    let y = createPdfHeader(pdf, 'Resum de Control de Material');
    let pageCount = 1;

    const head = [['Nom', 'Origen', 'Estoc', 'Balanç', 'Demanada']];
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
          content: `Origen: ${lastOrigin}`,
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
          content: `Nota: ${row.item.notes}`,
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
        addFooter(pdf, pageCount++);
      },
      margin: { top: 30, bottom: 15 }
    });

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
    let y = createPdfHeader(pdf, 'Detall de Control de Material');
    let pageCount = 1;

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
        addFooter(pdf, pageCount++);
        pdf.addPage();
        y = createPdfHeader(pdf, 'Detall de Control de Material');
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const eventTitle = `${eventData.eventName} (${formatDateRangeDMY(eventDetails?.startDate, eventDetails?.endDate)})`;
      pdf.text(eventTitle, 14, y);
      y += 8;

      const head = [['Quantitat', 'Nom', 'Categoria', 'Origen']];
      const body = eventData.items
        .map(item => [item.quantity.toString(), item.name, item.category, item.location]);

      autoTable(pdf, {
        head,
        body,
        startY: y,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: hslToRgb(...themeHslColors.primary), textColor: hslToRgb(...themeHslColors.foregroundWhite), fontStyle: 'bold' },
        didDrawPage: (data: any) => {
            if (data.pageNumber > pageCount) {
                pageCount = data.pageNumber;
            }
        },
      });

      y = (pdf as any).lastAutoTable.finalY + 10;
    }

    const totalPages = (pdf.internal as any).getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
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
    let y = createPdfHeader(pdf, "Llibreta d'Adreces");
    let pageCount = 1;

    const head = [['Nom', 'Rol', 'Contacte', 'Notes']];
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
        addFooter(pdf, pageCount);
        if (_data.pageNumber > 1) {
            createPdfHeader(pdf, "Llibreta d'Adreces");
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const fileName = `Llibreta_Adreces_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- FITXA TÈCNICA ---
export const exportTechSheetToPdf = async (
  formData: TechSheetData,
  eventName: string,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = 10;

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
        [{ content: 'FITXA DE BOLO', colSpan: 2, styles: { halign: 'center' as 'center', fontSize: 16, fontStyle: 'bold' as 'bold' } }],
        [{ content: 'NOM DEL BOLO:', styles: labelStyles }, sane(formData.eventName)],
        [{ content: 'LLOC:', styles: labelStyles }, sane(formData.location)],
        [{ content: 'DATA:', styles: labelStyles }, sane(formData.date)],
        [{ content: 'HORA:', styles: labelStyles }, sane(formData.showTime)],
        [{ content: 'DURADA:', styles: labelStyles }, sane(formData.showDuration)],
    ];
    autoTable(pdf, { body: headerBody, theme: 'grid', startY: y, pageBreak: 'avoid' });
    y = (pdf as any).lastAutoTable.finalY + 5;

    // ... (rest of the function remains the same, just applying the color conversion)

    // Example for one section:
    if (formData.showGeneralNotesInPdf && sane(formData.generalNotes) !== '-') {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'NOTES GENERALS DE LA FITXA', styles: headStyles }]],
            body: [[sane(formData.generalNotes)]],
            startY: y, theme: 'grid', pageBreak: 'avoid'
        });
        y = (pdf as any).lastAutoTable.finalY + 5;
    }

    if (formData.parking?.status === 'yes' || formData.parking?.status === 'no') {
      y = checkPageBreak(y);
      const parkingDetails = formData.parking.status === 'yes'
          ? (sane(formData.parking.details) !== '-' ? sane(formData.parking.details) : 'SI')
          : 'NO';
      autoTable(pdf, {
          head: [[{ content: 'PÀRQUING', styles: headStyles }]],
          body: [[parkingDetails]],
          startY: y, theme: 'grid', pageBreak: 'avoid'
      });
      y = (pdf as any).lastAutoTable.finalY + 8;
    }

    const personnelBody: any[][] = [];
    if (formData.technicalProviders && formData.technicalProviders.length > 0) {
      formData.technicalProviders.forEach(provider => {
        const person = getPersonGroupById(provider.personGroupId);
        if (provider.roles && provider.roles.length > 0) {
          provider.roles.forEach(role => {
            if (sane(role.role) !== '-' || sane(role.quantity) !== '-') {
                const row = [sane(role.quantity), sane(role.role), sane(person?.name)];
                if (role.printNotes && sane(role.notes) !== '-') {
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
        if (formData.showTechnicalPersonnelNotesInPdf && sane(formData.technicalPersonnelNotes) !== '-') {
            tableBody.push([{ content: sane(formData.technicalPersonnelNotes), colSpan: 4, styles: { fontStyle: 'italic' as 'italic', halign: 'left' as 'left' } }]);
        }
        personnelBody.forEach(row => tableBody.push(row));

        autoTable(pdf, {
            head: [[{ content: 'PERSONAL TÈCNIC', colSpan: 4, styles: headStyles }]],
            body: tableBody,
            startY: y, theme: 'grid', pageBreak: 'avoid',
            headStyles: { ...headStyles, halign: 'center' as 'center' },
            columnStyles: { 0: { cellWidth: 15, halign: 'right' as 'right' }, 3: {cellWidth: 'auto'} }
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    if (formData.preAssembly?.status === 'yes') {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'PREMUNTATGE', styles: headStyles }]],
            body: [[sane(formData.preAssembly.details)]],
            startY: y, theme: 'grid', pageBreak: 'avoid',
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    if (formData.schedule?.status === 'yes' && formData.schedule.data && formData.schedule.data.length > 0) {
        y = checkPageBreak(y);

        const groupedSchedule = formData.schedule.data.reduce((acc, item) => {
            const date = item.date || 'Sense data';
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
            scheduleBody.push([{ content: `Data: ${formatDateDMY(date)}`, colSpan: 2, styles: dateSubHeadStyles }]);
            items.forEach(item => {
                const timeRange = [sane(item.time), sane(item.timeEnd)].filter(t => t !== '-').join(' - ');
                scheduleBody.push([timeRange, sane(item.description)]);
            });
        });

        autoTable(pdf, {
            head: [[{ content: 'HORARIS', colSpan: 2, styles: headStyles }]],
            body: scheduleBody,
            startY: y,
            theme: 'grid',
            pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 40 } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    const logisticsBody: any[][] = [];
    if (formData.dressingRooms?.status === 'yes') {
        logisticsBody.push(['Camerinos', sane(formData.dressingRooms.details) !== '-' ? sane(formData.dressingRooms.details) : 'SI', '']);
    }
    if (formData.actorsInfo?.status === 'yes') {
        logisticsBody.push(['Actors', sane(formData.actorsInfo.data?.number), sane(formData.actorsInfo.data?.names)]);
    }
    if (formData.techniciansInfo?.status === 'yes') {
        logisticsBody.push(['Tècnics/Prod. Cia', sane(formData.techniciansInfo.data?.number), sane(formData.techniciansInfo.data?.names)]);
    }

    if (logisticsBody.length > 0) {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'LOGÍSTICA', colSpan: 3, styles: headStyles }]],
            body: logisticsBody,
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
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
                needsBody.push([ { content: sane(n.quantity), styles: { halign: 'right' as 'right' } }, sane(n.description), sane(n.origin) ]);
            });
        }
    };

    addNeedsToBody('Il·luminació', formData.lighting);
    addNeedsToBody('So', formData.sound);
    addNeedsToBody('Vídeo', formData.video);
    addNeedsToBody('Maquinària', formData.machinery);
    addNeedsToBody('Lloguers', formData.rentals);
    addNeedsToBody("Material d'Altres Equipaments", formData.otherEquipment);
    addNeedsToBody('Infraestructures Elèctriques', formData.electrical);
    addNeedsToBody('Estructures', formData.structures);
    addNeedsToBody('Tarimes', formData.platforms);
    addNeedsToBody('Consumibles', formData.consumables);
    addNeedsToBody('Cortinatges', formData.curtains);
    addNeedsToBody('Transport', formData.transport);

    if (needsBody.length > 0) {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'NECESSITATS TÈCNIQUES', colSpan: 3, styles: headStyles }]],
            body: needsBody,
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    const otherDetailsBody = [];
    if (sane(formData.controlLocation) !== '-') otherDetailsBody.push([{ content: 'Control a:', styles: labelStyles }, sane(formData.controlLocation)]);
    if (sane(formData.blueprints) !== '-') otherDetailsBody.push([{ content: 'Plànols:', styles: labelStyles }, sane(formData.blueprints)]);
    if (otherDetailsBody.length > 0) {
      y = checkPageBreak(y);
      autoTable(pdf, {
          head: [[{ content: 'ALTRES DETALLS', colSpan: 2, styles: headStyles }]],
          body: otherDetailsBody,
          startY: y, theme: 'grid', pageBreak: 'avoid',
      });
      y = (pdf as any).lastAutoTable.finalY + 8;
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
            head: [[{ content: 'CONTACTES COMPANYIA', colSpan: 3, styles: headStyles }]],
            body: contactBody,
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 'auto' } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    if (sane(formData.observations) !== '-') {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'OBSERVACIONS', styles: headStyles }]],
            body: [[sane(formData.observations)]],
            startY: y, theme: 'grid', pageBreak: 'avoid',
        });
    }

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
    let y = createPdfHeader(pdf, "Llista d'Esdeveniments");
    let pageCount = 1;

    const head = [['Nom Esdeveniment', 'Lloc', 'Dates', 'Personal Assignat i Notes', 'Estat', 'Notes Generals']];
    const body = eventFrames.map(ef => {
      const personnelText = ef.assignments.length > 0
        ? ef.assignments.map((a: Assignment) => {
            const person = peopleGroups.find(p => p.id === a.personGroupId);
            const personLine = `${person ? person.name : 'N/A'} ${getStatusSummaryText(a)}`;
            const notesLine = a.notes ? `  └ Nota: ${a.notes}` : '';
            return [personLine, notesLine].filter(Boolean).join('\n');
          }).join('\n\n')
        : 'Sense assignacions';

      const statusText = ef.personnelComplete ? 'Complet' : 'Incomplet';

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
        addFooter(pdf, pageCount);
        if (_data.pageNumber > 1) {
            createPdfHeader(pdf, "Llista d'Esdeveniments");
        }
      },
      margin: { top: 30, bottom: 15 }
    });

    const fileName = generateFileName('Llista_Esdeveniments', activeFilters, eventFrames, 'pdf');
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};