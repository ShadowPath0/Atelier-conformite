import * as XLSX from 'xlsx';

export function exportCSV(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportExcel(filename, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  XLSX.writeFile(wb, filename);
}

// sheets: [{ name, headers, rows }, ...] — un onglet Excel par registre.
export function exportMultiSheetExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, headers, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}
