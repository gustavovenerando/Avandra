import { inject, injectable } from "inversify";
import MySqlConnection from "../../connection";
import { DataTypes, Sequelize } from "sequelize";

@injectable()
class Catalog {
    private readonly conn: Sequelize | undefined;
    
    constructor(
        @inject(MySqlConnection) private mySqlConn: MySqlConnection
    ) { 
        this.conn = this.mySqlConn.mainConn;
    }

    private create() {
        if (!this.conn) throw new Error("MySql database not inicialized. Not possible to create a model.");

        const model = this.conn.define(
            'Catalog',
            {
                site: {
                    type: DataTypes.STRING
                },
                url: {
                    type: DataTypes.STRING
                },
            },
            {

            }
        );

        return model;
    }

    getModel() {
        return this.create();
    }
}

export default Catalog;
