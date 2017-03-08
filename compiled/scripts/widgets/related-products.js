define(['modules/jquery-mozu', 'underscore', "modules/api", "modules/backbone-mozu", "modules/models-product"],
    function ($, _, api, Backbone, ProductModels) {

        var getRelatedProducts = function(pageType, codes, pageSize) {
            var filter = _.map(codes, function(c) { return "ProductCode eq " + c; }).join(' or ');
            var retval = '';

            switch (pageType) {
                case 'product': retval = api.get("search", { filter: filter });
                    break;
                case 'cart': retval = api.get("search", { filter: filter, pageSize: pageSize });
                    break;
            }

            return retval;
        },

        coerceBoolean = function(x) {
            return !!x;
        };

        var pageContext = require.mozuData('pagecontext');

        $(document).ready(function() {
            var productCollection = [];

            switch(pageContext.pageType) {
                case 'product':
                    productCollection.push(require.mozuData('product'));
                    break;
                case 'cart':
                    var cartItems = require.mozuData('cart').items;
                    $.each(cartItems, function(index, value) {
                        productCollection.push(value.product);
                    });
                    break;
            }
             
            $('[data-mz-related-products]').each(function (index, rp) {
                rp = $(rp);
             
                var config = rp.data('mzRelatedProducts');
                var attId = config.attributeId || 'tenant~product-crosssell';
                var template = config.template || 'modules/product/product-list-carousel';
                var title = config.title;
                var numberToDisplay = config.count || 5;
                var productCodes = [];// = _.pluck(currentProduct.properties[0].values, "value");
                

                var RelatedProductsView = Backbone.MozuView.extend({
                    templateName: template
                });
                
                for (var i = 0; i < productCollection.length; i++) {
                    var currentProduct = productCollection[i];
                    
                    if (currentProduct && currentProduct.properties) {
                        for (var x = 0; x < currentProduct.properties.length; x++) {
                            if (currentProduct.properties[x].attributeFQN == attId) {
                                var temp = _.pluck(currentProduct.properties[x].values, "value");
                                productCodes = productCodes.concat($.grep(temp || [], coerceBoolean));
                                
                            }
                        }
                    }
                }

                if (!productCodes || !productCodes.length) {
                    if (pageContext.isEditMode) {
                        rp.html('<b>tbd preview content</b>');
                    }
                    return;
                }

                getRelatedProducts(pageContext.pageType, productCodes, numberToDisplay).then(function (collection) {

                    collection.data.items = $.grep(collection.data.items, function(value) { return value.purchasableState.isPurchasable === true; });
                    var relatedProductsCollection = new ProductModels.ProductCollection(collection.data);
                    var relatedProductsView = new RelatedProductsView({
                        model: relatedProductsCollection,
                        el: rp
                    });
                    relatedProductsView.render();
                   
                    if(pageContext.pageType=="cart" && (require.mozuData('sitecontext').themeSettings.recommendationproduct==="" || !purchaseable || productExist)){
                        title="VOLT<sup>&reg;</sup> Recommends"; 
                    }
                    flagowl = false;
                    if(collection.data.items.length > 0){
                        rp.prepend('<h3>' + title + '</h3>'); 

                        if($(window).width() > 767)
                        {
                            if(collection.data.items.length > 4)
                            {
                                flagowl = true;
                            }
                        }
                        else
                        {
                            if(collection.data.items.length > 1)
                            {
                                flagowl = true;
                            }
                        } 
                        if(flagowl)
                        {
                            var owlcar = $(".mz-productlist-carousel").find(".mz-l-carousel");
                            owlcar.owlCarousel({
                                nav : true,
                                dots: false, 
                                loop:true,
                                responsiveClass:true,
                                responsive:{
                                    0:{
                                        items:1 
                                    },
                                    768:{
                                        items:4  
                                    },
                                    1025:{
                                        items:4
                                    }
                                }
                            });  
                            var owl = owlcar.data('owlCarousel');
                            $(document).on("click",".owl-next",function(){
                                owl.next();
                            });
                            $(document).on("click",".owl-prev",function(){
                                owl.prev();
                            });
                        }    
                    }  
                    if(pageContext.pageType=="cart" && (require.mozuData('sitecontext').themeSettings.recommendationproduct==="" || !purchaseable || productExist)){ 
                        $('.mz-related-products h3').addClass('removeborder');
                    }
                    else
                    {
                         $('.mz-related-products h3').removeClass('removeborder');
                    }
                    $(document).find(".left-cart").css({"background":"#f8f8f8"});
                    $(document).find(".leftcartcolor").css({"background":"#fff"});
                }); 
                
            }); 
        });
    });