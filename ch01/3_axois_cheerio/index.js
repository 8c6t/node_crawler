const xlsx = require('xlsx');
const axios = require('axios');  // ajax 라이브러리
const cheerio = require('cheerio');  // html 파서
const add_to_sheet = require('./add_to_sheet');

const workbook = xlsx.readFile('../../public/xlsx/data.xlsx');
const ws = workbook.Sheets['영화목록'];
const records = xlsx.utils.sheet_to_json(ws);

// 배열의 비구조화 할당
for (const [i, r] of records.entries()) {
  console.log(i, r.제목, r.링크);
}

/* // Promise.all은 동시에 진행되지만 순서가 보장되지 않음
const crawler = async () => {
  await Promise.all(records.map(async (r) => {
    const response = await axios.get(r.링크);

    if(response.status === 200) {
      const html = response.data;
      // console.log(html);

      const $ = cheerio.load(html);
      const score = $('.score.score_left .star_score').text();
      console.log(r.제목, '평점', score.trim());
    }
  }));
  
}

crawler(); */

// for of문은 await과 같이 쓰면 순서가 보장됨
const crawler2 = async () => {
  add_to_sheet(ws, 'C1', 's', '평점');
  for(const [i, r] of records.entries()) {
    const response = await axios.get(r.링크);
  
    if(response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);
      const score = $('.score.score_left .star_score').text();  // textContent
      console.log(r.제목, '평점', score.trim());

      const newCell = 'C' + (i+2); // C2 ~ C11
      add_to_sheet(ws, newCell, 'n', parseFloat(score.trim()));
    }
  }
  xlsx.writeFile(workbook, 'result/result.xlsx');
}

crawler2();