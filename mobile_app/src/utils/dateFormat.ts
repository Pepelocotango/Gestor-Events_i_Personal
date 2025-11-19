export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'No especificat';
  }

  // Intenta parsejar directament, funciona per a formats ISO (YYYY-MM-DD)
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.toLocaleDateString();
  }

  // Si falla, intenta parsejar el format 'dd/mm/yyyy'
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Els mesos a JS són de 0 a 11
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const ddmmyyyyDate = new Date(year, month, day);
      if (!isNaN(ddmmyyyyDate.getTime())) {
        return ddmmyyyyDate.toLocaleDateString();
      }
    }
  }

  // Si tot falla, retorna la data original
  return dateString;
};

export const formatDateDMY = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Data invàlida';
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateRangeDMY = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Dates invàlides';
  }

  const startDay = startDate.getDate().toString().padStart(2, '0');
  const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
  const startYear = startDate.getFullYear();

  const endDay = endDate.getDate().toString().padStart(2, '0');
  const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');

  if (start.split('T')[0] === end.split('T')[0]) {
    return `${startDay}/${startMonth}/${startYear}`;
  }

  return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
};
