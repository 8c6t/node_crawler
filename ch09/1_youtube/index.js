const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const ytdl = require('ytdl-core');

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

/*     const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download('663451');
 */
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      // executablePath: revisionInfo.executablePath,
      args: ['--window-size=1920,1080', '--disable-notifications'],
      userDataDir
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');

    await page.goto('https://www.youtube.com/', {
      waitUntil: "networkidle0"
    });

    if(!await page.$('#avatar-btn')) {
      await page.waitForSelector('#buttons ytd-button-renderer:last-child a');

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click('#buttons ytd-button-renderer:last-child a'),
      ]);
  
      await page.waitForSelector('#identifierId');
      await page.type('#identifierId', process.env.EMAIL);
      await page.waitForSelector('#identifierNext');
  
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click('#identifierNext'),
      ]);
  
      await page.waitForSelector('input[name="password"]');
  
      await page.evaluate((password) => {
        document.querySelector('input[name="password"]').value = password;
      }, process.env.PASSWORD)
  
      await page.waitFor(3000);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2" }),
        page.click('#passwordNext')
      ]);

      console.log('로그인 완료');
    } else {
      console.log('이미 로그인 됨');
    }

    await page.goto('https://www.youtube.com/feed/trending');

    await page.waitForSelector('ytd-video-renderer');
    await page.click('ytd-video-renderer');

    const url = await page.url();
    const title = await page.title();
    console.log(url, title);

    const info = await ytdl.getInfo(url);
    console.log(info);

    ytdl(url).pipe(fs.createWriteStream(`${info.title.replace(/\u20A9/g, '')}.mp4`));

  } catch (error) {
    console.error(error);
  }
}

crawler();