const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = path.resolve('..', 'Nhập hàng.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(JSON.stringify(data.slice(0, 50), null, 2));
} catch (e) {
  console.error(e.message);
}
