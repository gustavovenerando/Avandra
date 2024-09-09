import { injectable } from "inversify";
import { Sequelize } from "sequelize";
import { MySqlConfigI } from "../../../global";

@injectable()
class MySqlFactory {
    connection(config: MySqlConfigI): Sequelize {
        const uri = this.uriMaker(config);

        const sequelizeConn = new Sequelize(uri);

        return sequelizeConn;
    }

    private uriMaker(config: MySqlConfigI): string {
        const {
            dialect,
            name,
            password,
            user,
            port,
            host
        } = config;

        return `${dialect}://${user}:${password}@${host}:${port}/${name}`;
    }
}

export default MySqlFactory;
