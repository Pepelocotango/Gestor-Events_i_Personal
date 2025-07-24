import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction, EventFrame, Assignment } from '../types';
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

// --- EXPORTACIÓ DE RESUMS ---
export const exportSummariesToPdf = (
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
                ? `Mixt (${getStatusSummaryText(a.assignmentObject)})` // <<< CORREGIT: Eliminat el segon paràmetre 'true'
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
    pdf.save(fileName);
    showToast('Resum exportat a PDF amb èxit!', 'success');

  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};


// --- EXPORTACIó DE LLISTA DE MATERIAL ---
export const exportMaterialToPdf = (materialItems: MaterialItem[], showToast: ShowToastFunction) => {
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
    pdf.save(fileName);
    showToast('Llista de material exportada a PDF!', 'success');
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};


// --- EXPORTACIÓ DE LLIBRETA D'ADRECES ---
export const exportPeopleToPdf = (peopleGroups: PersonGroup[], showToast: ShowToastFunction) => {
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
    pdf.save(fileName);
    showToast("Llibreta d'adreces exportada a PDF!", 'success');
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};

// --- FITXA TÈCNICA (Refactoritzada amb jspdf-autotable) ---
export const exportTechSheetToPdf = (
  formData: TechSheetData,
  eventName: string,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let pageCount = 1;

    const headStyles = {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    };
    const labelStyles = {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
    };

    // --- TAULA D'INFORMACIÓ GENERAL ---
    autoTable(pdf, {
      body: [
        [{ content: 'FITXA DE BOLO', styles: { halign: 'center', fontSize: 16, fontStyle: 'bold' } }, { content: '', styles: { } }],
        [{ content: 'NOM DEL BOLO:', styles: labelStyles }, formData.eventName],
        [{ content: 'LLOC:', styles: labelStyles }, formData.location || '-'],
        [{ content: 'DATA:', styles: labelStyles }, formData.date || '-'],
        [{ content: 'HORA:', styles: labelStyles }, formData.showTime || '-'],
        [{ content: 'DURADA:', styles: labelStyles }, formData.showDuration || '-'],
        [{ content: 'PÀRQUING:', styles: labelStyles }, formData.parkingInfo || '-'],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        addFooter(pdf, pageCount);
      }
    });

    // --- TAULA DE PERSONAL TÈCNIC ---
    const technicalBody: any[] = [
      [{ content: 'PERSONAL TÈCNIC', colSpan: 2, styles: headStyles }],
    ];
    if (formData.technicalProviders.length > 0) {
      formData.technicalProviders.forEach(provider => {
        const person = getPersonGroupById(provider.personGroupId);
        technicalBody.push([{ content: `Proveïdor: ${person?.name || 'No seleccionat'}`, colSpan: 2, styles: { fontStyle: 'bold' } }]);
        provider.roles.forEach(roleItem => {
          const notes = roleItem.notes ? `(${roleItem.notes})` : '';
          technicalBody.push([
            { content: `${roleItem.quantity} x ${roleItem.role}`, styles: { cellPadding: {left: 8} } },
            { content: notes, styles: { halign: 'left' } }
          ]);
        });
      });
    } else {
      technicalBody.push([{ content: 'Cap proveïdor de personal definit.', colSpan: 2, styles: { fontStyle: 'italic' } }]);
    }
    autoTable(pdf, {
      body: technicalBody,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 80 } },
      didDrawPage: (data) => {
        if(data.pageNumber > pageCount) pageCount = data.pageNumber;
        addFooter(pdf, pageCount);
      }
    });

    // --- TAULA D'HORARIS ---
    const scheduleBody: any[] = [
        [{ content: 'PREMUNTATGE I HORARIS', colSpan: 2, styles: headStyles }],
    ];
    if (formData.preAssemblySchedule) {
        scheduleBody.push([{ content: 'Premuntatge:', styles: labelStyles }, formData.preAssemblySchedule]);
    }
    formData.assemblySchedule.forEach(item => {
        scheduleBody.push([{ content: item.time, styles: labelStyles }, item.description]);
    });
    autoTable(pdf, {
        body: scheduleBody,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 40 } },
        didDrawPage: (data) => {
          if(data.pageNumber > pageCount) pageCount = data.pageNumber;
          addFooter(pdf, pageCount);
        }
    });

    // --- TAULA DE LOGÍSTICA ---
    autoTable(pdf, {
      body: [
        [{ content: 'LOGÍSTICA', colSpan: 2, styles: headStyles }],
        [{ content: 'Camerinos:', styles: labelStyles }, formData.dressingRooms || '-'],
        [{ content: 'Actors:', styles: labelStyles }, `${formData.actorsNumber || ''} ${formData.actors || ''}`.trim() || '-'],
        [{ content: 'Tècnics/Producció Cia:', styles: labelStyles }, `${formData.companyTechniciansNumber || ''} ${formData.companyTechnicians || ''}`.trim() || '-'],
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 40 } },
      didDrawPage: (data) => {
        if(data.pageNumber > pageCount) pageCount = data.pageNumber;
        addFooter(pdf, pageCount);
      }
    });

    // --- TAULA DE NECESSITATS TÈCNIQUES ---
    const needsBody: any[] = [
      [{ content: 'NECESSITATS TÈCNIQUES', colSpan: 3, styles: headStyles }],
    ];
    const addNeedsToBody = (title: string, needs: any[]) => {
      if (needs.length > 0) {
        needsBody.push([{ content: title, colSpan: 3, styles: { ...labelStyles, fontStyle: 'bold' } }]);
        needs.forEach(n => {
          needsBody.push([
            { content: n.quantity.toString(), styles: { halign: 'right' } },
            n.description,
            n.origin || 'N/D'
          ]);
        });
      }
    };
    addNeedsToBody('Il·luminació', formData.lightingNeeds);
    if (formData.videoDetails || formData.videoNeeds.length > 0) {
        needsBody.push([{ content: 'Vídeo', colSpan: 3, styles: { ...labelStyles, fontStyle: 'bold' } }]);
        if (formData.videoDetails) {
            needsBody.push([{ content: formData.videoDetails, colSpan: 3 }]);
        }
        addNeedsToBody('', formData.videoNeeds);
    }
    addNeedsToBody('So', formData.soundNeeds);
    addNeedsToBody('Maquinària', formData.machineryNeeds);

    autoTable(pdf, {
      head: [['Qt.', 'Descripció', 'Origen']],
      body: needsBody,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: headStyles,
      columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 40 } },
      didDrawPage: (data) => {
        if(data.pageNumber > pageCount) pageCount = data.pageNumber;
        addFooter(pdf, pageCount);
      }
    });

    // --- TAULA D'ALTRES DETALLS I CONTACTE ---
    autoTable(pdf, {
        body: [
            [{ content: 'ALTRES DETALLS I CONTACTE', colSpan: 2, styles: headStyles }],
            [{ content: 'Control a:', styles: labelStyles }, formData.controlLocation || '-'],
            [{ content: "Material d'altres equipaments:", styles: labelStyles }, formData.otherEquipment || '-'],
            [{ content: 'Lloguers:', styles: labelStyles }, formData.rentals || '-'],
            [{ content: 'Plànols:', styles: labelStyles }, formData.blueprints || '-'],
            [{ content: 'Contacte Companyia:', styles: labelStyles }, formData.companyContact || '-'],
            [{ content: 'Observacions:', styles: labelStyles }, formData.observations || '-'],
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 0: { cellWidth: 60 } },
        didDrawPage: (data) => {
            if(data.pageNumber > pageCount) pageCount = data.pageNumber;
            addFooter(pdf, pageCount);
        }
    });

    // --- DESA EL PDF ---
    const fileName = `Fitxa_Bolo_${eventName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    pdf.save(fileName);
    showToast('PDF generat amb èxit!', 'success');
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};
// --- EXPORTACIÓ DE LLISTA D'ESDEVENIMENTS ---
export const exportEventListToPdf = (
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
            // Afegeix les notes de l'assignació si existeixen
            const notesLine = a.notes ? `  └ Nota: ${a.notes}` : '';
            return [personLine, notesLine].filter(Boolean).join('\n');
          }).join('\n\n') // Doble salt de línia entre persones
        : 'Sense assignacions';

      const statusText = ef.personnelComplete ? 'Complet' : 'Incomplet';

      return [
        ef.name,
        ef.place || '-',
        formatDateRangeDMY(ef.startDate, ef.endDate),
        personnelText,
        statusText,
        ef.generalNotes || '-' // Afegim la nova columna
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
        3: { cellWidth: 85 }, // Més amplada per a personal i notes
        5: { cellWidth: 60 }  // Amplada per a les notes generals
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
    pdf.save(fileName);
    showToast("Llista d'esdeveniments exportada a PDF!", 'success');
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};