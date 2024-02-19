import {Page, Browser} from "puppeteer";

interface ExtractionI{
    readonly puppeteerClass: any;
    chunkSize: number;
    extractionData: string[]; 
}

export interface ExtractPageDataI{
    (browser: Browser, pageInfo: any): Promise<any[]>;
}

export interface ExtractProductDataI{
    (page: Page, productSelectors: ProductSelectorsI): Promise<ExtractedProductSelectorsI>;
}

export interface ProductSelectorsI {
    [key: string]: string
}

export interface ExtractedProductSelectorsI {
    [key: string]: string | boolean
}

export interface PageExtractionI extends ExtractionI{
    extractFunction: ExtractPageDataI;
}

export interface ProductExtractionI extends ExtractionI{
    extractFunction: ExtractProductDataI;
}
