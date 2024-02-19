import { Container } from "inversify";
import "reflect-metadata";
import TaskExecution from "./src/TaskExecution"
import ElemExtraction from "./src/ElemExtraction"
import Catalog from "./src/Catalog"

let container = new Container({autoBindInjectable: true});
container.bind(ElemExtraction).toSelf();
container.bind(TaskExecution).toSelf();
container.bind(Catalog).toSelf();

export default container;
