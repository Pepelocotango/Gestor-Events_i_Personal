/**
 * =============================================================================
 * DATE FORMAT
 * =============================================================================
 * DESCRIPCIÓ:
 * Funcions per al formatat de dates, hores i generació de noms de fitxer.
 *
 * ÍNDEX:
 * - FUNCIONS DE FORMAT DE DATA: formatDateDMY, formatDateRangeDMY, addDaysISO.
 * - FUNCIONS DE FORMAT D'HORA: formatTimeHHMM per normalitzar formats d'hora.
 * - GENERACIÓ DE NOMS DE FITXER: generateDefaultFileName per a còpies de seguretat.
 * =============================================================================
 */

export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format de rang de dates dd/mm/yyyy - dd/mm/yyyy
export function formatDateRangeDMY(start?: string | null, end?: string | null): string {
  const startFormatted = formatDateDMY(start);
  const endFormatted = formatDateDMY(end);
  if (startFormatted && endFormatted && startFormatted !== endFormatted) {
    return `${startFormatted} - ${endFormatted}`;
  }
  return startFormatted || '';
}

// Suma dies a una data ISO i retorna YYYY-MM-DD
export function addDaysISO(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Genera un nom de fitxer per defecte amb el format dades_GEP_dd-mm-aa_HH-MM.gep.
 * @returns Un string amb el nom del fitxer generat.
 */
export function generateDefaultFileName(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `dades_GEP_${day}-${month}-${year}_${hours}-${minutes}.gep`;
}

/**
 * Formata un string d'hora per garantir que sempre sigui HH:MM.
 * Accepta formats com "20:00", "20:00:00", "8:00" i sempre retorna "HH:MM".
 * @param timeStr - String d'hara a formatar
 * @returns String formatat com "HH:MM"
 */
export function formatTimeHHMM(timeStr: string): string {
  if (!timeStr) return '';
  
  // Separar per dos punts
  const parts = timeStr.split(':');
  
  // Agafar només hores i minuts
  const hours = parts[0] || '00';
  const minutes = parts[1] || '00';
  
  // Assegurar que tinguin 2 dígits
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}`;
}
