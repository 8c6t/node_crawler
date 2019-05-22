const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
dotenv.config();

const db = require('./models');

const crawler = async () => {
  await db.sequelize.sync();
  
  try {
    let browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications'],
    });
    
    let page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    
    await page.goto('http://spys.one/free-proxy-list/KR/');
    
    const proxies = await page.evaluate(() => {
      const ips = Array.from(document.querySelectorAll('tr > td:first-of-type > .spy14')).map((v) => v.textContent.replace(/document\.write\(.+\)/, ''));
      const types = Array.from(document.querySelectorAll('tr > td:nth-of-type(2)')).slice(5).map((v) => v.textContent);
      const latencies = Array.from(document.querySelectorAll('tr > td:nth-of-type(6) .spy1')).map((v) => v.textContent);
      const anonymities = Array.from(document.querySelectorAll('tr > td:nth-of-type(3)')).slice(3).map((v) => v.textContent);
    
      return ips.map((v, i) => {
        return {
          ip: v,
          type: types[i],
          latency: latencies[i],
          anonymity: anonymities[i],
        }
      });
    });
    
    // console.dir(proxies);

    const filtered = proxies
      .filter((v) => v.type.startsWith('HTTP'))
      .filter((v) => v.anonymity === 'HIA')
      .sort((p, c) => p.latency - c.latency);

    await Promise.all(filtered.map(async (v) => {
      return db.Proxy.upsert({
        ip: v.ip,
        type: v.type,
        latency: v.latency,
        anonymity: v.anonymity
      });
    }));

    await page.close();
    await browser.close();

    const fastestProxies = await db.Proxy.findAll({
      order: [['latency', 'ASC']],
    });

    console.dir(fastestProxies);

    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications', `--proxy-server=${fastestProxies[0].ip}`],
    });

    const browser2 = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications', `--proxy-server=${fastestProxies[1].ip}`],
    });

    const browser3 = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--window-size=1920,1080', '--disable-notifications', `--proxy-server=${fastestProxies[2].ip}`],
    });

    /* 
        // browser.createIncognitoBrowserContext: 시크릿 창
        const context1 = await browser.createIncognitoBrowserContext();
        const context2 = await browser.createIncognitoBrowserContext();
        const context3 = await browser.createIncognitoBrowserContext();
    
        console.log(await browser.browserContexts());
    
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();
        const page3 = await context3.newPage();
    */

    const page1 = await browser.newPage();
    const page2 = await browser2.newPage();
    const page3 = await browser3.newPage();

    await page1.goto('https://search.naver.com/search.naver?query=%EB%82%B4+ip');
    await page2.goto('https://search.naver.com/search.naver?query=%EB%82%B4+ip');
    await page3.goto('https://search.naver.com/search.naver?query=%EB%82%B4+ip');

/*     await page.waitFor(10000);

    await page.close();
    await browser.close(); */
    
    await db.sequelize.close();

  } catch (error) {
    console.error(error);
  }
}

crawler();