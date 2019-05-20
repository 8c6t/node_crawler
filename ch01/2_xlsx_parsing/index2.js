const xlsx = require('xlsx');

const workbook = xlsx.readFile('../../public/xlsx/data.xlsx');

const ws = workbook.Sheets['영화목록'];

// 시트명 가져와서 사용하기
console.log(workbook.SheetNames);
// 시트명 별로 다르게 파싱
for(const name of workbook.SheetNames) {
  const ws = workbook.Sheets['name'];
}

// 헤더 옵션 사용 시 첫번째 줄이 특수한 줄로 인식되지 않음
const records = xlsx.utils.sheet_to_json(ws, { header: 'A' });

// 배열에서 첫번째를 생략
// records.shift();

// !ref = 해당 영역을 파싱
console.log(ws['!ref']);  

// 범위 조절
// A1:B11 -> A2:B11
ws['!ref'] = ws['!ref'].split(":").map((v, i) => {
  if(i === 0) {
    return 'A2';
  }
  return v;
}).join(':');

console.log(records);