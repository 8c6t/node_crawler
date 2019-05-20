const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const fs = require('fs');
// https://try-puppeteer.appspot.com/
const puppeteer = require('puppeteer');

const csv = fs.readFileSync('../../public/csv/data.csv');
const records = parse(csv.toString('UTF-8'));

const crawler = async () => {
  try {
    const result = [];
    const browser = await puppeteer.launch({ headless: process.env.NODE_ENV === 'production' });

    await Promise.all(records.map(async (r, i) => {
      try {
        const page = await browser.newPage();
        await page.goto(r[1]);


/*        
        // const 태그핸들러 = await page.$(선택자);
        const scoreEl = await page.$('.score.score_left .star_score');

        if (scoreEl) {
          // const text = await page.evaluate(tag => tag.textContent, scoreEl);
          const text = await page.evaluate((tag) => { return tag.textContent; }, scoreEl);
          console.log(r[0], '평점', text.trim());
          // 인덱스에 맞게 삽입
          result[i] = ([r[0], r[1], text.trim()]);
        } 
*/


        // DOM API 활용
        // evaluate의 콜백함수에서 리턴하는 값을 text로 받는다
        const text = await page.evaluate(() => {
          const score = document.querySelector('.score.score_left .star_score');
          // const score2 = document.querySelector('.score.score_left .star_score');

          if (score) {
            return score.textContent;
            /*  return {
              score: score.textContent,
              score2: score2.textContent, 
             };
             */
          }
        });

        if (text) {
          console.log(r[0], '평점', text.trim());
          result[i] = ([r[0], r[1], text.trim()]);
        }

        // 페이지 종료. 메모리 관리 측면에서 해줄것
        await page.waitFor(3000);
        await page.close();
      } catch (error) {
        console.error(error);
      }
    }));
    await browser.close();
    const str = stringify(result);
    fs.writeFileSync('result/result.csv', str);
  } catch (error) {
    console.error(error);
  }
}

crawler();