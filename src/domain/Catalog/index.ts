import { inject, injectable } from "inversify";
import Product from "../Product";
import Puppeteer from "../Puppeteer";
import TaskExecution from "../TaskExecution";
import puppeteer, { Browser } from "puppeteer";
import { productDetailArr } from "../../global";

@injectable()
class Catalog {
    constructor(
        @inject(Product) private product: Product,
        @inject(Puppeteer) private puppeteer: Puppeteer,
        @inject(TaskExecution) private taskExecution: TaskExecution,
    ) { 
        this.extractProductDetails = this.extractProductDetails.bind(this);
    }

    async extract() {
        try {
            //Com o banco, realizar processamento somente os produtos que nao tiverem no banco
            //Ou seja, sem os campos price, modelo etc...
            const products = await this.product.extract();

            if(!products) throw new Error("No products found!");

            const browser = await this.puppeteer.newBrowser();

            // Array de urls
            const allProductDetailInfoData = products.map(elem => {
                const x = productDetailArr.find(elem2 => elem2.site === elem.site)
                return {
                    ...elem,
                    ...x
                }
            });

            // console.log("==============>>>> Aloha: ", allProductDetailInfoData);

            const pageExtractionInfo: any = {
                puppeteerClass: browser,
                extractionData: allProductDetailInfoData,
                chunkSize: 10,
                extractFunction: this.extractProductDetails
            };

            // const aloha = await this.taskExecution.executeExtraction(pageExtractionInfo);

            await browser.close();
        } catch (err) {
            console.error("Error to fill Catalog. Error: ", err);
        }
    }

    async extractProductDetails(browser: Browser, productDetailInfo: any) {
        //Abrir uma pagina para cada url e extrair as infos
        const { url, ...productDetailSelectors } = productDetailInfo;
        const page = await this.puppeteer.gotoNewPage(browser, url);
    }

}

export default Catalog;
