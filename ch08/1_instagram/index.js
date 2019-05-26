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
    
    let result = [];
    let prevPostId = '';
    
    while(result.length < 10) {
      const moreButton = await page.$('button.sXUSN');
      if(moreButton) {
        await page.evaluate((btn) => btn.click(), moreButton);
      }
  
      const newPost = await page.evaluate(() => {
        const article = document.querySelector('article:first-of-type');
        const postId = document.querySelector('.c-Yi7') && document.querySelector('.c-Yi7').href.split('/').slice(-2, -1)[0];
        const name = article.querySelector('h2') && article.querySelector('h2').textContent;
        const img = article.querySelector('.KL4Bh img') && article.querySelector('.KL4Bh img').src;
        const content = article.querySelector('.C4VMK > span') && article.querySelector('.C4VMK > span').textContent;
  
        return { postId, name, img, content }
      });
  
      if(newPost.postId !== prevPostId) {
        console.log(newPost);
        if(!result.find((v) => v.postId === newPost.postId)) {
          const exist = await db.Instagram.findOne({ where: { postId: newPost.postId }});
          if(!exist) {
            result.push(newPost);
          }
        }
      }
      
      await page.waitFor(1000);
      await page.evaluate(() => {
        const article = document.querySelector('article:first-of-type');
        const heartBtn = article.querySelector('span[class^="glyphsSpriteHeart"]');
        if(heartBtn.className.includes('outline')) {
          heartBtn.click();
        }
      });

      prevPostId = newPost.postId;
      await page.waitFor(1000);
      await page.evaluate(() => {
        window.scrollBy(0, 800);
      });
    }

    await Promise.all(result.map((r) => {
      return db.Instagram.create({
        postId: r.postId,
        media: r.img,
        writer: r.name,
        content: r.content,
      });
    }));

    console.log(result.length);
    await page.close();
    await browser.close();

  } catch (error) {
    console.error(error);
  }
}

crawler();