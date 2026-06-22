import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  console.log('Navigating to Vercel URL...');
  try {
    await page.goto('https://stacksagent-sdk-dashboard.vercel.app/', { waitUntil: 'networkidle0' });
    console.log('Finished loading.');
  } catch(e) {
    console.log('Error navigating:', e);
  }
  await browser.close();
})();
