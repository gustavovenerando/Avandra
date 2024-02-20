import puppeteer from "puppeteer-extra";
import { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { injectable } from "inversify";

@injectable()
class Puppeteer{
    puppeteerExtra: PuppeteerExtra;

    constructor(){
        this.puppeteerExtra = this.initialization();
    }

    initialization(){
        puppeteer.use(StealthPlugin());
        puppeteer.use(AdblockerPlugin({ blockTrackers: true}));

        return puppeteer;
    }
}

export default Puppeteer;
