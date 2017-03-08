/*******************************
 *  Developed By Echidnainc, Pvt Ltd.
 *  Rights Reserved.
 * ****************************/

define(['modules/jquery-mozu'], function($) {
    window.dataLayer = window.dataLayer || [];
   var ampGtm = function() { 
       this.debug = $.debug(true);
       this.url = $.url(true);
       this.init();
   };
   ampGtm.prototype = {
        init: function() {
           this.gtmTag = this.debug.site.themeSettings.gtmTag;
           this.checkPage(true);
        },
        definePage: function() {
          if(this.url.urlCheck3 === "c")
              return "category";
          if(this.url.urlCheck1 === "search")
              return "search";
          if(this.url.urlCheck3 === "p")
              return "product";
          if(this.url.urlCheck1 === "cart")
              return "cart";
          if(this.url.urlCheck2 === "checkout"  && this.url.urlCheck1 != 'confirmation')
              return "checkout";
          if(this.url.urlCheck1 == 'confirmation')
            return 'confirmation';
            if(this.url.urlCheck1 == 'find-an-amp-pro')
            return 'findamp';
          if(this.url.urlCheck1 == 'become-an-amp-pro')
            return 'becomeamp';
          else 
           return "static";
        },
        
        getSearchRes: function() {      
            var searchres=$('#customerror') || $('#customerror') !== undefined ? $.trim($('#customerror').val()) :"";
            var searchresblock=$('#customerrorblock') || $('#customerrorblock') !== undefined ? $.trim($('#customerrorblock').val()) :"";
            var search_preload=this.preloadData(this.definePage());     
            search_preload.searchresultval=searchres;  
			search_preload.searchresblock=searchresblock;
            return search_preload;          
        },
       /* getout_of_stock: function() {         
            var outstock=($(document).find('#hiddenout_of_stock').val())? $(document).find('#hiddenout_of_stock').val() : "";     
            var product_preload=this.preloadData(this.definePage());     
            product_preload.out_of_stock=outstock;       
            return product_preload;          
        }, */
        preloadData: function(type) {
            if(type == "category")
                return $.extend(require.mozuData('category'),require.mozuData('facetedproducts'));
            if(type == "search")
                return $.extend(require.mozuData('category'),require.mozuData('facetedproducts'));
            else if(type == "product")
                return require.mozuData('product');
            else if(type == "cart")
                return require.mozuData('cart');
            else if(type == "checkout")
                return require.mozuData('checkout');
            else if(type  == "confirmation")
                return require.mozuData('order');
            else 
                return false;
        },
        pageName: function() {
            if(this.definePage() == "category")
                return "Category";
            if(this.definePage() == "search")
                return "Search";
            if(this.definePage() == "product")
                return "Product";
            if(this.definePage() == "cart")
                return "Cart";
            if(this.definePage() == "checkout")
                return "Checkout";
            if(this.definePage() == "confirmation")
                return "Confirmation";
                if(this.definePage() == "findamp")
                return "Findanamppro";
            if(this.definePage() == "becomeamp")
                return "Becomeanamppro";
            if(this.definePage() == "static")
                return "Static";
        },
        generalValues: function() {
          return {
              "page_name" : this.pageName(),
              "page_type" : this.pageName(),
              "site_country" : "US",
              "site_currency" : "USD",
              "login_state" : this.debug.user.isAuthenticated,
              "customer_email" : this.debug.user.email,
              "customer_first_name" : this.debug.user.firstName,
              "customer_last_name" : this.debug.user.lastName,
              "customer_id" : (this.debug.user.accountId !== undefined) ? this.debug.user.accountId : this.debug.user.userId //accountId
          } ;
        },
        productDetail: function(type) {
            var products = [];
            if(type == "categories") {
                for(var pi=0; pi<this.preloadData(this.definePage()).categories.length;pi++)
                { 
                    products.push(this.preloadData(this.definePage()).categories[pi].content.name);
                }
            }
            if(type == "images") {
                for(var pim=0; pim<this.preloadData(this.definePage()).content.productImages.length;pim++)
                { 
                    products.push(this.preloadData(this.definePage()).content.productImages[pim].imageUrl);
                }
            }
            if(type == "varients") {
                for(var pv=0; pv<this.preloadData(this.definePage()).variations.length;pv++)
                { 
                    products.push(this.preloadData(this.definePage()).variations[pv].productCode);
                }
            }
            return products;
            
        },
        cartDetail: function(type) {
            var cart=[];
            if(type == "id") {
                for(var cid = 0; cid<this.preloadData(this.definePage()).items.length;cid++) {
                    cart.push(this.preloadData(this.definePage()).items[cid].product.productCode);
                }
            }
            if(type == "vid") {
                for(var cvid = 0; cvid<this.preloadData(this.definePage()).items.length;cvid++) {
                    cart.push(this.preloadData(this.definePage()).items[cvid].product.variationProductCode);
                }
            }
            if(type == "name") {
                for(var cname = 0; cname<this.preloadData(this.definePage()).items.length;cname++) {
                    cart.push(this.preloadData(this.definePage()).items[cname].product.name);
                }
            }
            if(type == "qty") {
                for(var cqty = 0; cqty<this.preloadData(this.definePage()).items.length;cqty++) {
                    cart.push(this.preloadData(this.definePage()).items[cqty].quantity);
                }
            }
            if(type == "list") {
                for(var clist = 0; clist<this.preloadData(this.definePage()).items.length;clist++) {
                    cart.push((this.preloadData(this.definePage()).items[clist].product.price.catalogListPrice !== undefined) ? this.preloadData(this.definePage()).items[clist].product.price.catalogListPrice : "");
                }
            }
            if(type == "unit") {
                for(var cunit = 0; cunit<this.preloadData(this.definePage()).items.length;cunit++) {
                    cart.push(this.preloadData(this.definePage()).items[cunit].product.price.price);
                }
            }
            if(type == "sale") {
                for(var csale = 0; csale<this.preloadData(this.definePage()).items.length;csale++) {
                    cart.push(this.preloadData(this.definePage()).items[csale].product.price.salePrice);
                }
            }
            if(type == "msrp") {
                for(var cmsrp = 0; cmsrp<this.preloadData(this.definePage()).items.length;cmsrp++) {
                    cart.push((this.preloadData(this.definePage()).items[cmsrp].product.price.msrp !== undefined) ? this.preloadData(this.definePage()).items[cmsrp].product.price.msrp : "");
                }
            }
            if(type == "type") {
                for(var ctype = 0; ctype<this.preloadData(this.definePage()).items.length;ctype++) {
                    cart.push(this.preloadData(this.definePage()).items[ctype].product.productUsage);
                }
            }
            if(type == "images") {
                for(var cimg = 0; cimg<this.preloadData(this.definePage()).items.length;cimg++) {
                    cart.push(this.preloadData(this.definePage()).items[cimg].product.imageUrl);
                }
            }
            if(type == "disc") {
                for(var cdisc = 0; cdisc<this.preloadData(this.definePage()).items.length;cdisc++) {
                    cart.push(this.preloadData(this.definePage()).items[cdisc].discountTotal);
                }
            }
            
            return cart;
        },
        orderDetail: function(type) {
            var order = [];
            if(type == "id") {
                for(var oid=0;oid<this.preloadData(this.definePage()).items.length;oid++) {
                    order.push(this.preloadData(this.definePage()).items[oid].product.productCode);
                }
            }
            if(type == "vid") {
                for(var ovid=0;ovid<this.preloadData(this.definePage()).items.length;ovid++) {
                    order.push((this.preloadData(this.definePage()).items[ovid].product.variationProductCode) ? this.preloadData(this.definePage()).items[ovid].product.variationProductCode : "");
                }
            }
            if(type == "name") {
                for(var oname=0;oname<this.preloadData(this.definePage()).items.length;oname++) {
                    order.push(this.preloadData(this.definePage()).items[oname].product.name);
                }
            }
            if(type == "qty") {
                for(var oqty=0;oqty<this.preloadData(this.definePage()).items.length;oqty++) {
                    order.push(this.preloadData(this.definePage()).items[oqty].quantity);
                }
            }
            if(type == "list") {
                for(var olist=0;olist<this.preloadData(this.definePage()).items.length;olist++) {
                    order.push(this.preloadData(this.definePage()).items[olist].product.price.price);
                }
            }
            if(type == "unit") {
                for(var ounit=0;ounit<this.preloadData(this.definePage()).items.length;ounit++) {
                    order.push(this.preloadData(this.definePage()).items[ounit].product.price.price);
                }
            }
            if(type == "sale") {
                for(var osale=0;osale<this.preloadData(this.definePage()).items.length;osale++) {
                    order.push((this.preloadData(this.definePage()).items[osale].product.price.salePrice) ? this.preloadData(this.definePage()).items[osale].product.price.salePrice : "");
                }
            }
            if(type == "msrp") {
                for(var omsrp=0;omsrp<this.preloadData(this.definePage()).items.length;omsrp++) {
                    order.push((this.preloadData(this.definePage()).items[omsrp].product.price.msrp) ? this.preloadData(this.definePage()).items[omsrp].product.price.msrp : "");
                }
            }
            if(type == "type") {
                for(var otype=0;otype<this.preloadData(this.definePage()).items.length;otype++) {
                    order.push(this.preloadData(this.definePage()).items[otype].product.productUsage);
                }
            }
            if(type == "images") {
                for(var oimages=0;oimages<this.preloadData(this.definePage()).items.length;oimages++) {
                    order.push(this.preloadData(this.definePage()).items[oimages].product.imageUrl);
                }
            }
            if(type == "promo") {
                for(var opromo=0;opromo<this.preloadData(this.definePage()).orderDiscounts.length;opromo++) {
                    order.push(this.preloadData(this.definePage()).orderDiscounts[opromo].couponCode);
                }
            }
            if(type == "pcode") {
                for(var opcode=0;opcode<this.preloadData(this.definePage()).items.length;opcode++) {
                    if(this.preloadData(this.definePage()).items[opcode].productDiscount) {
                    order.push(this.preloadData(this.definePage()).items[opcode].productDiscount.couponCode);
                    } else { order.push(null); }
                }
            }
            if(type == "scode") {
                for(var ocode=0;ocode<this.preloadData(this.definePage()).shippingDiscounts.length;ocode++) {
                    order.push(this.preloadData(this.definePage()).shippingDiscounts[ocode].methodCode);
                }
            }
            if(type == "samount") {
                for(var osamt=0;osamt<this.preloadData(this.definePage()).shippingDiscounts.length;osamt++) {
                    order.push(this.preloadData(this.definePage()).shippingDiscounts[osamt].discount.impact);
                }
            }
            if(type == "oamount") {
                for(var ooamt=0;ooamt<this.preloadData(this.definePage()).orderDiscounts.length;ooamt++) {
                    order.push(this.preloadData(this.definePage()).orderDiscounts[ooamt].impact);
                }
            }
            if(type == "opayment") {
                for(var opmt=0;opmt<this.preloadData(this.definePage()).payments.length;opmt++) {
                    order.push(this.preloadData(this.definePage()).payments[opmt].paymentType);
                }
            }
            return order;
        },
        transactionLineitems: function() {
            var transLine = [];
            for(var oline=0;oline<this.preloadData(this.definePage()).items.length;oline++) {
                transLine.push({
                    'sku': (this.preloadData(this.definePage()).items[oline].product.variationProductCode) ? this.preloadData(this.definePage()).items[oline].product.variationProductCode : this.preloadData(this.definePage()).items[oline].product.productCode,
                    'name': this.preloadData(this.definePage()).items[oline].product.name,
                    'price': (this.preloadData(this.definePage()).items[oline].product.price.salePrice !== undefined) ? this.preloadData(this.definePage()).items[oline].product.price.salePrice : this.preloadData(this.definePage()).items[oline].product.price.price,
                    'quantity': this.preloadData(this.definePage()).items[oline].quantity
                    });
            }
            return transLine;
        },
        transactionDetails: function() {
          return {
                'transactionId': this.preloadData(this.definePage()).orderNumber,
                'transactionAffiliation': 'Amplighting Store',
                'transactionTotal': this.preloadData(this.definePage()).total,
                'transactionTax': this.preloadData(this.definePage()).taxTotal,
                'transactionShipping': (this.preloadData(this.definePage()).shippingTotal + this.preloadData(this.definePage()).handlingTotal),
                'transactionProducts': this.transactionLineitems()
            };
        },
        priceTypes: function() {
            if(this.preloadData(this.definePage()) !== null) {
          return {
                    "product_price_type" : (this.preloadData(this.definePage()).price) ? "Normal Price" : "Price Range",
                    "product_price_lower" : (this.preloadData(this.definePage()).priceRange) ? this.preloadData(this.definePage()).priceRange.lower.price : "",
                    "product_price_higher" : (this.preloadData(this.definePage()).priceRange) ? this.preloadData(this.definePage()).priceRange.upper.price : "",
                    "product_list_price" : (this.preloadData(this.definePage()).priceRange === undefined) ? this.preloadData(this.definePage()).price.catalogListPrice : "",
                    "product_unit_price" : (this.preloadData(this.definePage()).priceRange === undefined) ? this.preloadData(this.definePage()).price.price : "",
                    "product_sale_price" : (this.preloadData(this.definePage()).priceRange === undefined) ? this.preloadData(this.definePage()).price.catalogSalePrice : "",
                    "product_msrp" : (this.preloadData(this.definePage()).priceRange === undefined) ? this.preloadData(this.definePage()).price.msrp : "",
          };
            } else {
                return {};
            }
        },
        /* jshint ignore:start */
        buildTag: function(page) {
            
            if(this.definePage() == 'findamp') {
                dataLayer.push($.extend(this.generalValues(),{
                }));
            }
            if(this.definePage() == 'becomeamp') {
                dataLayer.push($.extend(this.generalValues(),{
                }));
            }
            if(this.definePage() == "category") {
                dataLayer.push($.extend(this.generalValues(),{
                    "category_page_name" : (this.preloadData(this.definePage()).content !== undefined) ? this.preloadData(this.definePage()).content.name : "",
                    "category_page_pageTitle" : (this.preloadData(this.definePage()).content !== undefined) ? this.preloadData(this.definePage()).content.pageTitle : "",
                    "category_page_metaTitle" : (this.preloadData(this.definePage()).content !== undefined) ? this.preloadData(this.definePage()).content.metaTagTitle : "",
                    "category_page_code" : this.preloadData(this.definePage()).categoryCode,
                    "category_page_id" : this.preloadData(this.definePage()).categoryId,
                    "category_page_product_count" : this.preloadData(this.definePage()).totalCount,
                }));
                
            }
            if(this.definePage() == "search") {
                dataLayer.push($.extend(this.generalValues(),{
                    "site_search_keyword" : this.debug.pagecontext.search.query,
                    "site_search_results" : this.preloadData(this.definePage()).totalCount,
                     "site_no_search_results" : this.getSearchRes().searchresultval, 
                     "site_no_search_results-block" : this.getSearchRes().searchresblock,
                })); 
                
            }
            if(this.definePage() == "product") {
                if((this.preloadData(this.definePage()) === undefined)) {
                    this.buildTag('product');
                }
                if(this.preloadData(this.definePage()) !== null) {
                dataLayer.push($.extend(this.generalValues(),this.priceTypes(),{
                    "product_code" : this.preloadData(this.definePage()).productCode,
                    "product_variation_code" : (this.preloadData(this.definePage()).variations) ? this.productDetail('varients') : "",
                    "product_categories" : this.productDetail('categories'),
                    "product_images" : this.productDetail('images'),
                    "product_name" : this.preloadData(this.definePage()).content.productName,
                    "product_type" : this.preloadData(this.definePage()).productUsage,
                }));
                }
            } 
            if(this.definePage() == "cart") {
                dataLayer.push($.extend(this.generalValues(),{
                    "product_code" : this.cartDetail('id'),
                    "product_variation_code": this.cartDetail('vid'),
                    "product_name" : this.cartDetail('name'),
                    "product_quantity" : this.cartDetail('qty'),
                    "product_list_price" : this.cartDetail('list'),
                    "product_unit_price" : this.cartDetail('unit'),
                    "product_sale_price" : this.cartDetail('sale'),
                    "product_msrp" : this.cartDetail('msrp'),
                    "product_type" : this.cartDetail('type'),
                    "product_images" : this.cartDetail('images'),
                    "cart_product_discountTotal" : this.cartDetail('disc'),
                    "cart_subtotal" : this.preloadData(this.definePage()).subtotal,
                    "cart_total" : this.preloadData(this.definePage()).total,
                }));
                
            }
            if(this.definePage() == "checkout") {
                dataLayer.push($.extend(this.generalValues(),{
                }));
                
            }
            if(this.definePage() == "confirmation") {
                var date = new Date(this.preloadData(this.definePage()).acceptedDate), days = 2;
                date.setDate(date.getDate() + days);
                var year = date.getFullYear();
                var month = ((date.getMonth()+1) < 10)?"0"+(date.getMonth()+1) : (date.getMonth()+1);
                var date = (date.getDate() < 10)?"0"+date.getDate():date.getDate();
                var sdate = ''+year+'-'+month+'-'+date;
                
                dataLayer.push($.extend(this.generalValues(),this.transactionDetails(),{
                    "customer_phone" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.phoneNumbers.home,
                    "order_payment_type" : this.orderDetail('opayment'),
                    
                    "order_promo_code" : this.orderDetail('promo'),
                    "order_discount_amount" : this.orderDetail('oamount'),
                    "product_promo_code" : this.orderDetail('pcode'),
                    "order_shipping_discount_code" : this.orderDetail('scode'),
                    "order_shipping_discount_amount" : this.orderDetail('samount'),
                    "discountTotal" : this.preloadData(this.definePage()).discountTotal,

                    "order_id" : this.preloadData(this.definePage()).orderNumber,
                    "order_total" : this.preloadData(this.definePage()).total,
                    "order_subtotal" : this.preloadData(this.definePage()).subtotal,
                    "order_shipping_amount" : (this.preloadData(this.definePage()).shippingTotal + this.preloadData(this.definePage()).handlingTotal),
                    "order_tax_amount" : this.preloadData(this.definePage()).taxTotal,
                    "order_shipping_first_name" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.firstName,
                    "order_shipping_last_name" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.lastNameOrSurname,
                    "order_shipping_company" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.companyOrOrganization,
                    "order_shipping_city" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.address.cityOrTown,
                    "order_shipping_state" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.address.stateOrProvince,
                    "order_shipping_street1" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.address.address1,
                    "order_shipping_zip" : this.preloadData(this.definePage()).fulfillmentInfo.fulfillmentContact.address.postalOrZipCode,
                    "order_shipping_method" : this.preloadData(this.definePage()).fulfillmentInfo.shippingMethodName,
                    
                    "order_billing_first_name" : this.preloadData(this.definePage()).billingInfo.billingContact.firstName,
                    "order_billing_last_name" : this.preloadData(this.definePage()).billingInfo.billingContact.lastNameOrSurname,
                    "order_billing_company" : this.preloadData(this.definePage()).billingInfo.billingContact.companyOrOrganization,
                    "order_billing_city" : this.preloadData(this.definePage()).billingInfo.billingContact.address.cityOrTown,
                    "order_billing_state" : this.preloadData(this.definePage()).billingInfo.billingContact.address.stateOrProvince,
                    "order_billing_street1" : this.preloadData(this.definePage()).billingInfo.billingContact.address.address1,
                    "order_billing_zip" : this.preloadData(this.definePage()).billingInfo.billingContact.address.postalOrZipCode,
                    "order_billing_email" : this.preloadData(this.definePage()).billingInfo.billingContact.email,
                    "order_shipping_countryCode" : this.preloadData(this.definePage()).billingInfo.billingContact.address.countryCode,
                    "order_estimate_date" : sdate,
   
                    "product_code" : this.orderDetail('id'),
                    "product_variation_code": this.orderDetail('vid'),
                    "product_name" : this.orderDetail('name'),
                    "product_quantity" : this.orderDetail('qty'),
                    "product_list_price" : this.orderDetail('list'),
                    "product_unit_price" : this.orderDetail('unit'),
                    "product_sale_price" : this.orderDetail('sale'),
                    "product_msrp" : this.orderDetail('msrp'),
                    "product_type" : this.orderDetail('type'),
                    "product_images" : this.orderDetail('images'),
                    "order_type" : "Online",
                }));
                
            }
        },
        /* jshint ignore:end */
        checkPage: function() {
            (this.gtmTag === undefined) ? this.gtmTag = this.debug.site.themeSettings.gtmTag : "";// jshint ignore:line
            this.buildTag();
            this.loadGtm(true);
        },
        buildGtm: function() {
            return '<noscript><iframe src="//www.googletagmanager.com/ns.html?id='+this.gtmTag+'" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>' +
            '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\': new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],' +
            'j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\'//www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);' +
            '})(window,document,\'script\',\'dataLayer\',\''+this.gtmTag+'\');<\/script>';
        },
        loadGtm: function(x,options) {
            if(x) $('body').prepend(this.buildGtm());
        }
   };
   $(document).ready(function(){
         if(!require.mozuData('pagecontext').isEditMode)  new ampGtm();  
   });
   
});









