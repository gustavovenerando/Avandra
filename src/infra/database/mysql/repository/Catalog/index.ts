import { inject, injectable } from "inversify";
import CatalogModel from "../../model/Catalog";
import { Model, ModelStatic } from "sequelize";

@injectable()
class Catalog {
    private readonly model: ModelStatic<Model>;

    constructor(
        @inject(CatalogModel) private catalogModel: CatalogModel
    ) { 
        this.model = this.catalogModel.getModel();
    }

    create(data: any){
        if(!data) throw new Error("No data to save on mySql!");

        this.model.create(data);
    }
}

export default Catalog;
