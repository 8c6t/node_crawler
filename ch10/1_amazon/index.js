const puppeteer = require('puppeteer');

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications'],
    });

    let result = [];
    await Promise.all([1,2,3,4,5,6,7,8,9,10].map(async (v) => {
      const page = await browser.newPage();
      await page.setViewport({
        width: 1080,
        height: 1080,
      });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
      
      const keyword = 'mouse';
      await page.goto(`https://www.amazon.com/s?k=${keyword}&page=${v}`, {
        waitUntil: "networkidle0"
      });

      const r = await page.evaluate(() => {
        const tags = document.querySelectorAll('.s-result-list > div');
        const result = [];

        tags.forEach((t) => {
          result.push({
            name: t && t.querySelector('h2') && t.querySelector('h2').textContent.trim(),
            price: t && t.querySelector('.a-price > span:first-child') && t.querySelector('.a-price > span:first-child').textContent.trim()
          })
        });
        return result;
      });

      result = result.concat(r);
      await page.close();
    }));

    console.log(result.length);
    console.log(result[0]);

    await browser.close();
  } catch (error) {
    console.error(error);
  }
}

crawler();
