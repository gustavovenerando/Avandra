import "dotenv/config"
import container from "./container"
import MySqlConnection from "./infra/database/mysql/connection"
import Catalog from "./domain/Catalog";
import CatTest from "./domain/CatTest";

(async () => {
    // await container.get(MySqlConnection).inicialize();
    // container.get(Catalog).extract();
    container.get(CatTest).extract();
})();
