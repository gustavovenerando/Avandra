import { Browser, Page } from "puppeteer";
import { ExtractedProductSelectorsI, PageExtractionI, ProductExtractionI, ExtractProductInfoI, ProductExtracted } from "./interface";
import { injectable, inject } from "inversify";
import TaskExecution from "../TaskExecution";
import ElemExtraction from "../ElemExtraction";
import { PAGE_INFO_CHUNK_SIZE, PRODUCT_SELECTOR_CHUNK_SIZE, siteArr } from "../../global";
import Puppeteer from "../Puppeteer";

@injectable()
class Showcase {
    constructor(
        @inject(TaskExecution) private taskExecution: TaskExecution,
        @inject(ElemExtraction) private elemExtraction: ElemExtraction,
        @inject(Puppeteer) private puppeteer: Puppeteer,
    ) {
        this.extracPageData = this.extracPageData.bind(this);
        this.extractProductData = this.extractProductData.bind(this);
    }

    async extract(): Promise<ProductExtracted[] | undefined> {
        try {
            const browser = await this.puppeteer.newBrowser();

            const allSitePagesInfoToExtractData = await this.getAllSitesPagesInfo(browser, siteArr);

            const pageExtractionInfo: PageExtractionI = {
                puppeteerClass: browser,
                extractionData: allSitePagesInfoToExtractData,
                chunkSize: PAGE_INFO_CHUNK_SIZE,
                extractFunction: this.extracPageData
            }

            const products = await this.taskExecution.executeExtraction(pageExtractionInfo);

            console.log("Products extracted: ", products);

            await browser.close();

            return products;

        } catch (err: any) {
            console.error("Error extracting products. Error: ", err);
        }
    }

    async getAllSitesPagesInfo(browser: Browser, siteArr: any[]): Promise<any[]> {
        const sitesPagesInfo = [];

        for (let siteInfo of siteArr) {
            const numPages = await this.getNumPages(browser, siteInfo);
            console.log("Number of pages: ", numPages);

            sitesPagesInfo.push(...this.getSitePagesInfo(numPages, siteInfo));
        }

        return sitesPagesInfo;
    }

    getSitePagesInfo(numPages: number, siteInfo: any): any[] {
        const { extractUrl, ...productSelectors } = siteInfo;

        const pagesInfo = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const url = extractUrl.replace("PAGE_NUM", `${pageNum}`);
            pagesInfo.push({ url, ...productSelectors });
        }

        return pagesInfo;
    }

    async extracPageData(browser: Browser, pageInfo: any): Promise<any[]> {
        try {
            const {
                url,
                baseUrl,
                site,
                type,
                productNameSelector,
                productCardSelector,
                productEndpointSelector,
                soldOutSelector
            } = pageInfo;

            const page = await this.puppeteer.gotoNewPage(browser, url);

            if(!page) throw new Error("Couldnt go to new page.");

            const listSize = await this.elemExtraction.listLength(page, productCardSelector);
            console.log("List size: ", listSize, "- URL: ", url);

            const extractProductInfo: ExtractProductInfoI = {
                name: productNameSelector,
                soldOut: soldOutSelector,
                endpoint: productEndpointSelector,
                baseUrl,
                site,
                type
            }

            const productInfoSelectors = this.getProductInfoSelelectors(extractProductInfo, listSize);

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

    async extractProductData(page: Page, extractProductInfo: ExtractProductInfoI) {
        try {
            let resultObj: ExtractedProductSelectorsI = {};
            const { baseUrl, site, type, ...productSelectors } = extractProductInfo;

            for (const [key, selector] of Object.entries(productSelectors)) {
                switch (key) {
                    case "soldOut":
                        const isSoldOut = await this.elemExtraction.getText(page, selector, true);
                        resultObj[key] = !!isSoldOut;
                        break;
                    case "endpoint":
                        const endpoint = await this.elemExtraction.getHref(page, selector);
                        if (endpoint.includes("http")) resultObj["url"] = endpoint;
                        else resultObj["url"] = baseUrl + endpoint;
                        break;
                    default:
                        resultObj[key] = await this.elemExtraction.getText(page, selector);
                        break;
                }
                resultObj.site = site;
                resultObj.type = type;
            }
            return resultObj;

        } catch (err: any) {
            err.productSelectors = extractProductInfo;
            throw err;
        }
    }

    getProductInfoSelelectors(extractProductInfo: ExtractProductInfoI, listSize: number): any[] {
        const productInfoSelectors = [];
        for (let i = 1; i <= listSize; i++) {
            const filledProductSelectors: ExtractProductInfoI = {};

            for (const [key, selector] of Object.entries(extractProductInfo)) {
                if (!selector) continue;
                filledProductSelectors[key] = selector.replace("INDEX", `${i}`);
            }

            productInfoSelectors.push(filledProductSelectors);
        }

        return productInfoSelectors;
    }

    async getNumPages(browser: Browser, siteInfo: any): Promise<number> {
        try {
            const { extractUrl, numProductSelectorType, numProductSelector, productCardSelector } = siteInfo;

            const initialUrl = extractUrl.replace("PAGE_NUM", "1");

            const page = await this.puppeteer.gotoNewPage(browser, initialUrl);

            if(!page) throw new Error("Couldnt go to new page.");

            let numPages;
            switch (numProductSelectorType) {
                case "pagination":
                    numPages = await this.getPaginationNumber(page, numProductSelector);
                    break;
                case "total":
                    const numProductPerPage = await this.elemExtraction.listLength(page, productCardSelector);
                    numPages = await this.getProductsCountNumber(page, numProductSelector, numProductPerPage);
                    break;
            }

            await page.close();

            return numPages!;

        } catch (err: any) {
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

        if (!paginationText) throw new Error("Pagination text not found.");

        return Number(paginationText);
    }

    async getProductsCountNumber(page: Page, numProductSelector: string, numProductPerPage: number): Promise<number> {
        const productsCountText = await this.elemExtraction.getText(page, numProductSelector);

        if (!productsCountText) throw new Error(`Products count text not found. Selector: ${numProductSelector} - Page: ${page.url()}`);

        const num = Number(productsCountText.split(" ")[0]);

        return Math.ceil(num / numProductPerPage);
    }
}

export default Showcase;
