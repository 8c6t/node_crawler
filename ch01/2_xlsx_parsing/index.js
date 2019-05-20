const xlsx = require('xlsx');

const workbook = xlsx.readFile('../../public/xlsx/data.xlsx');

console.log(Object.keys(workbook.Sheets)); // workBook.SheetNames

const ws = workbook.Sheets['영화목록'];

const records = xlsx.utils.sheet_to_json(ws);

// 배열의 비구조화 할당
for(const [i, r] of records.entries()) {
  console.log(i, r);
}
