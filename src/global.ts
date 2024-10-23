export const PAGE_INFO_CHUNK_SIZE = 20;
export const PRODUCT_SELECTOR_CHUNK_SIZE = 50;

export const mysqlMain = {
    host: process.env.MYSQL_HOST || '',
    port: process.env.MYSQL_PORT || '',
    name: process.env.MYSQL_DB_NAME || '',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    dialect: process.env.MYSQL_DIALECT || '',
}

export const siteArr = [
    // {
    //     site: "pichau",
    //     type: "gpu",
    //     baseUrl: "https://www.pichau.com.br",
    //     showcase: {
    //         extractUrl: "https://www.pichau.com.br/hardware/placa-de-video?page=PAGE_NUM",
    //         selectors:{
    //             numProductSelector : 'div[class="MuiContainer-root"] .MuiGrid-item > div:nth-child(1) > div > div > div > div',
    //             productCardSelector : 'a[data-cy="list-product"]',
    //             productNameSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > h2',
    //             pricePixSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div > div > div:nth-child(3)',
    //             priceCreditSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > div > div:nth-child(3) > div > div',
    //             soldOutSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) .MuiCardContent-root > p',
    //             productEndpointSelector: 'div[class="MuiContainer-root"] .MuiGrid-item > .MuiGrid-container > div:nth-child(INDEX) > a',
    //             numProductSelectorType: "total",
    //         }
    //     },
    //     catalog: {
    //         selectors: {
    //             warranty: "", //12 meses de garantia
    //             vram: "", //12Gb
    //             sram: "", //GGDR6X
    //             brand: "", //ASRock
    //             model: "", // AMD Radeon RX 6600 CLD 8G
    //             serialId: ""// GA2RZZ-00UANF
    //         }
    //     }
    // },
    {
        site: "kabum",
        baseUrl: "https://www.kabum.com.br",
        type: {
            gpu: {
                extractUrl: "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched",
                nameRegex: {
                    model: /(?<= - ).*/, // GA2RZZ-00UANF (Positive Lookbehind regex)
                    vram: /[0-9]*GB/i, //12Gb
                    sram: /[a-z]?DDR[0-9a-z]+/i, //GDDR6X
                    family: /(RT|GT|RX)(.+?([0-9]+))(\s?)(Super|Ti|XT)?/i, //RTX 4070ti [GT(x), RT(x), RX]
                },
            }
        },
        selectors: {
            common: {
                numProductSelector: "#listingCount",
                productCardSelector: ".productCard",
                numProductSelectorType: "total",
            },
            catalog: {
                productNameSelector: '#listing main > div:nth-child(INDEX) .productLink .nameCard',
                soldOutSelector: '#listing main > div:nth-child(INDEX) .productLink .unavailablePricesCard',
                productEndpointSelector: '#listing main > div:nth-child(INDEX) .productLink',
            },
            price: {
                pricePixSelector: '#listing main > div:nth-child(INDEX) .productLink .priceCard',
                priceCreditSelector: "",
            }
        },
    },
    // {
    //     site: "gkinfostore",
    //     type: "gpu",
    //     baseUrl: "https://www.gkinfostore.com.br",
    //     showcase: {
    //         extractUrl: "https://www.gkinfostore.com.br/placa-de-video?pagina=PAGE_NUM",
    //         selectors: {
    //             numProductSelector: ".ordenar-listagem.rodape.borda-alpha .pagination > ul",
    //             productCardSelector: "#corpo #listagemProdutos .listagem-item",
    //             productNameSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
    //             pricePixSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto .desconto-a-vista',
    //             priceCreditSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto .preco-promocional',
    //             soldOutSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .bandeiras-produto .bandeira-indisponivel',
    //             productEndpointSelector: '#corpo #listagemProdutos > ul > li:nth-child(INDEX) .info-produto > a',
    //             numProductSelectorType: "pagination",
    //         }
    //     },
    //     catalog: {
    //         selectors: {
    //             warranty: "", //12 meses de garantia
    //             vram: "", //12Gb
    //             sram: "", //GGDR6X
    //             brand: "", //ASRock
    //             model: "", // AMD Radeon RX 6600 CLD 8G
    //             serialId: ""// GA2RZZ-00UANF
    //         }
    //     }
    // },
]

export type MySqlConfigI = typeof mysqlMain;
