import jsPDF from 'jspdf';
import { TechSheetData } from '../types';
import { PersonGroup } from '../types';

export const exportToPdf = (
  formData: TechSheetData,
  eventName: string,
  getPersonGroupById: (id: string) => PersonGroup | undefined,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
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
