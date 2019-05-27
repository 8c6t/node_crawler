const puppeteer = require('puppeteer');

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications'],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    
    const keyword = 'crawler';
    await page.goto(`https://github.com/search?q=${keyword}`, {
      waitUntil: 'networkidle0'
    });

    let result = [];
    let pageNum = 1;
    
    while(pageNum <= 5) {
      const r = await page.evaluate(() => {
        const tags = document.querySelectorAll('.repo-list-item');
        const result = [];

        tags.forEach((t) => {
          result.push({
            name: t && t.querySelector('h3') && t.querySelector('h3').textContent.trim(),
            language: t && t.querySelector('span[itemprop=programmingLanguage]') && t.querySelector('span[itemprop=programmingLanguage]').textContent.trim(),
            star: t && t.querySelector('.muted-link') && t.querySelector('.muted-link').textContent.trim() 
          })
        });
        return result;
      });

      console.log(r);
      result = result.concat(r);

      await page.waitForSelector('.next_page');
      await page.click('.next_page');
      pageNum++;

      await page.waitForResponse((response) => {
        return response.url().startsWith(`https://github.com/search/count?p=${pageNum}`) && response.status() === 200;
      });
      await page.waitFor(2000);
    }

    console.log(result.length);
    console.log(result[0]);

    await page.close();
    await browser.close();

  } catch (error) {
    console.error(error);
  }
}

crawler();