import { Container } from "inversify";
import "reflect-metadata";
import TaskExecution from "./domain/TaskExecution"
import ElemExtraction from "./domain/ElemExtraction"
import Catalog from "./domain/Catalog"
import Puppeteer from "./domain/Puppeteer";
import MySqlFactory from "./infra/database/mysql/factory";
import MySqlConnection from "./infra/database/mysql/connection";

let container = new Container({autoBindInjectable: true});
container.bind(MySqlFactory).toSelf();
container.bind(MySqlConnection).toSelf().inSingletonScope();
container.bind(ElemExtraction).toSelf();
container.bind(TaskExecution).toSelf();
container.bind(Puppeteer).toSelf().inSingletonScope();
container.bind(Catalog).toSelf();

export default container;
