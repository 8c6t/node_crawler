const parse = require('csv-parse/lib/sync');
const fs = require('fs');

const csv = fs.readFileSync('../../public/csv/data.csv');

// 버퍼 데이터 변환
const data = csv.toString("UTF-8");

const records = parse(data);

records.forEach((r, i) => {
  console.log(i, r);
});