import {Page} from "puppeteer";
import { injectable } from "inversify";

@injectable()
class ElemExtraction{
    async listLength(page: Page, productCardSelector: string): Promise<number>{
        return await page.evaluate((selector) => {
            return document.querySelectorAll(selector).length;
        }, productCardSelector);
    }

    async getText(page: Page, textSelector: string): Promise<string>{
        let text = await page.evaluate((selector) => {
            return document.querySelector(selector)?.textContent;
        }, textSelector);

        if(!text){
            // console.log("Information about product not found. Text selector: " + textSelector + " - URL: " + page.url());
            return "";
        } 

        text = text.trim();

        if(text.includes("\n")){
            const textSplit = text.split("\n");
            text = textSplit[0];
        }

        return text;
    }

    async getHref(page: Page, urlSelector: string): Promise<string>{
        const href = await page.evaluate((selector) => {
            return document.querySelector(selector)?.getAttribute("href");
        }, urlSelector);

        if(!href){
            console.log("Product href not found. Product Url Selector: " + urlSelector + " - URL: " + page.url());
            return "";
        } 

        return href;
    }
}

export default ElemExtraction;
