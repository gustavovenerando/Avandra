import {Browser, Page, BrowserContext} from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { ExtractedProductSelectorsI, PageExtractionI, ProductExtractionI, ProductSelectorsI } from "./interface";
import { injectable, inject } from "inversify";
import TaskExecution from "../TaskExecution";
import ElemExtraction from "../ElemExtraction";
import { PAGE_INFO_CHUNK_SIZE, PRODUCT_SELECTOR_CHUNK_SIZE, siteArr} from "../global";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true}));

//TO-DO: add novos sites
//TO-DO: add novos selectors para preco parcelado, preco a vista e link do produto
//TO-DO: add tratativa regex para conseguir o modelo do produto do titulo
//TO-DO: Modelar estrutura do banco e tabelas (MySql)
@injectable()
class Catalog{
    constructor(
        @inject(TaskExecution) private taskExecution:TaskExecution,
        @inject(ElemExtraction) private elemExtraction:ElemExtraction,
    ){
        this.extracPageData = this.extracPageData.bind(this);
        this.extractProductData = this.extractProductData.bind(this);
    }

    async execute() {
        try {
            const browser = await puppeteer.launch({
                headless: false,
                args: ["--no-sandbox"]
            });

            const allSitePagesInfoToExtractData = await this.getAllSitesPagesInfo(browser, siteArr);

            const pageExtractionInfo: PageExtractionI = {
                puppeteerClass: browser,
                extractionData: allSitePagesInfoToExtractData,
                chunkSize: PAGE_INFO_CHUNK_SIZE,
                extractFunction: this.extracPageData
            }

            const result = await this.taskExecution.executeExtraction(pageExtractionInfo);

            console.log("Final Result: ", result);

            await browser.close();

        } catch (err: any) {
            console.error("Error extracting info. Error: ", err);
        }
    }

    async getAllSitesPagesInfo(browser: Browser, siteArr: any[]): Promise<any[]>{
        const sitesPagesInfo = [];

        for (let siteInfo of siteArr) {
            const numPages = await this.getNumPages(browser, siteInfo);
            console.log("Number of pages: ", numPages);

            sitesPagesInfo.push(...this.getSitePagesInfo(numPages, siteInfo));
        }

        return sitesPagesInfo;
    }

    getSitePagesInfo(numPages: number, siteInfo: any): any[]{
        const { extractUrl, ...productSelectors } = siteInfo;

        const pagesInfo = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        // for (let pageNum = 1; pageNum <= 1; pageNum++) {
            const url = extractUrl.replace("PAGE_NUM", `${pageNum}`);
            pagesInfo.push({url, ...productSelectors});
        }

        return pagesInfo;
    }

    // extracPageData = async (browser: Browser, pageInfo: any): Promise<any[]> =>{
    async extracPageData(browser: Browser, pageInfo: any): Promise<any[]> {
        try {
            const {
                url,
                productNameSelector,
                productCardSelector,
                pricePixSelector,
                priceCreditSelector,
                productEndpointSelector,
                soldOutSelector
            } = pageInfo;

            const page = await browser.newPage();
            await page.setViewport({
                width: 1600,
                height: 1200,
            });

            //Blocking image, font and styles requests to improve performance
            await page.setRequestInterception(true);
            page.on('request', req => {
                if (["stylesheet", "font", "image"].includes(req.resourceType()))
                req.abort();
                else
                req.continue();
            })

            await page.goto(url, { waitUntil: "domcontentloaded" });

            const listSize = await this.elemExtraction.listLength(page, productCardSelector);
            console.log("List size: ", listSize, "- URL: ", url);

            const productSelectors: ProductSelectorsI = {
                name: productNameSelector,
                pricePix: pricePixSelector,
                priceCredit: priceCreditSelector,
                soldOut: soldOutSelector,
                endpoint: productEndpointSelector
            }

            const productInfoSelectors = this.getProductInfoSelelectors(productSelectors, listSize);

            const productExtractionInfo: ProductExtractionI = {
                puppeteerClass: page,
                extractionData: productInfoSelectors,
                chunkSize: PRODUCT_SELECTOR_CHUNK_SIZE,
                extractFunction: this.extractProductData
            }

            const result = await this.taskExecution.executeExtraction(productExtractionInfo);

            await page.close();

            return result;

        } catch (err: any) {
            err.url = pageInfo.url;
            throw err;
        }
    }

    async extractProductData(page: Page, productSelectors: ProductSelectorsI){
        try {
            let resultObj: ExtractedProductSelectorsI = {};

            for (const [key, selector] of Object.entries(productSelectors)) {
                switch (key) {
                    case "soldOut":
                        const isSoldOut = await this.elemExtraction.getText(page, selector);
                        if (isSoldOut) resultObj[key] = true;
                        else resultObj[key] = false;
                        break;
                    case "endpoint":
                        resultObj[key] = await this.elemExtraction.getHref(page, selector);
                        break;
                    default:
                        resultObj[key] = await this.elemExtraction.getText(page, selector);
                        break;
                }
            }
            return resultObj;

        } catch (err: any) {
            err.productSelectors = productSelectors;
            throw err;
        }
    }

    getProductInfoSelelectors(productSelectors: ProductSelectorsI, listSize: number): any[]{
        const productInfoSelectors = [];
        for (let i = 1; i <= listSize; i++) {
            const filledProductSelectors: ProductSelectorsI = {};

            for(const [key, selector] of Object.entries(productSelectors)){
                if(!selector) continue;
                filledProductSelectors[key] = selector.replace("INDEX", `${i}`);
            }

            productInfoSelectors.push(filledProductSelectors);
        }

        return productInfoSelectors;
    }

    async getNumPages(browser: Browser, siteInfo:any): Promise<number> {
        try {
            const page = await browser.newPage();
            await page.setViewport({
                width: 1600,
                height: 1200,
            });

            //Blocking image, font and styles requests to improve performance
            await page.setRequestInterception(true);
            page.on('request', req => {
                if (["stylesheet", "font", "image"].includes(req.resourceType()))
                req.abort();
                else
                req.continue();
            })

            const { extractUrl, numProductSelectorType, numProductSelector, productCardSelector } = siteInfo;

            const initialUrl = extractUrl.replace("PAGE_NUM", "1");
            await page.goto(initialUrl, { waitUntil: "domcontentloaded" });

            let numPages;
            if (numProductSelectorType === "pagination") {
                numPages = await this.getPaginationNumber(page, numProductSelector);
            } else if (numProductSelectorType === "total") {
                const numProductPerPage = await this.elemExtraction.listLength(page, productCardSelector);
                numPages = await this.getProductsCountNumber(page, numProductSelector, numProductPerPage);
            }

            await page.close();

            return numPages!;

        } catch(err: any){
            console.error("Error getting number of pages.");
            throw err;
        }
    }

    async getPaginationNumber(page: Page, numProductSelector: string): Promise<number> {
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

    async getProductsCountNumber(page: Page, numProductSelector: string, numProductPerPage: number): Promise<number> {
        const productsCountText = await this.elemExtraction.getText(page, numProductSelector);

        if(!productsCountText) throw new Error("Products count text not found.");

        const num = Number(productsCountText.split(" ")[0]);

        return Math.ceil(num/numProductPerPage);
    }
}

export default Catalog;
