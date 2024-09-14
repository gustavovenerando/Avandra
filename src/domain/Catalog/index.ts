import { inject, injectable } from "inversify";
import Showcase from "../Product";
import Puppeteer from "../Puppeteer";
import TaskExecution from "../TaskExecution";
import { Browser } from "puppeteer";
import { siteArr } from "../../global";

@injectable()
class Catalog {
    constructor(
        @inject(Showcase) private showcase: Showcase,
        @inject(Puppeteer) private puppeteer: Puppeteer,
        @inject(TaskExecution) private taskExecution: TaskExecution,
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

                const { catalog: { selectors: catalogSelectors } } = siteInfo;

                return {
                    ...product,
                    catalogSelectors
                };
            });

            // console.log("==============>>>> Aloha: ", allProductDetailInfoData);

            // const catalogExtractionInfo: any = {
            //     puppeteerClass: browser,
            //     extractionData: allProductDetailInfoData,
            //     chunkSize: 10,
            //     extractFunction: this.extractProductDetails
            // };

            // const aloha = await this.taskExecution.executeExtraction(catalogExtractionInfo);

            await browser.close();
        } catch (err) {
            console.error("Error to fill Catalog. Error: ", err);
        }
    }

    //Na global, juntar todas as variaveis em um unico array, ja separando os selectors entre showcase, catalog e price
    //Ja fazendo as mudancas necessaria nestas classes para receber este novo obj
    async extractProductDetails(browser: Browser, productDetailInfo: any) {
        //Abrir uma pagina para cada url e extrair as infos
        const { url, soldOut, site, catalogSelectors } = productDetailInfo;

        try {
            const page = await this.puppeteer.gotoNewPage(browser, url);

            // Extrair info dos elementos html
            let resultObj: any = {};

            for (const [key, selector] of Object.entries(catalogSelectors)) {
                switch (key) {
                    case "rms":
                    // const isSoldOut = await this.elemExtraction.getText(page, selector, true);
                    // resultObj[key] = !!isSoldOut;
                    // break;
                    case "vram":
                    // const endpoint = await this.elemExtraction.getHref(page, selector);
                    // if (endpoint.includes("http")) resultObj["url"] = endpoint;
                    //     else resultObj["url"] = baseUrl + endpoint;
                    // break;
                    default:
                        // resultObj[key] = await this.elemExtraction.getText(page, selector);
                        break;
                }
                // resultObj.site = site;
                // resultObj.type = type;
            }
            return resultObj;
        }
        catch (err: any) {
            err.url = url;
            throw err;
        }
    }
}

export default Catalog;
