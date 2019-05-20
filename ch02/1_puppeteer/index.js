const parse = require('csv-parse/lib/sync');
const fs = require('fs');
const puppeteer = require('puppeteer');

const csv = fs.readFileSync('../../public/csv/data.csv');
const records = parse(csv.toString('UTF-8'));

const crawler = async () => {
  const browser = await puppeteer.launch({ headless : process.env.NODE_ENV === 'production' });


/* 
  // 페이지를 여럿 띄울 수 있음
  const page = await browser.newPage();
  const page2 = await browser.newPage();
  const page3 = await browser.newPage();

  await page.goto('https://zerocho.com');
  await page2.goto('https://naver.com');
  await page3.goto('https://google.com'); 

  await page.waitFor(3000);
  await page2.waitFor(1000);
  await page3.waitFor(2000); */

  // 적절할 때 Promise.all을 사용하여 속도를 향상
  const [page, page2, page3] = await Promise.all([
    browser.newPage(),
    browser.newPage(),
    browser.newPage(),
  ]);

  await Promise.all([
    page.goto('https://zerocho.com'),
    page2.goto('https://naver.com'),
    page3.goto('https://google.com'),
  ]);

  await Promise.all([
    page.waitFor(3000), 
    page2.waitFor(1000), 
    page3.waitFor(2000), 
  ]);

  await page.close();
  await page2.close();
  await page3.close();

  await browser.close();
}

crawler();