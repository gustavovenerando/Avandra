import "dotenv/config"
import container from "./container"
import MySqlConnection from "./infra/database/mysql/connection"
import Catalog from "./domain/Catalog";

container.get(MySqlConnection).inicialize();
container.get(Catalog).extract();
