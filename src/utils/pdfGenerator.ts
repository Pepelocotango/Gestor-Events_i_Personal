import jsPDF from 'jspdf';
import autoTable, { Styles } from 'jspdf-autotable';
import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, Assignment, NeedItem } from '../types';
import { formatDateDMY, formatDateRangeDMY } from './dateFormat';
import { getStatusSummaryText } from './statusUtils';


// Funció genèrica per crear una capçalera i títol
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
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, `Resum: ${title}`);
    let pageCount = 1;

    const addPageIfNeeded = (currentY: number) => {
      if (currentY > 270) {
        addFooter(pdf, pageCount);
        pdf.addPage();
        pageCount++;
        return 20; // Y inicial per a la nova pàgina
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
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          didDrawPage: (_data: any) => {
            addFooter(pdf, pageCount);
          },
          margin: { top: 15, bottom: 15 }
        });

        y = (pdf as any).lastAutoTable.finalY + 10;
      });
    }

    const fileName = `Resum_${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
      body.push([{ content: category, colSpan: 4, styles: { fontStyle: 'bold', fillColor: '#e0e0e0', textColor: '#000000' } }]);
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
      headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' },
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
      headStyles: { fillColor: [243, 156, 18], textColor: 255, fontStyle: 'bold' },
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
    let y = 15;

    const sane = (value: any): string => (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '--') ? '-' : String(value);
    const headStyles: Partial<Styles> = { fillColor: [64, 64, 64], textColor: [255, 255, 255], fontStyle: 'bold' };
    const labelStyles: Partial<Styles> = { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', cellWidth: 50 };
    const subHeadStyles: Partial<Styles> = { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' };

    const checkPageBreak = (currentY: number): number => {
        if (currentY > 260) {
            pdf.addPage();
            return 15;
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
    y = (pdf as any).lastAutoTable.finalY + 8;

    // --- General Notes ---
    if (formData.showGeneralNotesInPdf && sane(formData.generalNotes) !== '-') {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'NOTES GENERALS DE LA FITXA', styles: headStyles }]],
            body: [[sane(formData.generalNotes)]],
            startY: y, theme: 'grid', pageBreak: 'avoid'
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Parking ---
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

    // --- Personal Tècnic ---
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
        autoTable(pdf, {
            head: [[{ content: 'PERSONAL TÈCNIC', colSpan: 4, styles: headStyles }]],
            body: [['Qt.', 'Càrrec', 'Proveïdor/a o Empresa', 'Notes'], ...personnelBody],
            startY: y, theme: 'grid', pageBreak: 'avoid',
            headStyles: { ...headStyles, halign: 'center' as 'center' },
            columnStyles: { 0: { cellWidth: 15, halign: 'right' as 'right' }, 3: {cellWidth: 'auto'} }
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Premuntatge ---
    if (formData.preAssembly?.status === 'yes') {
        y = checkPageBreak(y);
        autoTable(pdf, {
            head: [[{ content: 'PREMUNTATGE', styles: headStyles }]],
            body: [[sane(formData.preAssembly.details)]],
            startY: y, theme: 'grid', pageBreak: 'avoid',
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Horaris ---
    if (formData.schedule?.status === 'yes' && formData.schedule.data && formData.schedule.data.length > 0) {
        y = checkPageBreak(y);
        const scheduleBody = formData.schedule.data.map(item => {
            const timeRange = [sane(item.time), sane(item.timeEnd)].filter(t => t !== '-').join(' - ');
            return [formatDateDMY(sane(item.date)), timeRange, sane(item.description)];
        });
        autoTable(pdf, {
            head: [[{ content: 'HORARIS', colSpan: 3, styles: headStyles }]],
            body: [['Data', 'Hores', 'Descripció'], ...scheduleBody],
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Logística ---
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
            body: [['Ítem', 'Quantitat/Detalls', 'Noms/Notes'], ...logisticsBody],
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Necessitats Tècniques ---
    const needsBody: any[][] = [];
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
            body: [['Qt.', 'Descripció', 'Origen'], ...needsBody],
            startY: y, theme: 'grid', pageBreak: 'avoid',
            columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
        });
        y = (pdf as any).lastAutoTable.finalY + 8;
    }

    // --- Altres Detalls ---
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

    // --- Contacte i Observacions ---
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
            body: [['Nom', 'Càrrec', 'Contacte'], ...contactBody],
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

    const fileName = `Fitxa_Bolo_${eventName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- EXPORTACIÓ DE LLISTA D'ESDEVENIMENTS ---
export const exportEventListToPdf = async (
  eventFrames: EventFrame[],
  peopleGroups: PersonGroup[],
  showToast: ShowToastFunction
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
      headStyles: { fillColor: [75, 85, 99], textColor: 255, fontStyle: 'bold' },
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

    const fileName = `Llista_Esdeveniments_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePdfWithDialog(pdf, fileName, showToast);
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};