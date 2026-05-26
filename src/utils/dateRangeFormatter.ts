/**
 * =============================================================================
 * DATE RANGE FORMATTER
 * =============================================================================
 * DESCRIPCIÓ:
 * Utilitats per formatar llistes de dates en rangs compactes (ex: 14/05-15/05).
 *
 * ÍNDEX:
 * - FUNCIONS AUXILIARS: formatSimpleDM, areDatesConsecutive.
 * - FORMAT DE RANGS DE DATES: formatDateRanges per convertir llistes en rangs.
 * =============================================================================
 */

const formatSimpleDM = (dateStr: string): string => {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
};

/**
 * Comprova si dues dates són consecutives.
 */
const areDatesConsecutive = (dateStr1: string, dateStr2: string): boolean => {
  const d1 = new Date(dateStr1);
  d1.setUTCHours(0, 0, 0, 0); // Assegurem que no hi ha problemes de zona horària
  d1.setDate(d1.getDate() + 1);
  return d1.toISOString().split('T')[0] === dateStr2;
}

/**
 * Converteix una llista de dates (YYYY-MM-DD) en una cadena de rangs compacta.
 * Ex: ['2025-05-14', '2025-05-15', '2025-05-17'] -> "14/05-15/05, 17/05"
 */
export const formatDateRanges = (dates: string[]): string => {
  if (!dates || dates.length === 0) {
    return '';
  }

  // Assegurem que les dates estan ordenades
  const sortedDates = [...dates].sort();
  
  const ranges: string[] = [];
  let i = 0;
  while (i < sortedDates.length) {
    let rangeStart = sortedDates[i];
    let rangeEnd = sortedDates[i];
    let j = i;

    while (j + 1 < sortedDates.length && areDatesConsecutive(sortedDates[j], sortedDates[j + 1])) {
      rangeEnd = sortedDates[j + 1];
      j++;
    }

    if (rangeStart === rangeEnd) {
      ranges.push(formatSimpleDM(rangeStart));
    } else {
      ranges.push(`${formatSimpleDM(rangeStart)}-${formatSimpleDM(rangeEnd)}`);
    }
    
    i = j + 1;
  }
  
  return ranges.join(', ');
};
