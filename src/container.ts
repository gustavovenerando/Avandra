import { Container } from "inversify";
import "reflect-metadata";
import TaskExecution from "./domain/TaskExecution"
import ElemExtraction from "./domain/ElemExtraction"
import Showcase from "./domain/Product"
import Puppeteer from "./domain/Puppeteer";
import MySqlFactory from "./infra/database/mysql/factory";
import MySqlConnection from "./infra/database/mysql/connection";
import CatalogModel from "./infra/database/mysql/model/Catalog";
import CatalogRepository from "./infra/database/mysql/repository/Catalog";
import ProductExtraction from "./domain/ProductExtraction";
import Catalog from "./domain/Catalog";

let container = new Container({autoBindInjectable: true});

//Connection
container.bind(MySqlFactory).toSelf();
container.bind(MySqlConnection).toSelf().inSingletonScope();

//Model
container.bind(CatalogModel).toSelf().inSingletonScope();

//Repository
container.bind(CatalogRepository).toSelf();

//Domain
container.bind(ElemExtraction).toSelf();
container.bind(TaskExecution).toSelf();
container.bind(Puppeteer).toSelf().inSingletonScope();
container.bind(Showcase).toSelf();
container.bind(ProductExtraction).toSelf();
container.bind(Catalog).toSelf();

export default container;
