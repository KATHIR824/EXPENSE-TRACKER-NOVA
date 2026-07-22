export function exportToCsv(filename, rows, columns) {
    if (!rows || !rows.length) return;
    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = rows.map(row =>
        columns.map(c => {
            const val = typeof c.value === 'function' ? c.value(row) : row[c.value];
            return `"${String(val ?? '').replace(/"/g, '""')}"`;
        }).join(',')
    ).join('\n');

    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
