import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { PersonGroup, SummaryRow, MaterialItem, TechSheetData, ShowToastFunction } from '../types';
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


// --- EXPORTACIÓ DE LLISTA DE MATERIAL ---
export const exportMaterialToPdf = (materialItems: MaterialItem[], showToast: ShowToastFunction) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = createPdfHeader(pdf, 'Llista de Material');
    let pageCount = 1;

    const head = [['Nom', 'Categoria', 'Estoc', 'Ubicació', 'Notes']];
    const body = materialItems.map(item => [
      item.name,
      item.category,
      item.stock.toString(),
      item.location || '-',
      item.notes || '-'
    ]);

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

// --- FITXA TÈCNICA (Codi original adaptat) ---
export const exportTechSheetToPdf = (
  formData: TechSheetData,
  eventName: string,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
  showToast: ShowToastFunction
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let y = 15;
    const left = 12;
    const right = pdf.internal.pageSize.getWidth() - left;
    const lineSpacing = 6;
    const sectionSpacing = 8;
    const subSectionSpacing = 4;

    const addLine = (txt: string, size = 10, style = 'normal', indent = 0) => {
      if (y > 280) { // Marge inferior per canvi de pàgina
        pdf.addPage();
        y = 15;
      }
      pdf.setFontSize(size);
      pdf.setFont('helvetica', style);
      pdf.text(txt, left + indent, y, { maxWidth: right - left - indent });
      y += lineSpacing;
    };

    const addSectionTitle = (title: string) => {
      y += sectionSpacing / 2;
      addLine(title, 13, 'bold');
      y += subSectionSpacing / 2;
    };

    // --- CAPÇALERA ---
    pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
    pdf.text(`Fitxa Tècnica - ${formData.eventName}`, left, y); y += 10;

    // --- INFORMACIÓ GENERAL ---
    pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
    pdf.text(`Lloc: ${formData.location || '-'}`, left, y);
    pdf.text(`Data: ${formData.date || '-'}`, right - 60, y); y += lineSpacing;
    pdf.text(`Hora: ${formData.showTime || '-'}`, left, y);
    pdf.text(`Durada: ${formData.showDuration || '-'}`, right - 60, y); y += lineSpacing;
    if (formData.parkingInfo) {
      pdf.text(`Pàrquing: ${formData.parkingInfo}`, left, y); y+= lineSpacing;
    }

    // --- PERSONAL TÈCNIC ---
    addSectionTitle('Personal Tècnic');
    if (formData.technicalProviders.length > 0) {
      formData.technicalProviders.forEach(provider => {
        const person = getPersonGroupById(provider.personGroupId);
        addLine(`Proveïdor: ${person?.name || 'No seleccionat'}`, 11, 'bold');
        if (provider.roles.length > 0) {
          provider.roles.forEach(roleItem => {
            const notes = roleItem.notes ? `(${roleItem.notes})` : '';
            addLine(`${roleItem.quantity} x ${roleItem.role} ${notes}`, 10, 'normal', 5);
          });
        }
        y += subSectionSpacing;
      });
    } else {
      addLine('Cap proveïdor de personal definit.', 10, 'italic');
    }

    // --- HORARIS ---
    addSectionTitle('Premuntatge i Horaris');
    if (formData.preAssemblySchedule) {
      addLine(`Premuntatge: ${formData.preAssemblySchedule}`, 10);
    }
    if (formData.assemblySchedule.length > 0) {
      formData.assemblySchedule.forEach(item => {
        addLine(`${item.time}: ${item.description}`, 10, 'normal', 5);
      });
    }

    // --- LOGÍSTICA ---
    addSectionTitle('Logística');
    addLine(`Camerinos: ${formData.dressingRooms || '-'}`, 10);
    addLine(`Actors: ${formData.actorsNumber || ''} ${formData.actors || ''}`, 10);
    addLine(`Tècnics/Producció Cia: ${formData.companyTechniciansNumber || ''} ${formData.companyTechnicians || ''}`, 10);

    // --- NECESSITATS TÈCNIQUES ---
    addSectionTitle('Necessitats Tècniques');
    const printNeeds = (title: string, needs: any[]) => {
      if (needs.length > 0) {
        addLine(title, 11, 'bold');
        needs.forEach(n => {
          addLine(`${n.quantity} x ${n.description} (Origen: ${n.origin || 'N/D'})`, 10, 'normal', 5);
        });
      }
    };
    printNeeds('Il·luminació:', formData.lightingNeeds);
    if (formData.videoDetails) {
      addLine('Vídeo:', 11, 'bold');
      addLine(formData.videoDetails, 10, 'normal', 5);
    }
    printNeeds('', formData.videoNeeds);
    printNeeds('So:', formData.soundNeeds);
    printNeeds('Maquinària:', formData.machineryNeeds);

    // --- ALTRES DETALLS ---
    addSectionTitle('Altres Detalls');
    addLine(`Control a: ${formData.controlLocation || '-'}`, 10);
    if (formData.otherEquipment) addLine(`Material d'altres equipaments: ${formData.otherEquipment}`, 10);
    if (formData.rentals) addLine(`Lloguers: ${formData.rentals}`, 10);
    if (formData.blueprints) addLine(`Plànols: ${formData.blueprints}`, 10);

    // --- CONTACTE I OBSERVACIONS ---
    addSectionTitle('Contacte i Observacions');
    addLine(`Contacte Companyia: ${formData.companyContact || '-'}`, 10);
    if (formData.observations) addLine(`Observacions: ${formData.observations}`, 10);

    // --- DESA EL PDF ---
    const fileName = `Fitxa_Bolo_${eventName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    pdf.save(fileName);
    showToast('PDF generat amb èxit!', 'success');
  } catch (error) {
    showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
  }
};
