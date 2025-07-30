export const escapeCsvCell = (cellData: string | number | boolean | undefined | null): string => {
  if (cellData === undefined || cellData === null) return '';
  const stringData = String(cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};
