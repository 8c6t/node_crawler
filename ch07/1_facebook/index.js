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
    await page.keyboard.press('Escape');



  } catch (error) {
    console.error(error);
  }
}

crawler();