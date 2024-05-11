import "dotenv/config"
import container from "../container"
import Catalog from "./Catalog"
import MySqlConnection from "./infra/database/mysql/connection"

container.get(MySqlConnection).inicialize();
// container.get(Catalog).execute();
