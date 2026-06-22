import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to Vercel URL...');
  try {
    await page.goto('https://stacksagent-sdk-dashboard.vercel.app/', { waitUntil: 'networkidle0' });
    console.log('Finished loading. Checking for error boundary text...');
    
    const errorText = await page.evaluate(() => {
      const codeEl = document.querySelector('.text-red-300');
      const preEl = document.querySelector('pre');
      return {
        message: codeEl ? codeEl.textContent : null,
        stack: preEl ? preEl.textContent : null
      };
    });
    
    console.log('Error Boundary Result:', errorText);
  } catch(e) {
    console.log('Error navigating:', e);
  }
  await browser.close();
})();
