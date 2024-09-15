import puppeteer from "puppeteer-extra";
import { PuppeteerExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { injectable } from "inversify";
import { Browser, Page } from "puppeteer";

@injectable()
class Puppeteer {
    puppeteerExtra: PuppeteerExtra;

    constructor() {
        this.puppeteerExtra = this.initialization();
    }

    initialization() {
        puppeteer.use(StealthPlugin());
        puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

        return puppeteer;
    }

    async newBrowser(): Promise<Browser> {
        const browser = await this.puppeteerExtra.launch({
            headless: false,
            args: ["--no-sandbox"]
        });

        return browser;
    }

    async gotoNewPage(browser: Browser, url: string): Promise<Page> {
        const page = await browser.newPage();
        await page.setViewport({
            width: 1600,
            height: 1200,
        });

        //Blocking image, font and styles requests to improve performance
        await page.setRequestInterception(true);
        page.on('request', req => {
            if (["stylesheet", "font", "image"].includes(req.resourceType()))
                req.abort();
            else
                req.continue();
        })

        await page.goto(url, { waitUntil: "load" });

        return page;
    }

}

export default Puppeteer;
