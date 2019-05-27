const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
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
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications'],
      // userDataDir
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    
    await page.goto('https://twitter.com', {
      waitUntil: "networkidle0",
    });

    await page.type('.LoginForm-username input', process.env.ID);    
    await page.type('.LoginForm-password input', process.env.PW);

    await Promise.all([
      await page.click('input[type="submit"]'),
      await page.waitForNavigation(),
    ]);

    // 하나의 트윗 단위가 .js-stream-item
    while(await page.$('.js-stream-item')) {
      const firstItem = await page.$('.js-stream-item:first-child');

      // iframe을 비동기로 로딩하기 때문에 먼저 컨테이너를 확인 후 스크롤을 내려 iframe을 로딩
      if(await page.$('.js-stream-item:first-child .js-macaw-cards-iframe-container')) {
        // 프레임을 찾기 위한 tweetid 검색
        const tweetId = await page.evaluate((item) => {
          return item.dataset.itemId;
        }, firstItem);

        // 스크롤을 내려 iframe 로딩시킴
        await page.evaluate(() => {
          window.scrollBy(0, 10);
        });

        // console.log('iframe 발견');
        await page.waitForSelector('.js-stream-item:first-child iframe');

        // page.frames: 현 페이지의 모든 frame 정보
        // frames는 page와 같은 api를 사용 가능
        const iframe = await page.frames().find((frame) => frame.url().includes(tweetId));

        if(iframe) {
          const result = await iframe.evaluate(() => {
            return {
              title: document.querySelector('h2') && document.querySelector('h2').textContent
            }
          });
          console.log(result);
        }
      } 

      await page.evaluate((item) => item.parentNode.removeChild(item), firstItem);

      await page.evaluate(() => {
        window.scrollBy(0, 10);
      });

      await page.waitForSelector('.js-stream-item');
      await page.waitFor(2000);
    } 

/*     await page.close();
    await browser.close(); */

  } catch (error) {
    console.error(error);
  }
}

crawler();