const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const items = JSON.parse(fs.readFileSync('all_coursera_urls.json', 'utf-8'));

    const delayTime = 500;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_BIN || puppeteer.executablePath(),
      defaultViewport: null,
      userDataDir: '/app/.cache/puppeteer',
    });
    console.log("Chromium executable path:", puppeteer.executablePath());
    const page = await browser.newPage();

    for (const item of items) {
      const { title, url } = item;
      try {
        console.log(`Navigating to ${url}`);

        // Navigate to the URL and wait until the network is idle
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#rendered-content > div > main > section.css-oe48t8 > div > div > div.cds-9.css-za0201.cds-10.cds-11.cds-grid-item > div.cds-9.css-0.cds-11.cds-grid-item.cds-56 > div > div > div.cds-9.css-0.cds-11.cds-grid-item.cds-56.cds-79 > div.css-y6ppwi > div > div > div > form > button');

        // Extract information from the page
        const data = await page.evaluate((url) => {
          const courseTitle = document.querySelector('h1[data-e2e="hero-title"]')?.innerText || '';
          const instructor = document.querySelector('.css-9gmd4r > span:nth-child(1)')?.innerText || '';
          const isFree = document.querySelector('[data-e2e="enroll-button"] .cds-button-label')?.innerText || '';
          const enrollmentCount = document.querySelector('.css-1j0mzc8 > p:nth-child(1) > span:nth-child(1) > strong:nth-child(1) > span:nth-child(1)')?.innerText || '';
          const nativeRating = document.querySelector('.css-h1jogs')?.innerText || '';
          const reviewCount = document.querySelector('.css-vac8rf')?.innerText || '';
          const difficulty = document.querySelector('div.css-6mrk5o:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)')?.innerText || '';
          const learningPace = document.querySelector('div.css-6mrk5o:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2)')?.innerText || '';
          const approxTime = document.querySelector('div.css-6mrk5o:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')?.querySelector('div')?.innerText || '';
          const approvalRate = document.querySelector('div.css-6mrk5o:nth-child(5) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)')?.innerText || '';
          const bulletPoints = Array.from(document.querySelectorAll('div.css-1m3kxpf:nth-child(1) > div:nth-child(2)')).map(el => el.innerText);
          const skillTags = Array.from(document.querySelectorAll('.css-1yjbkii')).map(tag => tag.innerText);
          const institution = document.querySelector('.css-1stvmzy .css-6ecy9b')?.innerText || '';
          const details = document.querySelector('.css-k4zccu')?.innerText || '';
        
          return {
            url,
            courseTitle,
            instructor,
            isFree,
            enrollmentCount,
            nativeRating,
            reviewCount,
            difficulty,
            learningPace,
            approxTime,
            approvalRate,
            bulletPoints,
            skillTags,
            institution,
            details
          };
        }, url);

        // Append data to file immediately
        fs.appendFileSync('course_data.json', JSON.stringify(data, null, 2) + ',\n', 'utf-8');
        console.log(`Saved data from ${url}`);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
      }
    }

    console.log('Scraping completed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();

// Last scrape:
//https://www.coursera.org/learn/introduction-to-responsible-ai
