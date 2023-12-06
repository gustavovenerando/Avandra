import {Browser, Page, BrowserContext} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true}));

const siteArr = [
    {
        site: "pichau",
        numProductPerPage: 36,
        mainUrl: "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM",
        productTextSelector: 'div.MuiGrid-grid-xs-6:nth-child(INDEX) > a:nth-child(1) > div:nth-child(1) > div:nth-child(3) > h2:nth-child(1)',
        productCountSelector : "div.MuiGrid-grid-lg-10 > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(1) > div",
        productCardSelector : 'a[data-cy="list-product"]',
    },
    {
        site: "kabum",
        numProductPerPage: 100,
        mainUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
        productTextSelector: 'div.sc-cdc9b13f-7:nth-child(INDEX) > a:nth-child(2) > div:nth-child(2) span[class="sc-d79c9c3f-0 nlmfp sc-cdc9b13f-16 eHyEuD nameCard"]',
        productCountSelector : "#listingCount",
        productCardSelector : ".productCard",
    },
]

async function start() {
    const browser = await puppeteer.launch({ headless: false });

    //TO-DO: limit number of pages concurrently (batches)
    //TO-DO: add novos sites

    const urlsToExtractData = await getAllSitesUrls(browser, siteArr);

    const result = await Promise.all(urlsToExtractData.map(elem => extracPageData(browser, elem.url, elem.productTextSelector, elem.productCardSelector)));

    console.log("Final Result: ", result);

    await browser.close();
}

async function getAllSitesUrls(browser: Browser, siteArr: any[]): Promise<any[]>{
    const sitesUrls = [];

    for (let { numProductPerPage, mainUrl, productCountSelector, ...productSelectors } of siteArr) {
        const numPages = await getNumPages(browser, productCountSelector, numProductPerPage, mainUrl);
        console.log("Number of pages: ", numPages);

        sitesUrls.push(...getSiteUrls(numPages, mainUrl, productSelectors));
    }

    return sitesUrls;
}

function getSiteUrls(numPages: number, mainUrl: string, productSelectors: any): any[]{
    const siteUrls = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const url = mainUrl.replace("PAGE_NUM", `${pageNum}`);
        siteUrls.push({url, ...productSelectors});
    }

    return siteUrls;
}

async function extracPageData(browser: Browser ,url: string, productTextSelector: string, productCardSelector: string){
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    await page.goto(url);

    const listSize = await listLength(page, productCardSelector);
    console.log("List size: ", listSize, "- URL: ", url);

    const productInfoSelectors = getProductInfoSelelectors(productTextSelector, listSize);
    const res = await Promise.all(productInfoSelectors.map(sel => extractProductData(page, sel)));

    await page.close();

    return res;
}

function getProductInfoSelelectors(mainProductInfoSel: string, listSize: number): string[]{
    const productInfoSelectors = [];
    for (let i = 1; i <= listSize; i++) {
        const productInfoSel = mainProductInfoSel.replace("INDEX", `${i}`);
        productInfoSelectors.push(productInfoSel);
    }

    return productInfoSelectors;
}

async function listLength(page: Page, pageSelector: string): Promise<number>{
    return await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
    }, pageSelector);
}

async function extractProductData(page: Page, pageSelector: string): Promise<string>{
    const value =  await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);

    if(!value) throw new Error("Information about product not found");

    return value;
}


async function getNumPages(browser: Browser, pageSelector: string, numProductPerPage: number, mainUrl: string): Promise<number>{
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const initialUrl = mainUrl.replace("PAGE_NUM", "1");
    await page.goto(initialUrl);

    const text = await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);

    console.log("Num Pages TEXT: ", text);

    await page.close();

    if(!text) throw new Error("Number of pages not found");

    const num = Number(text.split(" ")[0]);


    return Math.ceil(num/numProductPerPage);
}

start();














