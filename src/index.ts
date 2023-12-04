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
        productSelector : 'a[data-cy="list-product"]',
    },
    {
        site: "kabum",
        numProductPerPage: 100,
        mainUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
        productTextSelector: 'div.sc-cdc9b13f-7:nth-child(INDEX) > a:nth-child(2) > div:nth-child(2) span[class="sc-d79c9c3f-0 nlmfp sc-cdc9b13f-16 eHyEuD nameCard"]',
        productCountSelector : "#listingCount",
        productSelector : ".productCard",
    },
]

async function start() {
    const browser = await puppeteer.launch({ headless: false });

    //TO-DO: limit number of pages concurrently (batches)
    //TO-DO: add novos sites
    
    const urlArr = [];
    for (let { numProductPerPage, mainUrl, productCountSelector, ...productSelectors } of siteArr) {
        const page = await browser.newPage();
        await page.setViewport({
            width: 1600,
            height: 1200,
        });
        const numPages = await getNumPages(page, productCountSelector, numProductPerPage, mainUrl);
        page.close();
        console.log("Number of pages: ", numPages);

        urlArr.push(...getUrlArr(numPages, mainUrl, productSelectors));
    }

    const result = await Promise.all(urlArr.map(elem => extracPageData(browser, elem.url, elem.productTextSelector, elem.productSelector)));

    console.log("Final Result: ", result);

    await browser.close();
}

function getUrlArr(numPages: number, mainUrl: string, productSelectors: any): any[]{
    const urlArr = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const url = mainUrl.replace("PAGE_NUM", `${pageNum}`);
        urlArr.push({url, ...productSelectors});
    }

    return urlArr;
}

async function extracPageData(browser: Browser ,url: string, productTextSelector: string, productSelector: string){
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    await page.goto(url);


    const listSize = await listLength(page, productSelector);
    console.log("List size: ", listSize, "- URL: ", url);

    const productInfoSelArr = getProductInfoSelArr(productTextSelector, listSize);
    const res = await Promise.all(productInfoSelArr.map(sel => extractProductsData(page, sel)));

    await page.close();

    return res;
}

function getProductInfoSelArr(mainProductInfoSel: string, listSize: number): string[]{
    const selArr = [];
    for (let i = 1; i <= listSize; i++) {
        const productInfoSel = mainProductInfoSel.replace("INDEX", `${i}`);
        selArr.push(productInfoSel);
    }

    return selArr;
}

async function listLength(page: Page, pageSelector: string): Promise<number>{
    return await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
    }, pageSelector);
}

async function extractProductsData(page: Page, pageSelector: string): Promise<string>{
    const value =  await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);

    if(!value) throw new Error("Information about product not found");

    return value;
}


async function getNumPages(page: Page, pageSelector: string, numProductPerPage: number, mainUrl: string): Promise<number>{
    const initialUrl = mainUrl.replace("PAGE_NUM", "1");
    await page.goto(initialUrl);

    const text = await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);

    console.log("Num Pages TEXT: ", text);

    if(!text) throw new Error("Number of pages not found");

    const num = Number(text.split(" ")[0]);

    return Math.ceil(num/numProductPerPage);
}

//Start 2 - Paginas e browsers em paralelo
/*
const PVUrl = "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched"
async function start(){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const numPages = await getNumPages(page, productCountSelector);
    console.log("Products Count: ", numPages);

    const ctxArr = [];
    // for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
        ctxArr.push(createContext(browser, pageNum));
    }

    const res = await Promise.all(ctxArr);

    await browser.close();

    console.log("===> Result:  ", res);
}

async function createContext(browser: Browser, pageNum: number) {
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const url = PVUrl.replace("PAGE_NUM", `${pageNum}`);

    await page.goto(url);
    const listSize = await listLength(page, productSelector);

    const resArr = []
    // for (let i = 1; i <= listSize; i++) {
    for (let i = 1; i <= 5; i++) {
        const productTextSel = productTextSelector.replace("INDEX", `${i}`);
        resArr.push(getInfo(productTextSel, context, url));
    }

    const res = await Promise.all(resArr);

    await context.close();

    console.log("Result Context: ", res);

    return res;
}

async function getInfo(productTextSel: string, context: BrowserContext, url: any) {
    const page = await context.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });
    await page.goto(url);

    await page.click(productTextSel);

    const productUrl = page.url();

    await page.close();

    return productUrl;
}
*/

start();














