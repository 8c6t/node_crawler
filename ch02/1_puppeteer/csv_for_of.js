const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const puppeteer = require('puppeteer');

const csv = fs.readFileSync('../../public/csv/data.csv');
const records = parse(csv.toString('UTF-8'));

const crawler = async () => {
  try {
    const result = [];
    const browser = await puppeteer.launch({ headless: process.env.NODE_ENV === 'production' });

    const page = await browser.newPage();
    // navigator.userAgent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');

    for (const [i, r] of records.entries()) {
      await page.goto(r[1]);

      console.log(await page.evaluate('navigator.userAgent'));

      const text = await page.evaluate(() => {
        const score = document.querySelector('.score.score_left .star_score');
        if (score) {
          return score.textContent;
        }
      });

      if (text) {
        console.log(r[0], '평점', text.trim());
        result[i] = ([r[0], r[1], text.trim()]);
      }
      
      await page.waitFor(3000);
    }

    // 페이지 종료. 메모리 관리 측면에서 해줄것
    await page.close();
    await browser.close();
    
    const str = stringify(result);
    fs.writeFileSync('result/result.csv', str);
  } catch (error) {
    console.error(error);
  }
}

crawler();