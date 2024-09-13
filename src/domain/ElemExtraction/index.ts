import { Page } from "puppeteer";
import { injectable } from "inversify";

@injectable()
class ElemExtraction {
    async listLength(page: Page, productCardSelector: string): Promise<number> {
        return await page.evaluate((selector) => {
            return document.querySelectorAll(selector).length;
        }, productCardSelector);
    }

    async getText(page: Page, textSelector: string, isSoldOut = false): Promise<string> {
        let text = await page.evaluate((selector) => {
            return document.querySelector(selector)?.textContent;
        }, textSelector);

        if (!text) {
            if (isSoldOut) {
                return "";
            }
            let errMsg = "Information about product not found. Text selector: " + textSelector + " - URL: " + page.url();
            throw new Error(errMsg);
        }

        text = text.trim();

        if (text.includes("\n")) {
            const textSplit = text.split("\n");
            text = textSplit[0];
        }

        return text;
    }

    async getHref(page: Page, urlSelector: string): Promise<string> {
        const href = await page.evaluate((selector) => {
            return document.querySelector(selector)?.getAttribute("href");
        }, urlSelector);

        if (!href) {
            console.log("Product href not found. Product Url Selector: " + urlSelector + " - URL: " + page.url());
            return "";
        }

        return href;
    }

    async getPaginationNumber(page: Page, numProductSelector: string): Promise<number> {
        const paginationText = await page.evaluate((selector) => {
            const paginationElem = document.querySelector(selector);
            const paginagionChildren = paginationElem?.children;

            if (!paginagionChildren) throw new Error("Pagination children not found");

            const lastPageElem = paginagionChildren[paginagionChildren.length - 2];

            return lastPageElem.textContent;
        }, numProductSelector);

        if (!paginationText) throw new Error("Pagination text not found.");

        return Number(paginationText);
    }

    async getProductsCountNumber(page: Page, numProductSelector: string, numProductPerPage: number): Promise<number> {
        const productsCountText = await this.getText(page, numProductSelector);

        if (!productsCountText) throw new Error(`Products count text not found. Selector: ${numProductSelector} - Page: ${page.url()}`);

        const num = Number(productsCountText.split(" ")[0]);

        return Math.ceil(num / numProductPerPage);
    }
}

export default ElemExtraction;
