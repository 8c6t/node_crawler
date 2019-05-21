const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications']
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    await page.goto('https://www.facebook.com/');

    await page.type('#email', process.env.fb_id);
    await page.type('#pass', process.env.fb_pw);
    await page.hover('#loginbutton');
    await page.waitFor(3000);
    await page.click('#loginbutton');

/*
    // 특정 요청 대기
    await page.waitForResponse((response) => {
      console.log(response.url());
      return response.url().includes('login_attempt');
    });
*/
    // login_attempt가 포함된 url이 response에 없어 선택자로 대처
    await page.waitForSelector('#userNavigationLabel')

    // https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js
    await page.keyboard.press('Escape');

    await page.click('#userNavigationLabel');
    await page.waitForSelector('li.navSubmenu:last-child');
    await page.waitFor(3000);

    // await page.click('li.navSubmenu:last-child');
    await page.evaluate(() => {
      document.querySelector('li.navSubmenu:last-child').click();
    });

  } catch (error) {
    console.error(error);
  }
}

crawler();