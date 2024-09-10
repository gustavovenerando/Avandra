import { inject, injectable } from "inversify";
import Product from "../Product";

@injectable()
class Catalog {
    constructor(
        @inject(Product) private product: Product
    ) { }

}

export default Catalog;
