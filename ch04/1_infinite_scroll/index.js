const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

fs.readdir('imgs', (err) => {
  if(err) {
    console.log('imgs 폴더가 없어 imgs 폴더를 생성합니다');
    fs.mkdirSync('imgs');
  }
});

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless : process.env.NODE_ENV === 'production' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36');
    await page.goto('https://unsplash.com');
    let result = [];

    // 선택자
    const IMG_EL_SELECTOR = 'figure';
    const IMG_SRC_SELECTOR = 'img._2zEKz';

    while(result.length <= 30) {
      const srcs = await page.evaluate((IMG_EL_SELECTOR, IMG_SRC_SELECTOR) => {
        // 절대 좌표로 스크롤을 조작
        window.scrollTo(0, 0);
        let imgs = [];
      
        const imgEls = document.querySelectorAll(IMG_EL_SELECTOR.toString());
  
        if(imgEls.length) {
          imgEls.forEach(v => {
            let src = v.querySelector(IMG_SRC_SELECTOR.toString()).src;
            if(src)  imgs.push(src);
            v.parentElement.removeChild(v);
          });
        }
        
        window.scrollBy(0, 100);

        setTimeout(() => {
          window.scrollBy(0, 200);  // 현재 위치 기준으로 스크롤 조작(x, y)
        }, 500);

        return imgs;  
      }, IMG_EL_SELECTOR, IMG_SRC_SELECTOR);

      result = result.concat(srcs);
      // 선택자 등장 대기
      // 30초간 기다린 뒤 못 찾으면 timeout 에러
      await page.waitForSelector(IMG_EL_SELECTOR.toString());  
      console.log('새 이미지 로딩 완료');
    }

    console.log(result);

    result.forEach(async (src) => {
      const imgResult = await axios.get(src.replace(/\?.*$/, ''), {
        responseType: 'arraybuffer'
      });

      fs.writeFileSync(`imgs/${new Date().valueOf()}.jpeg`, imgResult.data);
    });

    await page.close();
    await browser.close();
  } catch (error) {
    console.error(error);
  }
}

crawler();
