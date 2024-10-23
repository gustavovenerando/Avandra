import { Browser, Page } from "puppeteer";
import { ExtractedProductSelectorsI, PageExtractionI, ProductExtractionI, ExtractProductInfoI, ProductExtractedI } from "./interface";
import { injectable, inject } from "inversify";
import TaskExecution from "../TaskExecution";
import ElemExtraction from "../ElemExtraction";
import { PAGE_INFO_CHUNK_SIZE, PRODUCT_SELECTOR_CHUNK_SIZE, siteArr, siteArr } from "../../global";
import Puppeteer from "../Puppeteer";
import Test from "../Test";

@injectable()
class CatTest extends Test {
    constructor(
        @inject(TaskExecution) protected taskExecution: TaskExecution,
        @inject(ElemExtraction) protected elemExtraction: ElemExtraction,
        @inject(Puppeteer) protected puppeteer: Puppeteer,
    ) {
        super(taskExecution, elemExtraction, puppeteer);
        this.extracPageData = this.extracPageData.bind(this);
        this.extractProductData = this.extractProductData.bind(this);
    }

    async extract(): Promise<ProductExtractedI[] | undefined> {
        try {
            const browser = await this.puppeteer.newBrowser();

            const siteInfoArr = siteArr.map(site => {

            });

            const x = [
                {
                    // Vai para extracPageData
                    extractProductInfo: {
                        // name: productNameSelector,
                        // soldOut: soldOutSelector,
                        // endpoint: productEndpointSelector,
                        // baseUrl: ,
                        // site: "kabum", 
                        // type: "gpu",
                        // nameRegex: {}
                    },
                    commonSelectors: {
                        numProductSelector: "#listingCount",
                        productCardSelector: ".productCard",
                        numProductSelectorType: "total",
                    },
                    extractUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
                },
                {
                    type: "cpu",
                    
                }
            ]

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


    // async extracPageData(browser: Browser, pageInfo: any): Promise<any[]> {
    async extracPageData(browser: Browser, pageInfo: any): Promise<any[]> {
        // const { url, productCardSelector, extractProductInfo } = pageInfo;
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
}

export default CatTest;
