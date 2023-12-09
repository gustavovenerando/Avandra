import {Browser, Page, BrowserContext} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true}));

const PAGE_INFO_CHUNK_SIZE = 5;
const PRODUCT_SELECTOR_CHUNK_SIZE = 20;

interface ExtractionI{
    readonly puppeteerClass: any;
    chunkSize: number;
    extractionData: string[]; 
}

interface ExtractPageDataI{
    (browser: Browser, pageInfo: any): Promise<any[]>;
}

interface ExtractProductDataI{
    (page: Page, selector: string): Promise<string>;
}

interface PageExtractionI extends ExtractionI{
    extractFunction: ExtractPageDataI;
}

interface ProductExtractionI extends ExtractionI{
    extractFunction: ExtractProductDataI;
}

const siteArr = [
    {
        site: "pichau",
        numProductPerPage: 36,
        mainUrl: "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM",
        productCountSelector : "div.MuiGrid-grid-lg-10 > div:nth-child(1) > div > div:nth-child(1) > div:nth-child(1) > div",
        productCardSelector : 'a[data-cy="list-product"]',
        productTextSelector: 'div.MuiGrid-grid-xs-6:nth-child(INDEX) > a:nth-child(1) > div:nth-child(1) > div:nth-child(3) > h2:nth-child(1)',
    },
    {
        site: "kabum",
        numProductPerPage: 100,
        mainUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
        productCountSelector : "#listingCount",
        productCardSelector : ".productCard",
        productTextSelector: 'div.sc-cdc9b13f-7:nth-child(INDEX) > a:nth-child(2) > div:nth-child(2) span[class="sc-d79c9c3f-0 nlmfp sc-cdc9b13f-16 eHyEuD nameCard"]',
    },
    {
        site: "gkinfostore",
        numProductPerPage: 40,
        mainUrl: "https://www.gkinfostore.com.br/placa-de-video?pagina=PAGE_NUM",
        productCountSelector : null,
        paginationSelector : ".ordenar-listagem.rodape.borda-alpha .pagination > ul",
        productCardSelector : "#corpo #listagemProdutos .listagem-item",
        productTextSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
    },
]

async function start() {
    const browser = await puppeteer.launch({ headless: false });

    //TO-DO: add tratativa de erro (try catch)
    //TO-DO: add novos sites
    //TO-DO: add novos selectors para preco parcelado, preco a vista e link do produto
    //TO-DO: add tratativa regex para conseguir o modelo do produto do titulo
    //TO-DO: refatorar funcao numPages
    //TO-DO: refatorar selectors da kabum e da pichau
    //TO-DO: refatorar numProductPerPage para dentro da funcao numPages, não precisa ser chumbado no objeto
    //       (soh é utilizado quando há productCountSelector) 

    const allSitePagesInfoToExtractData = await getAllSitesPagesInfo(browser, siteArr);

    const pageExtractionInfo: PageExtractionI = {
        puppeteerClass: browser,
        extractionData: allSitePagesInfoToExtractData,
        chunkSize: PAGE_INFO_CHUNK_SIZE,
        extractFunction: extracPageData 
    }

    const result = await executeExtractionTask(pageExtractionInfo);

    console.log("Final Result: ", result);

    await browser.close();
}

async function executeExtractionTask(extractionInfo: PageExtractionI | ProductExtractionI){
    const {puppeteerClass, extractionData, chunkSize, extractFunction} = extractionInfo;

    const chunks = sliceArrayIntoChunks(extractionData, chunkSize);

    const result = [];
    for(let chunk of chunks){
        const chunkResult = await Promise.all(chunk.map(pageInfo => extractFunction(puppeteerClass, pageInfo)))
        result.push(...chunkResult);
    }

    return result;
}

function sliceArrayIntoChunks(arr:any[], chunkSize:number){
    const chunks = []
    let i = 0
    const n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += chunkSize))
    }

    return chunks;
}

async function getAllSitesPagesInfo(browser: Browser, siteArr: any[]): Promise<any[]>{
    const sitesPagesInfo = [];

    for (let { numProductPerPage, mainUrl, productCountSelector, paginationSelector, ...productSelectors } of siteArr) {
        const numPages = await getNumPages(browser, productCountSelector,paginationSelector, numProductPerPage, mainUrl);
        console.log("Number of pages: ", numPages);

        sitesPagesInfo.push(...getSitePagesInfo(numPages, mainUrl, productSelectors));
    }

    return sitesPagesInfo;
}

function getSitePagesInfo(numPages: number, mainUrl: string, productSelectors: any): any[]{
    const pagesInfo = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const url = mainUrl.replace("PAGE_NUM", `${pageNum}`);
        pagesInfo.push({url, ...productSelectors});
    }

    return pagesInfo;
}

async function extracPageData(browser: Browser, pageInfo: any): Promise<any[]>{
    const { url, productTextSelector, productCardSelector } = pageInfo;
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    await page.goto(url);

    const listSize = await listLength(page, productCardSelector);
    console.log("List size: ", listSize, "- URL: ", url);

    const productInfoSelectors = getProductInfoSelelectors(productTextSelector, listSize);

    const productExtractionInfo: ProductExtractionI = {
        puppeteerClass: page,
        extractionData: productInfoSelectors,
        chunkSize: PRODUCT_SELECTOR_CHUNK_SIZE,
        extractFunction: extractProductData 
    }

    const result = await executeExtractionTask(productExtractionInfo);

    await page.close();

    return result;
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


async function getNumPages(browser: Browser, productCountSelector: string | null, paginationSelector: string,numProductPerPage: number, mainUrl: string): Promise<number>{
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const initialUrl = mainUrl.replace("PAGE_NUM", "1");
    await page.goto(initialUrl);

    let text;

    if (!productCountSelector) {
        text = await page.evaluate((selector) => {
            const paginationElem = document.querySelector(selector);
            const paginagionChildren = paginationElem?.children;

            if(!paginagionChildren) throw new Error("Pagination children not found");

            const lastPageElem = paginagionChildren[paginagionChildren.length - 2];

            return lastPageElem.textContent;
        }, paginationSelector);

        return Number(text);
    } 

    text = await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, productCountSelector);

    await page.close();

    if(!text) throw new Error("Number of pages not found");

    const num = Number(text.split(" ")[0]);


    return Math.ceil(num/numProductPerPage);
}

start();














