import { inject, injectable } from "inversify";
import Showcase from "../Product";
import Puppeteer from "../Puppeteer";
import TaskExecution from "../TaskExecution";
import { Browser } from "puppeteer";
import { siteArr } from "../../global";
import ElemExtraction from "../ElemExtraction";
import { CatalogProductI, ProductDetailInfoI } from "./interface";
import CatalogRepository from "../../infra/database/mysql/repository/Catalog";

@injectable()
class Catalog {
    constructor(
        @inject(Showcase) private showcase: Showcase,
        @inject(Puppeteer) private puppeteer: Puppeteer,
        @inject(TaskExecution) private taskExecution: TaskExecution,
        @inject(ElemExtraction) private elemExtraction: ElemExtraction,
        @inject(CatalogRepository) private catalogRepository: CatalogRepository
    ) { 
        this.extractProductDetails = this.extractProductDetails.bind(this);
    }

    async extract() {
        try {
            //Com o banco, realizar processamento somente os produtos que nao tiverem no banco
            //Ou seja, sem os campos price, modelo etc...
            //Filtrar os que nao estao soldOut
            const products = await this.showcase.extract();

            if(!products) throw new Error("No products found!");

            const browser = await this.puppeteer.newBrowser();

            // Array de urls
            const allProductDetailInfoData = products.map(product => {
                const siteInfo = siteArr.find(elem => elem.site === product.site);

                if(!siteInfo) return;

                const { catalog } = siteInfo;

                return {
                    ...product,
                    catalog
                };
            });

            if(!allProductDetailInfoData || !allProductDetailInfoData.length){
                throw new Error("Couldnt make catalog processing. No data available.");
            }

            const testArr = allProductDetailInfoData.slice(0, 9);

            console.log("==============>>>> Aloha: ", testArr);

            const catalogExtractionInfo: any = {
                puppeteerClass: browser,
                // extractionData: allProductDetailInfoData,
                extractionData: testArr,
                chunkSize: 10,
                extractFunction: this.extractProductDetails
            };

            console.log("=======>> Starting process");

            const aloha = await this.taskExecution.executeExtraction(catalogExtractionInfo);

            console.log("=======>> Saving to db: ", aloha);

            await this.catalogRepository.bulkCreate(aloha);

            console.log("=======>> Saved sucessfully.");

            await browser.close();
        } catch (err) {
            console.error("Error to fill Catalog. Error: ", err);
        }
    }

    async extractProductDetails(browser: Browser, productDetailInfo: ProductDetailInfoI): Promise<CatalogProductI> {
        const { url, name, soldOut, site, catalog: { nameRegex, selectors } } = productDetailInfo;

        const page = await this.puppeteer.gotoNewPage(browser, url);

        try {
            if(!page) throw new Error("Couldnt go to new page.");

            if(!selectors) throw new Error("Couldnt find caltalog selectors!");

            let resultObj: any = { };

            if (nameRegex) {
                for (const [key, regex] of Object.entries(nameRegex)) {
                    const foundMatch = name.match(regex);

                    if (!foundMatch) resultObj[key] = "";
                    else resultObj[key] = foundMatch[0];
                }
            }

            for (const [key, selector] of Object.entries(selectors)) {
                switch (key) {
                    case "brand":
                        let brand = await this.elemExtraction.getText(page, selector);
                        if(site === 'kabum') brand = brand.split(":")[1].trim();  
                        resultObj[key] = brand;
                        break;
                    default:
                        resultObj[key] = await this.elemExtraction.getText(page, selector);
                        break;
                }
            }

            resultObj.site = site;
            resultObj.soldOut = soldOut;
            resultObj.url = url;
            resultObj.name = name;

            console.log("=====> Result: ", resultObj);

            return resultObj;
        } catch (err: any) {
            err.url = url;
            throw err;
        } finally {
            await page.close();
        }
    }
}

export default Catalog;
