import { ProductExtractedI } from "../Product/interface";

export interface CatalogProductI extends ProductExtractedI {
    model: string;
    vram: string;
    sram: string;
    family: string;
    warranty: string;
    brand: string;
}

export interface ProductDetailInfoI extends ProductExtractedI {
    catalog: {
        nameRegex?: {
            [key: string]: RegExp;
        },
        selectors?: {
            [key: string]: string;
        }
    }
}
