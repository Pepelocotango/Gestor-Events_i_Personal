function formatDateDDMM(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
    return '';
  }
  const parts = dateStr.split('-');
  if (parts.length < 3) {
    return '';
  }
  // Assuming YYYY-MM-DD format
  const day = parts[2];
  const month = parts[1];
  return `${day}/${month}`;
}

module.exports = {
  formatDateDDMM,
};
