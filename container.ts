import { Container } from "inversify";
import "reflect-metadata";
import TaskExecution from "./src/TaskExecution"
import ElemExtraction from "./src/ElemExtraction"
import Catalog from "./src/Catalog"
import Puppeteer from "./src/Puppeteer";
import MySqlFactory from "./src/infra/database/mysql/factory";
import MySqlConnection from "./src/infra/database/mysql/connection";

let container = new Container({autoBindInjectable: true});
container.bind(MySqlFactory).toSelf();
container.bind(MySqlConnection).toSelf().inSingletonScope();
container.bind(ElemExtraction).toSelf();
container.bind(TaskExecution).toSelf();
container.bind(Puppeteer).toSelf().inSingletonScope();
container.bind(Catalog).toSelf();

export default container;
