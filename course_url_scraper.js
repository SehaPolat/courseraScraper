const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 60000,
  });
  const page = await browser.newPage();

  const baseURL = "https://www.coursera.org/courses?productTypeDescription=Courses&sortBy=NEW";

  await page.goto(baseURL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('a[data-click-key="seo_entity_page.search.click.search_card"]', { visible: true });

  let courses = [];

  async function extractCourses() {
    const pageCourses = await page.$$eval('a[data-click-key="seo_entity_page.search.click.search_card"]', nodes => {
      return nodes.map(node => {
        const ariaLabel = node.getAttribute('aria-label');
        const title = ariaLabel ? ariaLabel.split(',')[0].trim() : null;
        const url = node.href;
        return { title, url };
      });
    });
    return pageCourses;
  }

  async function goToNextPage() {
    const nextButton = await page.$('button[aria-label="Go to next page"]');
    if (nextButton) {
      const isDisabled = await page.evaluate(button => button.disabled, nextButton);
      if (!isDisabled) {
        const firstCourseHrefBefore = await page.evaluate(() => {
          const firstCourseNode = document.querySelector('a[data-click-key="seo_entity_page.search.click.search_card"]');
          return firstCourseNode ? firstCourseNode.href : null;
        });

        await nextButton.click();
        await page.waitForFunction(
          (selector, hrefBefore) => {
            const firstCourseNode = document.querySelector(selector);
            return firstCourseNode ? firstCourseNode.href !== hrefBefore : false;
          },
          {},
          'a[data-click-key="seo_entity_page.search.click.search_card"]',
          firstCourseHrefBefore
        );
        await new Promise(resolve => setTimeout(resolve, 10000));
        return true;
      } else {
        console.log('Next page button is disabled.');
      }
    } else {
      console.log('Next page button not found.');
    }
    return false;
  }

  const startingProviderIndex = 2;
  const maxProviderIndex = 420;

  for (let i = startingProviderIndex; i <= maxProviderIndex; i++) {
    await page.click(`button[aria-label="Show more Educator options"]`);
    await page.click('button.cds-149.cds-button-disableElevation.cds-button-secondary.css-1t2ipwa');

    const checkboxSelector = `#checkbox-group > div:nth-child(${i}) > label > span`;
    await page.waitForSelector(checkboxSelector, { visible: true });

    const clicked = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.click();
        return true;
      }
      return false;
    }, checkboxSelector);

    if (!clicked) {
      console.log(`Checkbox with Selector ${checkboxSelector} not found.`);
      continue;
    }

    await page.click('button.cds-149.cds-button-disableElevation.cds-button-primary.css-1dxh3kl');
    await page.waitForSelector('a[data-click-key="seo_entity_page.search.click.search_card"]', { visible: true });

    let hasNextPage = true;
    let pn = 1;
    while (hasNextPage) {
      const pageCourses = await extractCourses();
      courses = courses.concat(pageCourses);
      console.log(`Extracted ${pageCourses.length} courses from page ${pn}.`);
      pn++;
      hasNextPage = await goToNextPage();
      if (!hasNextPage) {
        console.log(`No more pages to navigate for provider ${i}.`);
      }
    }

    try {
      const previousData = await fs.readJson('all_urls.json').catch(() => []);
      const updatedData = previousData.concat(courses);
      await fs.writeJson('all_urls.json', updatedData, { spaces: 2 });
      console.log(`Saved data for provider index ${i}, total courses collected so far: ${updatedData.length}`);
    } catch (error) {
      console.error(`Error saving data for provider index ${i}:`, error);
    }

    courses = [];
  }

  console.log("Scraping complete.");
  await browser.close();
})();
