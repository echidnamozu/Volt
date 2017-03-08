/**
 * This file adds some common plugins to jQuery and then returns jQuery, so you can require it instead of jQuery itself and then you're guaranteed to have these plugins.    * They are:
 *   **$.cookie** -- Adds cookie management, using normal jQuery overload style: $.cookie('foo') gets foo cookie, $.cookie('foo','bar') sets it. *(This plugin is a separate file, shimmed in using the shim plugin.)*
 *   **$.fn.jsonData** -- Equivalent to the getter function of  $.fn.data, but without a weird jQuery bug that fails to parse JSON properly if it's been HTML escaped into an attribute.
 *   **$.fn.noFlickerFadeIn** -- A version of $.fn.fadeIn that operates on visibility:invisible objects, so there's no document reflow.
 *   **$.fn.ScrollTo** -- A plugin to smoothly scroll any element into view.
 */
define(["jquery", "vendor/jquery-scrollto","shim!vendor/bootstrap-select[jQuery=jquery]","vendor/jquery.cookie/jquery.cookie","shim!vendor/owl.carousel[jquery=jQuery]", "modules/dropCookie"], function ($) {

   //Drop cookie for recent products. (cookieValue, Expiry Date(optional), cookieValue(Optional))
    if(require.mozuData("pagecontext").pageType == "product")
    {
        var pd = require.mozuData("product");
        if( pd.productType === "CustomizedProducts" || pd.productType==="single_customised_bulbs" || pd.productType==="customised_bulb_products" || pd.productType==="multiple_customised_bulbs" || pd.productType==="Standard") 
        {
           dropCookie(require.mozuData("pagecontext").productCode);   
        }
    }     
    
    
    $.fn.jsonData = function (dataAttr) {
        var d = this.attr("data-mz-" + dataAttr);
        return (typeof d === 'string' && d.charAt(0).match(/[\{\[\(]/)) ? $.parseJSON(d) : d;
    };

    // use this instead of fadeIn for elements that are set to visibility: hidden instead of display:none
    // display:none on large elements makes the page look tiny at first, the footer hugging the header
    $.fn.noFlickerFadeIn = function () {
        this.css('visibility', 'visible');
        if (Modernizr.csstransitions) {
            this.css('opacity', 1);
        } else {
            this.animate({ opacity: 1 }, 300);
        }
    };

    // get url query parameters
    $.deparam = function(querystring) {
        // remove any preceding url and split
        querystring = querystring || window.location.search;
        querystring = querystring.substring(querystring.indexOf('?') + 1).split('&');
        var params = {}, pair, d = decodeURIComponent, i;
        // march and parse
        for (i = querystring.length; i > 0;) {
            pair = querystring[--i].split('=');
            if (pair && pair.length > 1) params[d(pair[0])] = d(pair[1].replace(/\+/g, '%20'));
        }

        return params;
    };//--  fn  deparam

    //Custom data mapping
    $.debug = function(x,options) {
        if(!x) return;
        var rdata = {},pagecontext = require.mozuData('pagecontext'),apicontext = require.mozuData('apicontext'),user = require.mozuData('user'),site = require.mozuData('sitecontext');
        (pagecontext !== undefined)? rdata.pagecontext = pagecontext:rdata.pagecontext = "";// jshint ignore:line
        (apicontext !== undefined)? rdata.apicontext = apicontext:rdata.apicontext="";// jshint ignore:line
        (user !== undefined) ? rdata.user = user: rdata.user = "";// jshint ignore:line
        (site !== undefined) ? rdata.site = site: rdata.site = "";// jshint ignore:line
        if(rdata.pagecontext.isDebugMode) console.log("Debugmode enabled. All logs will be displayed in //console");
        return rdata;
    };
    
    //get current url 
    $.url = function(x,options) {
        if(!x) return;
            var urlData = { 
            url: window.location,
            page: window.location.pathname.split('/').pop(),
            urlCheck1: window.location.pathname.split('/').pop().toString().toLowerCase(),
            urlCheck2: !window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase(),
            urlCheck3: !window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase(),
            urlParam: function(sParam) {
                var sPageURL = window.location.search.substring(1),sURLVariables = sPageURL.split('&');
                for (var i = 0; i < sURLVariables.length; i++) 
                {
                    var sParameterName = sURLVariables[i].split('=');
                    if (sParameterName[0] == sParam) 
                    {
                        return sParameterName[1];
                    }
                }
                }
           };
        if($.debug(1).pagecontext.isDebugMode) console.log("URL's",urlData );
        return urlData;
    };
    
    //Bronto cart abandonment JSON build
    $.brontoJSON = function(x,options) {
        if(!x) return;
        
        var brontoCart = {},lineItems=[],y, ss = [];
        if($.url(true).urlCheck1 == "confirmation") {
           if (sessionStorage.cartObjBronto) {
                y = JSON.parse(sessionStorage.cartObjBronto);
           } else {
               y = x.toJSON();
           }
        } else {
            y=x.toJSON();
            sessionStorage.removeItem('cartObjBronto');
            sessionStorage.cartObjBronto=JSON.stringify(y);
        }
        brontoCart.customerCartId = y.id;
        brontoCart.subtotal = y.subtotal; 
        brontoCart.discountAmount = y.discountTotal;
        brontoCart.url = $.url(1).url.href;
        brontoCart.currency = "USD";
        if($.url(true).urlCheck1 == "confirmation") {
            var stax = require.mozuData("order");
            brontoCart.taxAmount = stax.taxTotal;
            brontoCart.grandTotal = stax.total;
        }else{
            brontoCart.taxAmount = y.taxTotal;
            brontoCart.grandTotal = y.total;    
        }  
        brontoCart.customerEmail = $.debug(1).user.email;
        brontoCart.customerId = $.debug(1).user.accountId;
        if($.url(true).urlCheck1 == "confirmation"){
            brontoCart.orderId = require.mozuData('order').orderNumber;
        }
        for(var b=0;b<y.items.length;b++) { 
            lineItems.push({
               other: null,
               imageUrl: y.items[b].product.imageUrl,
               unitPrice: y.items[b].product.price.price,
               sku: (y.items[b].product.productCode),
               category: null,
               description: null,
               productUrl: $.url(1).url.origin+""+ y.items[b].product.url,
               name: y.items[b].product.name,
               quantity: y.items[b].quantity,
               salePrice: (y.items[b].product.price.salePrice !== undefined)? y.items[b].product.price.salePrice: "",
               totalPrice: y.items[b].discountedTotal
            });
        }
        ss.push({
            processed: true,
            shipped: false
        });
        brontoCart.lineItems = lineItems;
        if($.url(true).urlCheck1 == "confirmation") {
            brontoCart.states = ss;
        }
        if($('body').find('script[name="bronto-tag"]').length) $('body').find('script[name="bronto-tag"]').remove(),$('body').find('script[name="bronto-json"]').remove();// jshint ignore:line
        $('body').append("<script type='text/javascript' name='bronto-json' >var BrontoJSONobj = " + JSON.stringify(brontoCart) + "</script>");   
        $.addBronto(); 
    };     
    
    //Added Script for Bronto      
    $.addBronto = function(options) {      
        $('body').append(require.mozuData('sitecontext').themeSettings.brontoTag.replace(/(\r\n|\n|\r)/gm,"")); 
    }; 
    return $.noConflict();

});
