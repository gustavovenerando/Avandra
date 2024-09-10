import { Container } from "inversify";
import "reflect-metadata";
import TaskExecution from "./domain/TaskExecution"
import ElemExtraction from "./domain/ElemExtraction"
import Product from "./domain/Product"
import Puppeteer from "./domain/Puppeteer";
import MySqlFactory from "./infra/database/mysql/factory";
import MySqlConnection from "./infra/database/mysql/connection";
import Catalog from "./domain/Catalog";

let container = new Container({autoBindInjectable: true});
container.bind(MySqlFactory).toSelf();
container.bind(MySqlConnection).toSelf().inSingletonScope();
container.bind(ElemExtraction).toSelf();
container.bind(TaskExecution).toSelf();
container.bind(Puppeteer).toSelf().inSingletonScope();
container.bind(Product).toSelf();
container.bind(Catalog).toSelf();

export default container;
