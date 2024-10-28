import { inject, injectable } from "inversify";
import PriceModel from "../../model/Price";

@injectable()
class Price {
    constructor(
        @inject(PriceModel) private priceModel: PriceModel
    ) { 
    }

    async bulkCreate(data: any){
        if(!data) throw new Error("No data to save on mySql!");

        const model = await this.priceModel.getModel();

        if(!model) throw new Error("No model inicialized.");

        await model.bulkCreate(
            data, 
        );
    }
}

export default Price;
