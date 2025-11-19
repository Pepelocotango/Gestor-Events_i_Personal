export const isMultiDay = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  // If times are different, it's multi-day
  return start.getTime() !== end.getTime();
};

export const getDaysBetween = (startDate: string, endDate: string): Date[] => {
    const dates: Date[] = [];
    // Start from the beginning of the start date
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);

    while (currentDate.getTime() <= lastDate.getTime()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}
