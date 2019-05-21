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

     // 이벤트 리스너에 등록해서 dialog 이벤트에 대응
     page.on('dialog', async (dialog) => {
      console.log(dialog.type(), dialog.message());
      // await dialog.accept();
      // await dialog.dismiss();

/*       
      // 분기 처리가 필요하다면 message로
      if(dialog.message() === '끄세요') {
        await dialog.dismiss();
      } else if(dialog.message() === 'ok') {
        await dialog.accept();
      }
*/  
      await dialog.accept('http://google.com');
     });

     await page.evaluate(() => {
/*  
     // alert
      alert('이 창이 꺼져야 다음으로 넘어갑니다');
      location.href = 'http://google.com';
*/
/* 
      // confirm
      if(confirm('이 창이 꺼져야 다음으로 넘어갑니다')) {
        location.href = 'http://google.com'
      } else {
        location.href = 'http://naver.com';
      }
*/

      const data = prompt('데이터를 입력하세요');
      location.href = data;
     });


  } catch (error) {
    console.error(error);
  }
}

crawler();