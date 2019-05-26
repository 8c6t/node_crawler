const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const db = require('./models');
const path = require('path');
const fs = require('fs');

dotenv.config();

const userDataDir = path.join(require('os').tmpdir(), 'Puppeteer');

fs.readdir(userDataDir, (err) => {
  if(err) {
    console.error(`userDataDir 폴더가 없어 ${userDataDir} 경로에 폴더 생성`);
    fs.mkdirSync(userDataDir);
  }
});

const crawler = async () => {
  try {
    await db.sequelize.sync();
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications'],
      userDataDir
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });

    await page.goto('https://www.instagram.com/');

    if(await page.$('a[href="/hachicore/"]')) {
      console.log('이미 로그인 되어 있습니다');
    } else {
      await page.waitForSelector('button.L3NKy');
  
      /* 
        timeout 발생. Promise 간 경쟁 상태가 원인
  
        Bear in mind that if click() triggers a navigation event
        and there's a separate page.waitForNavigation() promise to be resolved, 
        you may end up with a race condition that yields unexpected results
  
        https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pageclickselector-options
        https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions
        https://github.com/GoogleChrome/puppeteer/issues/1412
      */
      // await page.click('button.L3NKy');
      // await page.waitForNavigation();
  
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click('button.L3NKy'),
      ]);
  
      await page.waitForSelector('#m_login_email');
      await page.type('#m_login_email', process.env.FB_ID);
      await page.type('#m_login_password', process.env.FB_PW);
      await page.waitFor(1000);
  
      await page.waitForSelector('button[name=login]');
  
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.click('button[name=login]'),
      ]);

      console.log('로그인 완료');
    }
    
  await page.waitForSelector("input.XTCLo");
  await page.click('input.XTCLo');
  await page.keyboard.type('냥스타그램');
  await page.waitForSelector('.drKGC');

  const href = await page.evaluate(() => {
    return document.querySelector('.drKGC a:first-child').href;
  });

  await page.goto(href);

  } catch (error) {
    console.error(error);
  }
}

crawler();