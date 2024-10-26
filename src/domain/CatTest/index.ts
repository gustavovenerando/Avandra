import { Browser, Page } from "puppeteer";
import { ExtractedProductSelectorsI, PageExtractionI, ProductExtractionI, ExtractProductInfoI, ProductExtractedI } from "./interface";
import { injectable, inject } from "inversify";
import TaskExecution from "../TaskExecution";
import ElemExtraction from "../ElemExtraction";
import { PAGE_INFO_CHUNK_SIZE, PRODUCT_SELECTOR_CHUNK_SIZE, siteArr } from "../../global";
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
        // this.extracPageData = this.extracPageData.bind(this);
        this.extractProductData = this.extractProductData.bind(this);
    }

    async extract(): Promise<ProductExtractedI[] | undefined> {
        try {
            const browser = await this.puppeteer.newBrowser();

            const siteInfoArr = siteArr.map(site => {
                const resultArr = [];
                for(let [typeKey, typeValue] of Object.entries(site.type)){
                    resultArr.push({
                        extractProductInfo: {
                            name: site.selectors.catalog.productNameSelector,
                            soldOut: site.selectors.catalog.soldOutSelector,
                            endpoint: site.selectors.catalog.productEndpointSelector,
                            baseUrl: site.baseUrl,
                            site: site.site, 
                            type: typeKey,
                            nameRegex: typeValue.nameRegex
                        },
                        commonSelectors: site.selectors.common,
                        extractUrl: typeValue.extractUrl,
                    });
                }

                return resultArr;
            }).flat();

            const allSitePagesInfoToExtractData = await this.getAllSitesPagesInfo(browser, siteInfoArr);

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

    async extractProductData(page: Page, extractProductInfo: ExtractProductInfoI): Promise<any> {
        try {
            let resultObj: any = {};
            const { site, baseUrl, type, nameRegex, ...productSelectors } = extractProductInfo;

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
