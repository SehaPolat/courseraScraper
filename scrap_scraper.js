const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    protocolTimeout: 60000,
  });
  const page = await browser.newPage();

  const baseURL = "https://www.coursera.org/courses?partners=IW%3ALEARN&partners=Indian%20Institute%20of%20Science&partners=Indian%20Institute%20of%20Technology%20Guwahati&partners=Indian%20Statistical%20Institute&partners=Instituto%20Natura&partners=Ismart&partners=Japan%20Deep%20Learning%20Association&partners=JetBrains&partners=Jordan%20University%20of%20Science%20and%20Technology&partners=Kalshoven-Gieskes%20Forum&partners=Karlsruhe%20Institute%20of%20Technology&partners=Kilimanjaro%20Christian%20Medical%20University%20College&partners=King%20Abdullah%20University%20of%20Science%20and%20Technology&partners=LDE%20Centre%20for%20Safety%20and%20Security&partners=Match%20Teacher%20Residency&partners=Measure%20What%20Matters&partners=Meertens%20instituut%20%28KNAW%29&partners=Moderna&partners=Morehouse%20College&partners=NHH&partners=National%20Oceanic%20and%20Atmospheric%20Administration%20%28NOAA%29&partners=National%20Technical%20University%20of%20Athens&partners=Naturalis%20Biodiversity%20Center&partners=Nestl%C3%A9&partners=New%20Teacher%20Center&partners=North%20Carolina%20State%20University&partners=Oncofertility%20Consortium&partners=Osmosis&partners=Oxfam&partners=Qualcomm%20Academy&partners=ROI%20Training&partners=Reference%20Centre%20for%20Psychosocial%20Support&partners=Samsung&partners=Silicon%20Schools%20Fund&partners=Soci%C3%A9t%C3%A9%20G%C3%A9n%C3%A9rale&partners=Talend&partners=Tinder&partners=UCL%20School%20of%20Management&partners=UNESCO&partners=UNESCO-IOC&partners=USO&partners=UVA%20Lifetime%20Learning%2C%20Patrick%20Henry%20Memorial%20Foundation&partners=United%20Nations%20Development%20Programme%20%28UNDP-The%20GEF%29&partners=United%20Nations%20Environment%20Programme&partners=Universidad%20Polit%C3%A9cnica%20de%20Madrid&partners=Universidad%20Tecnol%C3%B3gica%20Centroamericana&partners=Universitat%20Pompeu%20Fabra%20of%20Barcelona&partners=University%20College%20London&partners=University%20of%20Coimbra&partners=University%20of%20Groningen&partners=University%20of%20Heidelberg&partners=University%20of%20Huddersfield&partners=University%20of%20Iceland&partners=University%20of%20Nebraska&partners=University%20of%20Oslo&partners=University%20of%20Strathclyde%2C%20Glasgow&partners=University%20of%20the%20Arts%20The%20Hague&partners=Universit%C3%A9%20de%20Montr%C3%A9al&partners=Universit%C3%A9%20libre%20de%20Bruxelles&partners=VITO&partners=WWF&partners=Yeshiva%20University&partners=emlyon%20business%20school&partners=%E4%B8%8A%E6%B5%B7%E4%B8%AD%E5%8C%BB%E8%8D%AF%E5%A4%A7%E5%AD%A6&partners=%E4%BA%91%E6%9E%97%E7%A7%91%E6%8A%80%E5%A4%A7%E5%AD%A6%20%28Yunlin%20University%20of%20Science%20and%20Technology%29&partners=%E7%9C%9F%E6%A0%BC%E5%9F%BA%E9%87%91&page=1&sortBy=BEST_MATCH";

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

  const startingProviderIndex = 357;
  const maxProviderIndex = 420;

    let hasNextPage = true;
    let pn = 1;
    while (hasNextPage) {
      const pageCourses = await extractCourses();
      courses = courses.concat(pageCourses);
      console.log(`Extracted ${pageCourses.length} courses from page ${pn}.`);
      pn++;
      hasNextPage = await goToNextPage();
      if (!hasNextPage) {
        console.log(`No more pages to navigate for provider`);
      }
    }

    try {
      const previousData = await fs.readJson('all_urls.json').catch(() => []);
      const updatedData = previousData.concat(courses);
      await fs.writeJson('all_urls.json', updatedData, { spaces: 2 });
    } catch (error) {
    }

    courses = [];


  console.log("Scraping complete.");
  await browser.close();
})();
