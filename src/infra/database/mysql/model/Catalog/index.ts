import { inject, injectable } from "inversify";
import MySqlConnection from "../../connection";
import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

@injectable()
class Catalog {
    private readonly conn: Sequelize | undefined;

    private model: ModelStatic<Model> | undefined;
    
    constructor(
        @inject(MySqlConnection) private mySqlConn: MySqlConnection
    ) { 
        this.conn = this.mySqlConn.mainConn;
    }

    private async create() {
        if (!this.conn) throw new Error("MySql database not inicialized. Not possible to create a model.");

        const model = this.conn.define(
            'Catalog',
            {
                name: {
                    type: DataTypes.STRING
                },
                url: {
                    type: DataTypes.STRING,
                    unique: true
                },
                site: {
                    type: DataTypes.STRING,
                },
                brand: {
                    type: DataTypes.STRING,
                },
                model: {
                    type: DataTypes.STRING,
                },
                warranty: {
                    type: DataTypes.STRING,
                },
                vram: {
                    type: DataTypes.STRING,
                },
                sram: {
                    type: DataTypes.STRING,
                },
                family: {
                    type: DataTypes.STRING,
                },
            },
            {
                freezeTableName: true
            }
        );

        await model.sync();

        this.model = model;
    }

    async getModel() {
        if(!this.model) await this.create();
        return this.model;
    }
}

export default Catalog;
