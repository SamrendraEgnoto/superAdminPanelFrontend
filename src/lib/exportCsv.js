/**
 * Export data to CSV file download
 * @param {string} filename - Base name for the exported CSV
 * @param {Array<{label: string, key: string, accessor?: Function}>} headers - Column definitions
 * @param {Array<Object>} rows - Data array
 */
export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    if (typeof window !== 'undefined') {
      alert('No data available to export');
    }
    return;
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(h => escapeCell(h.label || h.key || h)).join(',');
  const dataLines = rows.map(row => {
    return headers.map(h => {
      const key = typeof h === 'object' ? h.key : h;
      let val;
      if (typeof h.accessor === 'function') {
        val = h.accessor(row);
      } else if (key && key.includes('.')) {
        val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), row);
      } else {
        val = row[key];
      }
      return escapeCell(val);
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
