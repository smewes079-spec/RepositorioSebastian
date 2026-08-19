// Exporta a un .xlsx exactamente lo que se ve en pantalla: las columnas
// visibles, en el orden actual, con los datos ya filtrados. Carga exceljs
// solo cuando se usa (no infla el bundle inicial de la app).
export async function exportRowsToExcel({ filename, sheetName = 'Datos', columns, rows }) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: Math.max(12, c.label.length + 4),
  }));

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    cell.alignment = { vertical: 'middle' };
  });

  for (const row of rows) {
    const values = {};
    for (const c of columns) values[c.key] = c.getValue(row);
    ws.addRow(values);
  }

  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
