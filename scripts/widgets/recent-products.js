/**
 * Creates an interface object to the Mozu store's Web APIs. It pulls in the Mozu
 * JavaScript SDK and initializes it with the current store's context values
 * (tenant, catalog and store IDs, and authorization tickets).
 */
define(['modules/jquery-mozu','modules/api', 'hyprlive', "modules/backbone-mozu","widgets/powerreviews", "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($,api,Hypr,Backbone,PowerReviewsWidget) {
    
    var cookieData      = {}, 
        maxNoProducts   = $(".mz-recentProductsGallery").data().maxProduct,
        newDate         = new Date(),
        expDays         = 30,
        productIds;
    
    newDate.setTime(newDate.getTime() + (expDays*24*60*60*1000));
    document.cookie = "maxRecentProducts="+maxNoProducts+";expires="+newDate.toUTCString()+";path=/";
    
    document.cookie.split("; ").map(function(value)
    { 
        if( value.split("=")[0].indexOf("recentProduct") != -1)
            cookieData[value.split("=")[0]] = value.split("=")[1];
    });
    
    if(cookieData.recentProduct)
    {
        productIds = cookieData.recentProduct.split(",").reverse();
        if(require.mozuData("pagecontext").pageType == "product")
        {
            productIds.map(function(value, index) {
                if(value == require.mozuData("product").productCode)
                    productIds.splice(index, 1);
            });
        }
        productIds = productIds.join().replace(/,/g, " or productCode+eq+");
         var t = api.context.tenant;
        var s = api.context.site;
        var filepath = ""+require.mozuData("sitecontext").cdnPrefix+"/cms/" + s + "/files/";
        if (productIds !== "" && productIds !== null) 
        {
            api.request("get", "/api/commerce/catalog/storefront/productsearch/search/?startIndex=0&pageSize=30&filter=productCode+eq+"+productIds).then(function(products)
            {
                var label1,compare,special,productContent, img, a, div, productName, salePrice, retailPrice, rating, ratingScript, ratingContent;

                //var QOModel  = Backbone.MozuModel.extend({});
              
                for(var i=0; i<products.items.length; i++)
                {
                    var hideproduct = _.where(products.items[i].properties, {attributeFQN: "tenant~hide-product"});
                    var priceval, labelval, pricelabel;
                    if(hideproduct.length > 0){
                        if(hideproduct[0].values[0].value){

                        }else{
                            if(products.items[i].content.productImages[0])
                            {
                                img = $("<img>").attr('src', products.items[i].content.productImages[0].imageUrl+"?max="+require.mozuData('sitecontext').themeSettings.listProductThumbSize+"&quality="+require.mozuData('sitecontext').themeSettings.cdnQuality);
                             $(img).attr("alt",products.items[i].content.productName);  
                            }
                            else{
                                img = $("<img>").attr('src', ""+filepath+"volt-noimageavailable.jpg?max="+require.mozuData('sitecontext').themeSettings.listProductThumbSize+"&quality="+require.mozuData('sitecontext').themeSettings.cdnQuality);
                                 $(img).attr("alt",products.items[i].content.productName);  
                            }
                            if(products.items[i].content.seoFriendlyUrl !== "" && products.items[i].content.seoFriendlyUrl !== undefined)
                            {
                                slug = "/"+products.items[i].content.seoFriendlyUrl;
                            }
                            else
                            {
                                slug = "";
                            }
                            a           = $("<a class='mz-recently-viewed-products-image'>").attr('href', slug+"/p/"+products.items[i].productCode);
                            div         = $("<div>").attr('class', 'mz-recently-viewed-products-gallery');
                            productName = $("<b class='mz-recently-viewed-products-name'>"+products.items[i].content.productName+"</b>");

                            //--rating--//
                            rating          = $("<div class='mz-recently-viewed-products-rating'></div>");  
                            ratingScript    = $("<script src='//static.powerreviews.com/widgets/v1/widget.js'></script>");  
                            ratingContent   = $.parseHTML("<div id='PRInlineRating-"+products.items[i].productCode+"' class='pr-inline-rating' data-mz-product-code="+products.items[i].productCode+" data-mz-product-url=/p/"+products.items[i].productCode+" style='display:none;'><div id='"+products.items[i].productCode+"' class='pr-snippet'><div id='reviewSnippetProduct'><div class='pr-snippet-wrapper'><div class='pr-snippet-stars'><div id='pr-snippet-star-image'>&nbsp;</div></div><div class='pr-clear'></div></div></div></div></div>");
                            
                            ratingScript.appendTo(rating);
                            $(ratingContent).appendTo(rating);
                            
                            //-- Price Values --//
                            labelval = _.where(products.items[i].properties, {attributeFQN: "tenant~price-label"});
                            if(labelval.length > 0){
                                label1 = labelval[0].values[0].value.split(","); 
                                //compare = (label1[0])? label1[0]:"";
                                special = (label1[1])? label1[1]:"Sale Price";
                            }else{
                                if(Hypr.getThemeSetting("salepricelabel") !== undefined ){
                                    special = Hypr.getThemeSetting('salepricelabel');
                                }else{
                                    special = "Sale Price";
                                }
                            }
                            pricelabel = $(document).find("#customersegmentval").val();
                            priceval = $(document).find("#customersegmentvallabel").val();
                            if((pricelabel !== undefined)&&(priceval !== undefined)){
                                if(products.items[i].priceRange){
                                     if(products.items[i].priceRange.lower.salePrice){ 
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price is-crossedout'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].priceRange.lower.salePrice.toFixed(2)+"</span></span>");  
                                    }
                                    else if(products.items[i].priceRange.lower.price){
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span></span>");  
                                     }
                                }
                                else{
                                    /*if(products.items[i].price.msrp)
                                    { 
                                        retailPrice = $("<span class='mz-recently-viewed-products-retailPrice'>"+compare+": $"+products.items[i].price.msrp.toFixed(2)+"</span>");    
                                    }*/
                                    if(products.items[i].price.salePrice){ 
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price is-crossedout'>$"+products.items[i].price.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].price.salePrice.toFixed(2)+"</span></span>");     
                                    }
                                    else if(products.items[i].price.price){
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price'>$"+products.items[i].price.price.toFixed(2)+"</span></span>");     
                                     }
                                }
                            }else{
                                if(products.items[i].priceRange){   
                                    if(products.items[i].priceRange.lower.salePrice){  
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price is-crossedout'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].priceRange.lower.salePrice.toFixed(2)+"</span></span>");     
                                    }
                                    else if(products.items[i].priceRange.lower.price){
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span></span>");      
                                     }
                                }
                                else{
                                    /*if(products.items[i].price.msrp)
                                    { 
                                        retailPrice = $("<span class='mz-recently-viewed-products-retailPrice'>"+compare+" : $"+products.items[i].price.msrp.toFixed(2)+"</span>");    
                                    }*/
                                    if(products.items[i].price.salePrice){ 
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price is-crossedout'>$"+products.items[i].price.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].price.salePrice.toFixed(2)+"</span></span>");     
                                    }
                                    else if(products.items[i].price.price){
                                        salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price'>$"+products.items[i].price.price.toFixed(2)+"</span></span>");     
                                     }
                                }
                            }   

                            

                            img.appendTo(a);
                            productName.appendTo(a);
                            a.appendTo(div);
                            if(retailPrice !== undefined){
                                retailPrice.appendTo(div);    
                            }
                            if(salePrice !== undefined){
                                salePrice.appendTo(div);    
                            }

                            rating.appendTo(div);        
                        }
                    }else{
                        if(products.items[i].content.productImages[0])
                        {
                            img = $("<img>").attr('src', products.items[i].content.productImages[0].imageUrl+"?max="+require.mozuData('sitecontext').themeSettings.listProductThumbSize+"&quality="+require.mozuData('sitecontext').themeSettings.cdnQuality);
                            $(img).attr("alt",products.items[i].content.productName);    
                        } 
                        else{
                            img = $("<img>").attr('src', ""+filepath+"volt-noimageavailable.jpg?max="+require.mozuData('sitecontext').themeSettings.listProductThumbSize+"&quality="+require.mozuData('sitecontext').themeSettings.cdnQuality);
                            $(img).attr("alt",products.items[i].content.productName); 
                        }

                        a           = $("<a class='mz-recently-viewed-products-image'>").attr('href', slug+"/p/"+products.items[i].productCode);
                        div         = $("<div>").attr('class', 'mz-recently-viewed-products-gallery');
                        productName = $("<b class='mz-recently-viewed-products-name'>"+products.items[i].content.productName+"</b>");

                        //--rating--//
                        rating          = $("<div class='mz-recently-viewed-products-rating'></div>");  
                        ratingScript    = $("<script src='//static.powerreviews.com/widgets/v1/widget.js'></script>");  
                        ratingContent   = $.parseHTML("<div id='PRInlineRating-"+products.items[i].productCode+"' class='pr-inline-rating' data-mz-product-code="+products.items[i].productCode+" data-mz-product-url=/p/"+products.items[i].productCode+" style='display:none;'><div id='"+products.items[i].productCode+"' class='pr-snippet'><div id='reviewSnippetProduct'><div class='pr-snippet-wrapper'><div class='pr-snippet-stars'><div id='pr-snippet-star-image'>&nbsp;</div></div><div class='pr-clear'></div></div></div></div></div>");
                        
                        ratingScript.appendTo(rating);
                        $(ratingContent).appendTo(rating);
                        
                        //-- Price Values --//
                        labelval = _.where(products.items[i].properties, {attributeFQN: "tenant~price-label"});
                        if(labelval.length > 0){
                            label1 = labelval[0].values[0].value.split(","); 
                            //compare = (label1[0])? label1[0]:"";
                            special = (label1[1])? label1[1]:"Sale Price";
                        }else{
                            if(Hypr.getThemeSetting("salepricelabel") !== undefined ){
                                special = Hypr.getThemeSetting('salepricelabel');
                            }else{
                                special = "Sale Price";
                            }
                        }
                        pricelabel = $(document).find("#customersegmentval").val();
                        priceval = $(document).find("#customersegmentvallabel").val();
                        if((pricelabel !== undefined)&&(priceval !== undefined)){
                            if(products.items[i].priceRange){
                                 if(products.items[i].priceRange.lower.salePrice){ 
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price is-crossedout'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].priceRange.lower.salePrice.toFixed(2)+"</span></span>");  
                                }
                                else if(products.items[i].priceRange.lower.price){
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span></span>");  
                                 }
                            }
                            else{
                                /*if(products.items[i].price.msrp)
                                { 
                                    retailPrice = $("<span class='mz-recently-viewed-products-retailPrice'>"+compare+": $"+products.items[i].price.msrp.toFixed(2)+"</span>");    
                                }*/
                                if(products.items[i].price.salePrice){ 
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price is-crossedout'>$"+products.items[i].price.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].price.salePrice.toFixed(2)+"</span></span>");     
                                }
                                else if(products.items[i].price.price){
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+priceval+": <span class='mz-price'>$"+products.items[i].price.price.toFixed(2)+"</span></span>");     
                                 }
                            }
                        }else{
                            if(products.items[i].priceRange){   
                                if(products.items[i].priceRange.lower.salePrice){  
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price is-crossedout'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].priceRange.lower.salePrice.toFixed(2)+"</span></span>");     
                                }
                                else if(products.items[i].priceRange.lower.price){
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price'>$"+products.items[i].priceRange.lower.price.toFixed(2)+"</span></span>");      
                                 }
                            }
                            else{
                                /*if(products.items[i].price.msrp)
                                { 
                                    retailPrice = $("<span class='mz-recently-viewed-products-retailPrice'>"+compare+" : $"+products.items[i].price.msrp.toFixed(2)+"</span>");    
                                }*/
                                if(products.items[i].price.salePrice){ 
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price is-crossedout'>$"+products.items[i].price.price.toFixed(2)+"</span> <span class='mz-price'>$"+products.items[i].price.salePrice.toFixed(2)+"</span></span>");     
                                }
                                else if(products.items[i].price.price){
                                    salePrice   = $("<span class='mz-recently-viewed-products-salePrice'>"+special+": <span class='mz-price'>$"+products.items[i].price.price.toFixed(2)+"</span></span>");     
                                 }
                            }
                        }   

                        

                        img.appendTo(a);
                        productName.appendTo(a);
                        a.appendTo(div);
                        if(retailPrice !== undefined){
                            retailPrice.appendTo(div);    
                        }
                        if(salePrice !== undefined){
                            salePrice.appendTo(div);    
                        }

                        rating.appendTo(div);
                    }
                    
                    div.appendTo('.mz-recentProductsGallery');
                }
                $(document).ready(function(){                    
                    $('.mz-recentProductsGallery').owlCarousel({  
                        loop:false,
                        margin:10,
                        padding:30,
                        dots: false,
                        autoplay:false, 
                        showNavPreview: true,
                        //animateIn: 'fadeIn',
                        //animateOut: 'fadeOut',     
                        responsive : {
                            1024 : {
                                items: 4,
                                nav: (products.items.length <=4 ? false : true)
                            },
                            768 : {
                                items: 2,
                                nav: (products.items.length <=2 ? false : true)
                            },
                            640 : {
                                items: 2,
                                nav: (products.items.length <=2 ? false : true)
                            },
                            300 : {
                                items: 1,
                                nav: (products.items.length <=1 ? false : true)
                            }
                        },
                        addClassActive:true,
                        navThumbImg: false,
                    });
                    
                    // add power reviews to product list on render
                    if(Hypr.getThemeSetting('managePowerReview')) 
                        PowerReviewsWidget.writeProductListBoxes();
                });


            });
        }
        else {
            if(!require.mozuData("pagecontext").isEditMode)
                $(".recently-viewed").hide();
        }
    }
    else {
        if(!require.mozuData("pagecontext").isEditMode)
            $(".recently-viewed").hide(); 
    }
});