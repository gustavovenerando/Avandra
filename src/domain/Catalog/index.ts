import { inject, injectable } from "inversify";
import Product from "../Product";
import Puppeteer from "../Puppeteer";

@injectable()
class Catalog {
    constructor(
        @inject(Product) private product: Product,
        @inject(Puppeteer) private puppeteer: Puppeteer,
    ) { }

    async extract() {
        try {
            const products = this.product.extract();

            if(!products) throw new Error("No products found!");

            const browser = await this.puppeteer.newBrowser();
        } catch (err) {
            console.error("Error to fill Catalog. Error: ", err);
        }
    }

}

export default Catalog;
