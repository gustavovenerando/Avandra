import { inject, injectable } from "inversify";
import CatalogModel from "../../model/Catalog";

@injectable()
class Catalog {
    constructor(
        @inject(CatalogModel) private catalogModel: CatalogModel
    ) { 
    }

    async bulkCreate(data: any){
        if(!data) throw new Error("No data to save on mySql!");

        const model = await this.catalogModel.getModel();

        if(!model) throw new Error("No model inicialized.");

        await model.bulkCreate(data);
    }
}

export default Catalog;
