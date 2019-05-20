const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const add_to_sheet = require('./add_to_sheet');

const workbook = xlsx.readFile('../../public/xlsx/data.xlsx');
const ws = workbook.Sheets['영화목록'];
const records = xlsx.utils.sheet_to_json(ws);

fs.readdir('screenshot', (err) => {
  if(err) {
    console.error('screenshot 폴더가 없어 screenshot 폴더를 생성함');
    fs.mkdirSync('screenshot');
  }
});

fs.readdir('poster', (err) => {
  if(err) {
    console.error('poster 폴더가 없어 poster 폴더를 생성함');
    fs.mkdirSync('poster');
  }
});

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless : process.env.NODE_ENV === 'production',
      // 브라우저 사이즈
      args: ['--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    add_to_sheet(ws, 'C1', 's', '평점');

    for(const [i, r] of records.entries()) {
      await page.goto(r['링크']);

      const result = await page.evaluate(() => {
        const scoreEl = document.querySelector('.score.score_left .star_score');
        const score = scoreEl ? scoreEl.textContent : '';

        const imgEl = document.querySelector('.poster img');
        const img = imgEl ? imgEl.src : '';

        return { score, img }
      });

      if(result.score) {
        console.log(r['제목'], '평점', result.score.trim());
        const newCell = 'C' + (i+2);
        add_to_sheet(ws, newCell, 'n', parseFloat(result.score.trim()));
      }

      if(result.img) {
        const buffer = await page.screenshot({ 
          path: `screenshot/${r['제목']}.png`, 
          // fullPage: true,
          // 원하는 지역만 캡쳐하는 옵션(좌표값)
          clip: {
            x: 100,
            y: 100,
            width: 300,
            height: 300,
          }
         });

        const imgResult = await axios.get(result.img.replace(/\?.*$/, ''), { 
          // arraybuffer: buffer가 연속적으로 들어 있는 자료 구조
          responseType: 'arraybuffer' 
        });

        fs.writeFileSync(`poster/${r['제목']}.jpg`, imgResult.data)

      }

      await page.waitFor(1000);
    }
    
    await page.close();
    await browser.close();
    xlsx.writeFile(workbook, 'result/result.xlsx');
  } catch (error) {
    console.error(error);
  }
}

crawler();