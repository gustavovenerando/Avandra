import {Browser, Page, BrowserContext} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true}));


//SELECTORS/INFO - KABUM 
// const pageSize = 100;
// const searchUrl = "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched";
// const productTextSelector = 'div.sc-cdc9b13f-7:nth-child(INDEX) > a:nth-child(2) > div:nth-child(2) span[class="sc-d79c9c3f-0 nlmfp sc-cdc9b13f-16 eHyEuD nameCard"]';
// const searchProductsCountSelector = "#listingCount";
// const listClassSelector = ".productCard";


// SELECTORS/INFO - PICHAU 
const pageSize = 36;
const searchUrl = "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM";
const productTextSelector = 'div.MuiGrid-grid-xs-6:nth-child(INDEX) > a:nth-child(1) > div:nth-child(1) > div:nth-child(3) > h2:nth-child(1)';
const searchProductsCountSelector = "div.MuiGrid-grid-lg-10 > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(1) > div";
const listClassSelector = 'a[data-cy="list-product"]';

async function start() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const num_pages = await numPages(page, searchProductsCountSelector);
    console.log("Number of pages: ", num_pages);

    const arr = [];
    for (let pageNum = 1; pageNum <= num_pages; pageNum++) {
        if(pageNum !== 1){
            const url = searchUrl.replace("PAGE_NUM", `${pageNum}`);
            await page.goto(url);
        }

        const listSize = await listLength(page, listClassSelector);
        console.log("List size: ", listSize);

        for (let i = 1; i <= listSize; i++) {
            const productTextSel = productTextSelector.replace("INDEX", `${i}`);
            const productTextValue = await getValue(page, productTextSel);

            arr.push({
                productTextValue
            })
        }
    }

    console.log("PRODUCTS: ", arr);
}

async function listLength(page: Page, pageSelector: string): Promise<number>{
    return await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
    }, pageSelector);
}

async function getValue(page: Page, pageSelector: string): Promise<string | null | undefined>{
    return await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);
}


async function numPages(page: Page, pageSelector: string): Promise<number>{
    const initialUrl = searchUrl.replace("PAGE_NUM", "1");
    await page.goto(initialUrl);

    const text = await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, pageSelector);

    console.log("Num Pages TEXT: ", text);

    if(!text) throw new Error("Number of pages not found");

    const num = Number(text.split(" ")[0]);

    return Math.ceil(num/pageSize);
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

    const num_pages = await numPages(page, searchProductsCountSelector);
    console.log("Products Count: ", num_pages);

    const ctxArr = [];
    // for (let pageNum = 1; pageNum <= num_pages; pageNum++) {
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
    const listSize = await listLength(page, listClassSelector);

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














