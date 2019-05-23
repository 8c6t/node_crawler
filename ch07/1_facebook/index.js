const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

const db = require('./models');

dotenv.config();

const crawler = async () => {
  try {
    await db.sequelize.sync(); 

    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications']
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });

    await page.goto('https://facebook.com');

    const id = process.env.FB_ID;
    const pw = process.env.FB_PW;

    await page.type('#email', id);
    await page.type('#pass', pw);

    await page.click('#loginbutton');

/* 
    await page.waitForResponse((response) => {
      return response.url().includes('login_attempt');
    });
*/

    await page.waitForSelector('#userNavigationLabel');
    await page.keyboard.press('Escape');

    let result = [];
    while(result.length < 10) {
      await page.waitForSelector('[id^=hyperfeed_story_id]:first-child .userContentWrapper');

      // '[id^=hyperfeed_story_id]:not([class*="sponsored_ad"])'
      const newPost = await page.evaluate(() => {
        window.scrollTo(0, 0);
        const firstFeed = document.querySelector('[id^=hyperfeed_story_id]:first-child');
        const name = firstFeed.querySelector('.fwb.fcg') && firstFeed.querySelector('.fwb.fcg').textContent;
        const content = firstFeed.querySelector('.userContent') && firstFeed.querySelector('.userContent').textContent;
        const img = firstFeed.querySelector('[class=mtm]') && document.querySelector('[class=mtm] img').src;
        const postId = firstFeed.dataset.dedupekey;

        return { name, content, postId, img }
      });

      const exist = await db.Facebook.findOne({
        where: { postId: newPost.postId }
      });

      if(!exist && newPost.name) {
        result.push(newPost);
      }
      
      await page.waitFor(1000);
      const likeBtn = await page.$('[id^=hyperfeed_story_id]:first-child ._666k a');
      
      await page.evaluate((like) => {
        const sponsor = document.querySelector('[id^=hyperfeed_story_id]:first-child[class*="sponsored_ad"]');
        if(!sponsor && like.getAttribute('aria-pressed') === 'false') {
          like.click();
        } else if (sponsor && like.getAttribute('aria-pressed') === 'true') {
          like.click();
        }
      }, likeBtn);
      
      await page.waitFor(1000);
     
      await page.evaluate(() => {
        const firstFeed = document.querySelector('[id^=hyperfeed_story_id]:first-child');
        firstFeed.parentNode.removeChild(firstFeed);
        window.scrollBy(0, 200);
      });
      
      await page.waitFor(1000);
    }
    
    await Promise.all(result.map((r) => {
      return db.Facebook.create({
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