const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    await page.goto('https://www.facebook.com/');
    
    // evalueate 내부는 자바스크립트 스코프를 따르지 않기 때문에
    // 변수를 인자로 넘겨야 한다
    await page.evaluate((id, pw) => {
      document.querySelector('#email').value = id;
      document.querySelector('#pass').value = pw;
      document.querySelector('#loginbutton').click();
    }, process.env.fb_id, process.env.fb_pw);

  } catch (error) {
    console.error(error);
  }
}

crawler();