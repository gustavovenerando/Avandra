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
    (page: Page, productSelectors: ProductSelectorsI): Promise<ProductSelectorsI>;
}

interface PageExtractionI extends ExtractionI{
    extractFunction: ExtractPageDataI;
}

interface ProductExtractionI extends ExtractionI{
    extractFunction: ExtractProductDataI;
}

interface ProductSelectorsI {
    [key: string]: string
}

const siteArr = [
    {
        site: "pichau",
        numProductSelectorType: "total",
        extractUrl: "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM",
        baseUrl: "https://www.pichau.com.br",
        numProductSelector : 'div[class="MuiContainer-root"] .MuiGrid-item > div:nth-child(1) > div > div > div > div',
        productCardSelector : 'a[data-cy="list-product"]',
        productNameSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > h2',
        pricePixSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div > div > div:nth-child(3)',
        priceCreditSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div:nth-child(3) > div > div',
        productUrlSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) > a',
        soldOutSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > p',
    },
    // {
    //     site: "kabum",
    //     numProductSelectorType: "total",
    //     extractUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
    //     numProductSelector : "#listingCount",
    //     productCardSelector : ".productCard",
    //     productNameSelector: 'div.sc-cdc9b13f-7:nth-child(INDEX) > a:nth-child(2) > div:nth-child(2) span[class="sc-d79c9c3f-0 nlmfp sc-cdc9b13f-16 eHyEuD nameCard"]',
    // },
    // {
    //     site: "gkinfostore",
    //     numProductSelectorType: "pagination",
    //     extractUrl: "https://www.gkinfostore.com.br/placa-de-video?pagina=PAGE_NUM",
    //     numProductSelector : ".ordenar-listagem.rodape.borda-alpha .pagination > ul",
    //     productCardSelector : "#corpo #listagemProdutos .listagem-item",
    //     productNameSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
    // },
]

async function start() {
    const browser = await puppeteer.launch({ headless: false });

    //TO-DO: add tratativa de erro (try catch)
    //TO-DO: add novos sites
    //TO-DO: add novos selectors para preco parcelado, preco a vista e link do produto
    //TO-DO: add tratativa regex para conseguir o modelo do produto do titulo
    //TO-DO: refatorar selectors da kabum e da pichau
    //TO-DO: resolver casos onde produto está esgotado e não possui os selectors de preço - Ver como sera nos outros sites

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

    for (let siteInfo of siteArr) {
        const numPages = await getNumPages(browser, siteInfo);
        console.log("Number of pages: ", numPages);

        sitesPagesInfo.push(...getSitePagesInfo(numPages, siteInfo));
    }

    return sitesPagesInfo;
}

function getSitePagesInfo(numPages: number, siteInfo: any): any[]{
    const { extractUrl, ...productSelectors } = siteInfo;

    const pagesInfo = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const url = extractUrl.replace("PAGE_NUM", `${pageNum}`);
        pagesInfo.push({url, ...productSelectors});
    }

    return pagesInfo;
}

async function extracPageData(browser: Browser, pageInfo: any): Promise<any[]>{
    const { 
        url, 
        productNameSelector, 
        productCardSelector,
        pricePixSelector,
        priceCreditSelector,
        productUrlSelector,
        soldOutSelector
    } = pageInfo;

    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    await page.goto(url);

    const listSize = await listLength(page, productCardSelector);
    console.log("List size: ", listSize, "- URL: ", url);

    const productSelectors: ProductSelectorsI = {
        name: productNameSelector,
        pricePix: pricePixSelector,
        priceCredit: priceCreditSelector,
        soldOut: soldOutSelector
        // url: productUrlSelector
    }

    const productInfoSelectors = getProductInfoSelelectors(productSelectors, listSize);

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

//Extrair dados de todos os seletors do produto
async function extractProductData(page: Page, productSelectors: ProductSelectorsI){
    let resultObj: ProductSelectorsI = { };
    // const {soldOutSelector} = productSelectors;
    //
    // const isSoldOut = await getElementText(page, soldOutSelector); 
    // if(isSoldOut){
    //     delete productSelectors.pricePixSelector;
    //     delete productSelectors.priceCreditSelector;
    //     resultObj.soldOut = "true";
    // }
    // else{
    //     resultObj.soldOut = "false";
    // }

    for(const [key, selector] of Object.entries(productSelectors)){
        switch (key){
            // case "url":
                // resultObj[key] = await ;
            default:
                resultObj[key] = await getElementText(page, selector);
                break;
        }
    } 

    return resultObj;
}

function getProductInfoSelelectors(productSelectors: ProductSelectorsI, listSize: number): any[]{
    const productInfoSelectors = [];
    for (let i = 1; i <= listSize; i++) {
        const filledProductSelectors: ProductSelectorsI = {};

        for(const [key, selector] of Object.entries(productSelectors)){
            filledProductSelectors[key] = selector.replace("INDEX", `${i}`);
        }

        productInfoSelectors.push(filledProductSelectors);
    }

    return productInfoSelectors;
}

async function listLength(page: Page, pageSelector: string): Promise<number>{
    return await page.evaluate((selector) => {
        return document.querySelectorAll(selector).length;
    }, pageSelector);
}

async function getElementText(page: Page, textSelector: string): Promise<string>{
    const value = await page.evaluate((selector) => {
        return document.querySelector(selector)?.textContent;
    }, textSelector);

    if(!value){
        // console.error("Information about product not found. Text selector: " + textSelector + " - URL: " + page.url());
        return "";
    } 

    return value;
}


async function getNumPages(browser: Browser, siteInfo:any): Promise<number> {
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });

    const { extractUrl, numProductSelectorType, numProductSelector, productCardSelector} = siteInfo;

    const initialUrl = extractUrl.replace("PAGE_NUM", "1");
    await page.goto(initialUrl);

    let numPages;
    if (numProductSelectorType === "pagination") {
        numPages = await getPaginationNumber(page, numProductSelector);
    }else if(numProductSelectorType === "total"){
        const numProductPerPage = await listLength(page, productCardSelector);
        numPages = await getProductsCountNumber(page, numProductSelector, numProductPerPage);
    }

    await page.close();

    return numPages!;
}

async function getPaginationNumber(page: Page, numProductSelector: string): Promise<number> {
    const paginationText = await page.evaluate((selector) => {
        const paginationElem = document.querySelector(selector);
        const paginagionChildren = paginationElem?.children;

        if (!paginagionChildren) throw new Error("Pagination children not found");

        const lastPageElem = paginagionChildren[paginagionChildren.length - 2];

        return lastPageElem.textContent;
    }, numProductSelector);

    if(!paginationText) throw new Error("Pagination text not found.");

    return Number(paginationText);
}

async function getProductsCountNumber(page: Page, numProductSelector: string, numProductPerPage: number): Promise<number> {
    const productsCountText = await getElementText(page, numProductSelector);

    if(!productsCountText) throw new Error("Products count text not found.");

    const num = Number(productsCountText.split(" ")[0]);

    return Math.ceil(num/numProductPerPage);
}


start();














