import "dotenv/config"
import container from "./container"
import Product from "./domain/Product"
import MySqlConnection from "./infra/database/mysql/connection"

container.get(MySqlConnection).inicialize();
container.get(Product).extract();
