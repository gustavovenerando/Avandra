const axios = require("axios");
// const url = "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/hardware/placa-de-video-vga?page_number=PAGE_NUM&page_size=100&facet_filters=&sort=most_searched";
const url = 'https://www.pichau.com.br/api/pichau?query=query category($id: Int!, $pageSize: Int!, $onServer: Boolean!, $currentPage: Int!) { category(id: $id) { id description name product_count url_key search_filters_order breadcrumbs { category_id category_name category_level category_url_key __typename } pichau_faq { answer question __typename } meta_title @include(if: $onServer) meta_keywords @include(if: $onServer) meta_description @include(if: $onServer) __typename } products( pageSize: $pageSize currentPage: $currentPage filter: {category_id: {eq: "19"}, hide_from_search: {eq: "0"}} sort: {relevance: DESC} ) { aggregations { count label attribute_code options { count label value __typename } __typename } items { id sku url_key name socket hide_from_search is_openbox openbox_state openbox_condition tipo_de_memoria caracteristicas slots_memoria marcas marcas_info { name __typename } product_page_layout formato_placa plataforma portas_sata slot_cooler_120 slot_cooler_80 slot_cooler_140 slot_cooler_200 coolerbox_included potencia quantidade_pacote alerta_monteseupc vgaintegrado product_set_name categories { name url_path path __typename } special_price pichau_prices { avista avista_discount avista_method base_price final_price max_installments min_installment_price __typename } price_range { __typename } description { html __typename } garantia informacoes_adicionais image { url url_listing path label __typename } media_gallery { url path label position __typename } short_description { html __typename } amasty_label { name product_labels { image position size label label_color __typename } category_labels { image position size label label_color __typename } __typename } reviews { rating count __typename } mysales_promotion { expire_at price_discount price_promotional promotion_name promotion_url qty_available qty_sold __typename } only_x_left_in_stock stock_status codigo_barra codigo_ncm meta_title @include(if: $onServer) meta_keyword @include(if: $onServer) meta_description @include(if: $onServer) __typename } page_info { total_pages current_page __typename } total_count __typename } banners: rbsliderBanner(area: CATEGORY, categoryId: 19) { id name position page_type display_arrows display_bullets sliders { id url is_add_nofollow_to_url is_open_url_in_new_window status display_to display_from img_url_final mobile_url_final img_alt img_url img_type img_title __typename } __typename } } &operationName=category&variables={"id":"19","pageSize":36,"currentPage":2,"idString":"19","facetsMainCategoryId":"19","onServer":true,"q":null}';
let count = 0;

async function test(){
    const res = await axios.get(url);

    // const promises = [];
    // for(let page = 1; page <= 9; page++){
    //     const currUrl = url.replace("PAGE_NUM", `${page}`);
    //     promises.push(axios.get(currUrl));
    // }
    //
    // const res = await Promise.allSettled(promises);
    //
    // for(let promise of res){
    //     if (promise.status === "rejected") throw new Error("=======> Promise failed to resolve");
    // }
    //
    // console.log("COMPLETED RUN NUMBER ", count, " - Results: ", res.map(elem => elem.value.data).length);

    // console.log("Response data: ", res.map(elem => elem.value));
}


// setInterval(async () => {
//     try {
//         console.log("RUNNING RUN NUMBER ", count);
//         await test(count);
//         count++;
//     } catch (err) {
//         console.log("COUNT: ", count);
//         console.error(err);
//     }
// }, 1000)

test();

