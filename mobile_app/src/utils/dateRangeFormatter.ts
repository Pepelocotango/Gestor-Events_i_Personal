export const formatSimpleDM = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : dateStr;
};

const areDatesConsecutive = (dateStr1: string, dateStr2: string): boolean => {
  if (!dateStr1 || !dateStr2) return false;
  const d1 = new Date(dateStr1);
  d1.setHours(0, 0, 0, 0);
  d1.setDate(d1.getDate() + 1);
  return d1.toISOString().split('T')[0] === dateStr2;
};

export const formatDateRanges = (dates: string[]): string => {
  if (!dates || !Array.isArray(dates) || dates.length === 0) return '';
  
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
