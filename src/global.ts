import { memoryUsage } from "process";

export const PAGE_INFO_CHUNK_SIZE = 10;
export const PRODUCT_SELECTOR_CHUNK_SIZE = 50;

export const siteArr = [
    {
        site: "pichau",
        type: "gpu",
        numProductSelectorType: "total",
        extractUrl: "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM",
        baseUrl: "https://www.pichau.com.br",
        numProductSelector : 'div[class="MuiContainer-root"] .MuiGrid-item > div:nth-child(1) > div > div > div > div',
        productCardSelector : 'a[data-cy="list-product"]',
        productNameSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > h2',
        pricePixSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div > div > div:nth-child(3)',
        priceCreditSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div:nth-child(3) > div > div',
        soldOutSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > p',
        productEndpointSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) > a',
    },
    {
        site: "kabum",
        type: "gpu",
        numProductSelectorType: "total",
        extractUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
        baseUrl: "https://www.kabum.com.br",
        numProductSelector : "#listingCount",
        productCardSelector : ".productCard",
        productNameSelector: '#listing main > div:nth-child(INDEX) .productLink .nameCard',
        pricePixSelector: '#listing main > div:nth-child(INDEX) .productLink .priceCard',
        priceCreditSelector: '',
        soldOutSelector: '#listing main > div:nth-child(INDEX) .productLink .unavailablePricesCard',
        productEndpointSelector: '#listing main > div:nth-child(INDEX) .productLink',
    },
    {
        site: "gkinfostore",
        type: "gpu",
        numProductSelectorType: "pagination",
        extractUrl: "https://www.gkinfostore.com.br/placa-de-video?pagina=PAGE_NUM",
        baseUrl: "https://www.gkinfostore.com.br",
        numProductSelector : ".ordenar-listagem.rodape.borda-alpha .pagination > ul",
        productCardSelector : "#corpo #listagemProdutos .listagem-item",
        productNameSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
        pricePixSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto .desconto-a-vista',
        priceCreditSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto .preco-promocional',
        soldOutSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .bandeiras-produto .bandeira-indisponivel',
        productEndpointSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
    },
]

export const mysqlMain = {
    host: process.env.MYSQL_HOST || '',
    port: process.env.MYSQL_PORT || '',
    name: process.env.MYSQL_DB_NAME || '',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    dialect: process.env.MYSQL_DIALECT || '',
}

export type MySqlConfigI = typeof mysqlMain;
