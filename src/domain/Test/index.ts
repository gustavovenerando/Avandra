import { Browser, Page } from "puppeteer";
import { ExtractedProductSelectorsI, PageExtractionI, ProductExtractionI, ExtractProductInfoI, ProductExtractedI } from "./interface";
import { injectable, inject } from "inversify";
import TaskExecution from "../TaskExecution";
import ElemExtraction from "../ElemExtraction";
import { PAGE_INFO_CHUNK_SIZE, PRODUCT_SELECTOR_CHUNK_SIZE, siteArr } from "../../global";
import Puppeteer from "../Puppeteer";

class Test {
    constructor(
        protected taskExecution: TaskExecution,
        protected elemExtraction: ElemExtraction,
        protected puppeteer: Puppeteer,
    ) {
        this.extracPageData = this.extracPageData.bind(this);
        this.extractProductData = this.extractProductData.bind(this);
    }

    async extract(): Promise<ProductExtractedI[] | undefined> {
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

    // async getAllSitesPagesInfo(browser: Browser, siteInfoArr: any[]): Promise<any[]> {
    async getAllSitesPagesInfo(browser: Browser, siteArr: any[]): Promise<any[]> {
        const sitesPagesInfo = [];

        // for (let siteInfo of siteInfoArr) {
        for (let siteInfo of siteArr) {
            // const numPageInfo = {
            //     numPageSelectors: siteInfo.commonSelectors,
            //     extractUrl: siteInfo.extractUrl
            // }
            // const numPages = await this.getNumPages(browser, numPageInfo);
            const numPages = await this.getNumPages(browser, siteInfo);
            console.log("Number of pages: ", numPages);

            // sitesPagesInfo.push(...this.getSitePagesInfo(numPages, siteInfo));
            sitesPagesInfo.push(...this.getSitePagesInfo(numPages, siteInfo));
        }

        return sitesPagesInfo;
    }

    getSitePagesInfo(numPages: number, siteInfo: any): any[] {
        // const { extractUrl } = siteInfo;
        const { site, baseUrl, showcase: { extractUrl, selectors: showCaseSelectors } } = siteInfo;

        const pagesInfo = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const url = extractUrl.replace("PAGE_NUM", `${pageNum}`);
            pagesInfo.push({ site, url, baseUrl, showCaseSelectors });
            // pagesInfo.push({ url, ...siteInfo });
        }

        return pagesInfo;
    }

    async extracPageData(browser: Browser, pageInfo: any): Promise<any[]> {
        // const { url, commonSelectors: { productCardSelector }, extractProductInfo } = pageInfo;
        const { site, url, baseUrl, showCaseSelectors } = pageInfo;

        const page = await this.puppeteer.gotoNewPage(browser, url);

        try {

            const {
                productNameSelector,
                productCardSelector,
                productEndpointSelector,
                soldOutSelector
            } = showCaseSelectors;


            if(!page) throw new Error("Couldnt go to new page.");

            const listSize = await this.elemExtraction.listLength(page, productCardSelector);
            console.log("List size: ", listSize, "- URL: ", url);

            const extractProductInfo: ExtractProductInfoI = {
                name: productNameSelector,
                soldOut: soldOutSelector,
                endpoint: productEndpointSelector,
                baseUrl,
                site
            }

            const productInfoSelectors = this.getProductInfoSelelectors(extractProductInfo, listSize);

            const productExtractionInfo: ProductExtractionI = {
                puppeteerClass: page,
                extractionData: productInfoSelectors,
                chunkSize: PRODUCT_SELECTOR_CHUNK_SIZE,
                extractFunction: this.extractProductData
            }

            const result = await this.taskExecution.executeExtraction(productExtractionInfo);

            return result;
        } catch (err: any) {
            err.url = pageInfo.url;
            throw err;
        } finally {
            await page.close();
        }
    }

    async extractProductData(page: Page, extractProductInfo: ExtractProductInfoI) {
        try {
            let resultObj: ExtractedProductSelectorsI = {};
            const { site, baseUrl, ...productSelectors } = extractProductInfo;

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
        // const { numPageSelectors, extractUrl } = siteInfo;
        const { showcase: { extractUrl, selectors } } = siteInfo;
        // const { numProductSelectorType, numProductSelector, productCardSelector } = numPageSelectors;
        const { numProductSelectorType, numProductSelector, productCardSelector } = selectors;

        const initialUrl = extractUrl.replace("PAGE_NUM", "1");

        const page = await this.puppeteer.gotoNewPage(browser, initialUrl);

        if(!page) throw new Error("Couldnt go to new page.");

        let numPages;
        switch (numProductSelectorType) {
            case "pagination":
                numPages = await this.elemExtraction.getPaginationNumber(page, numProductSelector);
                break;
            case "total":
                const numProductPerPage = await this.elemExtraction.listLength(page, productCardSelector);
                numPages = await this.elemExtraction.getProductsCountNumber(page, numProductSelector, numProductPerPage);
                break;
        }

        await page.close();

        if(!numPages) throw new Error("Couldnt get number of pages!");

        return numPages;
    }
}

export default Test;
