import { inject, injectable } from "inversify";
import MySqlFactory from "./factory";
import { mysqlMain } from "../../../global";
import { Sequelize } from "sequelize";

@injectable()
class MySqlConnection {
    mainConn: Sequelize | undefined;

    constructor(
        @inject(MySqlFactory) private mysqlFactory: MySqlFactory
    ) { 
    }

    async inicialize() {
        try {
            this.mainConn = this.mysqlFactory.connection(mysqlMain);
            await this.mainConn.authenticate();
            console.log("Connection has been established successfully. Db name: ", mysqlMain.name);
        }
        catch (err: any) {
            console.error("Unable to connect to the databese. Db name: ",
                mysqlMain.name,
                ". Error: ",
                err,
            );
        }
    }
}

export default MySqlConnection;
