import { Page, Browser } from "puppeteer";

interface ExtractionI{
    readonly puppeteerClass: any;
    chunkSize: number;
    extractionData: string[]; 
}

export interface ExtractPageDataI {
    (browser: Browser, pageInfo: any): Promise<any[]>;
}

export interface ExtractProductDataI {
    (page: Page, productSelectors: ExtractProductInfoI): Promise<ExtractedProductSelectorsI>;
}

export interface ExtractProductInfoI {
    [key: string]: string
}

export interface ExtractedProductSelectorsI {
    [key: string]: string | boolean
}

export interface PageExtractionI extends ExtractionI {
    extractFunction: ExtractPageDataI;
}

export interface ProductExtractionI extends ExtractionI {
    extractFunction: ExtractProductDataI;
}

export interface ProductExtracted {
    name: string;
    url: string;
    site: "kabum" | "pichau" | "gkinfostore";
    type: string;
}
