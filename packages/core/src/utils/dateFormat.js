export function formatDateDMY(dateStr) {
    if (!dateStr)
        return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
// Format de rang de dates dd/mm/yyyy - dd/mm/yyyy
export function formatDateRangeDMY(start, end) {
    const startFormatted = formatDateDMY(start);
    const endFormatted = formatDateDMY(end);
    if (startFormatted && endFormatted && startFormatted !== endFormatted) {
        return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted || '';
}
// Suma dies a una data ISO i retorna YYYY-MM-DD
export function addDaysISO(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}
/**
 * Genera un nom de fitxer per defecte amb el format dades_GEP_dd-mm-aa_HH-MM.json.
 * @returns Un string amb el nom del fitxer generat.
 */
export function generateDefaultFileName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `dades_GEP_${day}-${month}-${year}_${hours}-${minutes}.json`;
}
//# sourceMappingURL=dateFormat.js.map