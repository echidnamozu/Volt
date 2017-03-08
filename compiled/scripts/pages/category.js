
define('pages/category',['modules/jquery-mozu',  'underscore', 'modules/backbone-mozu', 'hyprlive','modules/models-product','modules/api',"modules/views-collections", "modules/models-faceting",'modules/cart-monitor',"widgets/powerreviews", 'modules/views-paging' ], function($, _,  Backbone, Hypr,ModelsProduct, api, CollectionViewFactory, FacetingModels, CartMonitor, PowerReviewsWidget) {


    var ColorImageCache ={};

    var ProductListView = Backbone.MozuView.extend({ 
        templateName: 'modules/product/product-list-tiled', 
        
        getColorImages:function(){
            var ProductList = this.model.attributes.items.models;
            for(var prdinc = 0; prdinc<ProductList.length; prdinc++){
                var productProperties = ProductList[prdinc].attributes.properties,
                    productcode = ProductList[prdinc].attributes.productCode,
                    productcolorimagesstr ="";
                    ProductList[prdinc].colorswatchimage=null;
                    ProductList[prdinc].showswatchimage=false;
                if(ProductList[prdinc].attributes.properties!==undefined){  
                    for(var index=0; index<productProperties.length;index++){
                        if(productProperties[index].attributeFQN.toLowerCase() == "tenant~product-color-images"){
                            if(productProperties[index].values.length>0){
                                for(var val in productProperties[index].values){
                                    productcolorimagesstr = $.trim(productProperties[index].values[val].stringValue);
                                }
                            }
                        }
                    }
                } 
                if(productcolorimagesstr!==""){
                    var productcolorimgarr = productcolorimagesstr.split("$");
                     var sitecontext = require.mozuData('sitecontext');
                     var imagefilepath = sitecontext.cdnPrefix+'/cms/'+sitecontext.siteId+'/files';
                    if(productcolorimgarr.length>0)
                    {
                        chooseProductcolorimg(productcolorimgarr);
                    }
                }
            }
                
            function chooseProductcolorimg(productcolorimgarr) {
                var cdnquality=Hypr.getThemeSetting("cdnQuality");
                _.each(productcolorimgarr, function (imgdata) {
                            var imagecontent = $.trim(imgdata),imgdataarr = imagecontent.split(':'),colorstr = $.trim(imgdataarr[0]);
                            colorstr = colorstr.replace(/ /g, '-').toLowerCase();
                            var imagesstr = $.trim(imgdataarr[1]), colorkey = productcode+'_'+colorstr;
                            if(imagesstr!==""){
                                var imagesarr = imagesstr.split(','), imagecachearr = {},imagejson;
                                if(imagesarr.length>0){
                                    imagejson = new Image();
                                    imagejson.src = imagefilepath+'/'+$.trim(imagesarr[0]+'?max=320&quality='+cdnquality);
                                    imagejson.title = colorstr;
                                    imagejson.sequence = 0;
                                }
                                ColorImageCache[colorkey] = imagejson;
                            }
                        });
            } 
        },
        
       
        render:function(){  
            this.getColorImages();
            this.model.set('pagetype',require.mozuData('pagecontext').pageType); 
             _.each(this.model.toJSON().items, function(conf, i, obj) {
                var msrp,quantity,price,tempval,saveprice;
                if(conf.hasPriceRange){
                    msrp = conf.priceRange.lower.msrp;
                    quantity = (conf.quantity)?conf.quantity:1;
                    price = (conf.priceRange.lower.salePrice)?conf.priceRange.lower.salePrice:conf.priceRange.lower.price; 
                    tempval = (msrp * quantity)-(price * quantity);
                    saveprice = tempval.toFixed(2);
                    $(document).find('[data-mz-product="'+conf.productCode+'"]').find(".mz-productlisting-savings span").text("$"+saveprice);
                    conf.saveprice=saveprice; 
                }else if(conf.price.msrp){
                    msrp = conf.price.msrp;
                    quantity = (conf.quantity)?conf.quantity:1;
                    price = (conf.price.salePrice)?conf.price.salePrice:conf.price.price; 
                    tempval = (msrp * quantity)-(price * quantity);
                    saveprice = tempval.toFixed(2);
                    $(document).find('[data-mz-product="'+conf.productCode+'"]').find(".mz-productlisting-savings span").text("$"+saveprice);
                    conf.saveprice=saveprice; 
                } 
            }); 
            Backbone.MozuView.prototype.render.apply(this, arguments);
            
            $('select').selectpicker();      
                
            $(require.mozuData('facetedproducts').items).each(function(i,j){    
                var dfcolordata,dfcolor = _.findWhere(j.properties, {attributeFQN: "tenant~default-option-product-code"});
                var coloroption = _.findWhere(j.options, {attributeFQN: "tenant~color"});
                if(coloroption && dfcolor){     
                    dfcolordata = _.findWhere(j.variations, {productCode: dfcolor.values[0].value});
                    if(dfcolordata) { 
                        var dfcolorval = _.findWhere(dfcolordata.options, {attributeFQN: "tenant~color"}); 
                         
                        if(dfcolorval.value){  
                            $(document).find("[data-mz-product="+j.productCode+"]").find(".color-swatches-icon").each(function(i,v){
                                var val = $(this).find(".color-span").attr("id");
                                if(dfcolorval.value.toLowerCase() === val){   
                                    var colorswatchcode=$.trim($(this).attr('colorswatchcode'));
                                    colorswatchcode = colorswatchcode.replace(/-$/g, '');
                                    if(ColorImageCache[colorswatchcode]!==undefined){
                                        $(this).parents(".mz-productlist-item").find('.mz-productlisting-image img').prop('data-src', ColorImageCache[colorswatchcode].src) ;
                                    }   
                                }
                            });    
                        }
                    }
                }
                if(coloroption){  
                    if(dfcolor){
                        dfcolordata = _.findWhere(j.variations, {productCode: dfcolor.values[0].value});
                    }else{
                        dfcolordata = _.findWhere(j.variations, {productCode: j.variations[0].productCode });    
                    }
                    if(j.options.length < 2){
                        if((dfcolordata.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(dfcolordata.inventoryInfo.onlineStockAvailable === 0)){
                            $(document).find("[data-mz-product="+j.productCode+"]").find(".add-cart").html('<a id="add-tocart" data-mz-action="backorderbutton" backorderbutton="backorder" title="Add To Cart"> Add To Cart </a>');
                        }
                    }    
                }
            });  
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            $(".dateFormatClass").each(function(){
                 var orderDate = $(this).text();
                var formattedDate=new Date(orderDate);
                var d = formattedDate.getDate();
                var m =  formattedDate.getMonth();
                var mnth=monthNames[m];
                var y = formattedDate.getFullYear();
                $(this).text(mnth+" "+d+", "+y);
            }); 
            
            var divh=$('.clamped').height(); 
            var p=$('.clamped .text');
            $(p).each(function(){
                if($(this).outerHeight()>divh){
                    $(this).text(function(index, currentText) {
                        return currentText.substr(0, 105) + "....";
                    });
                }
            });
            
           
            
            if(($( window ).width()) > 767 ){    
                $(".color-swatches-icon").on('click', function(e){
                    var obj,extraoption={},options=[];
                    e.preventDefault();
                    obj=e.currentTarget;  
                    var prcode = $(obj).parents(".mz-productlisting").attr("data-mz-product");
                    var customvar = $(obj).parents(".mz-productlisting").find(".customcart");
                    extraoption.attributeFQN = $(obj).attr("option-name");
                    extraoption.value = $(obj).attr("color_value");
                    options.push(extraoption); 
                    $(".cart-out-of-stock").css("display","none");
                    $(obj).parents(".mz-productlisting").find("#add-tocart").removeClass("is-processing");
                    
                    obj=$(this).parent();
                    var colorswatchcode=$.trim($(this).attr('colorswatchcode'));
                    colorswatchcode = colorswatchcode.replace(/-$/g, '');
                    if(ColorImageCache[colorswatchcode]!==undefined){
                        $(this).closest(".mz-productlist-item").find('.mz-productlisting-image img').prop('src', ColorImageCache[colorswatchcode].src) ; 
                        $(this).closest(".mz-color-block").find(".active-color-text").html($(this).find(".color-span").attr("color_value"));
                    }
                    $(obj).find('.color-swatches-icon').each(function(){
                        $(this).find('.color-span').removeAttr("style");
                        if($(this).find('.color-span').hasClass("active-color")){
                            $(this).find('.color-span').removeClass("active-color");
                        }
                    });
                    
                    $(this).find('.color-span').addClass("active-color");
                    $(this).closest(".mz-color-block").find(".active-color-text").html($(this).find(".color-span").attr("color_value"));
                    if(customvar === undefined){
                        api.request("post","/api/commerce/catalog/storefront/products/"+prcode+"/configure?includeOptionDetails=true",{options:options}).then(function(response){
                            if((response.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(response.inventoryInfo.onlineStockAvailable === 0)){
                                $(document).find("[data-mz-product="+response.productCode+"]").find(".add-cart").html('<a id="add-tocart" data-mz-action="backorderbutton" backorderbutton="backorder" title="Add To Cart"> Add To Cart </a>');
                            } else{
                                $(document).find("[data-mz-product="+response.productCode+"]").find(".add-cart").html('<a  class="color_buy_product" mz-quick-add-to-cart="'+response.productCode+'" id="add-tocart" title="Add To Cart"> Add To Cart </a>');
                            }  
                        });
                    }    
                });
            }else{
                
                $(".color-swatches-icon").on('click', function(e){
                    $(".cart-out-of-stock").css("display","none");
                    var obj,extraoption={},options=[];
                    e.preventDefault();
                    obj=e.currentTarget;  
                    var prcode = $(obj).parents(".mz-productlisting").attr("data-mz-product");
                    var customvar = $(obj).parents(".mz-productlisting").find(".customcart");
                    extraoption.attributeFQN = "tenant~color";
                    extraoption.value = $(obj).attr("color_value");
                    options.push(extraoption);         
                    $(document).find("#add-tocart").removeClass("is-processing"); 
                    e.preventDefault();
                    if(!$(this).find('.color-span').hasClass("mobile-active-color")){
                        var colorswatchcode=$.trim($(this).attr('colorswatchcode'));
                        colorswatchcode = colorswatchcode.replace(/-$/g, '');
                        if(ColorImageCache[colorswatchcode]!==undefined){
                            $(this).closest(".mz-productlist-item").find('.mz-productlisting-image img').prop('src', ColorImageCache[colorswatchcode].src) ; 
                            $(this).closest(".mz-color-block").find(".active-color-text").html($(this).attr("color_value"));
                            $(this).parent().find('.color-span').removeClass("mobile-active-color");
                            $(this).find('.color-span').addClass("mobile-active-color");
                        }
			e.preventDefault();
                        if(customvar === undefined){
                            api.request("post","/api/commerce/catalog/storefront/products/"+prcode+"/configure?includeOptionDetails=true",{options:options}).then(function(response){
                                if((response.inventoryInfo.outOfStockBehavior === "AllowBackOrder")&&(response.inventoryInfo.onlineStockAvailable === 0)){
                                    $(document).find("[data-mz-product="+response.productCode+"]").find(".add-cart").html('<a id="add-tocart" data-mz-action="backorderbutton" backorderbutton="backorder" title="Add To Cart"> Add To Cart </a>');
                                } else{
                                    $(document).find("[data-mz-product="+response.productCode+"]").find(".add-cart").html('<a  class="color_buy_product" mz-quick-add-to-cart="'+response.productCode+'" id="add-tocart" title="Add To Cart"> Add To Cart </a>');
                                }    
                            });
                        }    
                    }
                           
                }); 
            }
            
            $('.quickview-preloader').hide();
            
            var methis=this.model;
            var tempflag=false;
            $(this.model.get("facets")).each(function(){   
                if(this.models.length > 0 ){
                    tempflag=true;    
                }
                        
                
            });  
            if(!tempflag){
                $(document).find(".filtersection").remove();   
            }else{
                $(document).find(".filtersection").show();  
             }
            
            // session storage
            var sessionValue=this.model.query; 
            //sessionStorage.setItem('serachquery',JSON.stringify(sessionValue));
        },     
        
        addtocart: function (e) {
            if($(e.currentTarget).attr("disabled")!="disabled"){
                var $target = $(e.currentTarget),productCode = $target.attr("mz-quick-add-to-cart");
                $($target).addClass("is-processing");
                api.get('product', productCode).then(function(sdkProduct) {
                    var PRODUCT = new ModelsProduct.Product(sdkProduct.data);
                    PRODUCT.addToCart();
                    PRODUCT.on('addedtocart', function(attr) {
                      $($target).removeClass("is-processing");   
                        CartMonitor.updateCart();
                        if (($(window).width()) < 768) {
                        //Check is user is valid or not
                             window.location.href = require.mozuData("pagecontext").secureHost+"/cart";
                        }
                    });
                }); 
            }
        },
        backorderbutton : function(obj) {
            $(obj.currentTarget).parents(".cart-block").prev().fadeIn(500);
        }
        
    });
    
 
   
 
   
    $(document).ready(function() {
        segmentval(); 
        $('.mz-facetingform').hide();
        $('select').selectpicker();
        $('#mz-state').css('display','block'); 
        $(".mz-loginform-page .bootstrap-select").css('display','none');
        var ss = $(".mz-productlist-tiled").find(".mz-productlist-item");
        if(ss.length < 1){
            $(document).find(".filtersection").remove(); 
        }
        
        var factedroducts = require.mozuData('facetedproducts'),
        model = new FacetingModels.Category(factedroducts);
        window.productlistView = new ProductListView({model:model});
        window.productlistView.render();
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-category]'), 
            template: "category-interior"
        });
        $('.preloader').hide();

        // hide pagination for video, news, articles

        if((factedroducts.items.length < 1)&&((require.mozuData("pagecontext").title.toLowerCase() === "news" ) || (require.mozuData("pagecontext").title.toLowerCase() === "articles" ) || (require.mozuData("pagecontext").title.toLowerCase() === "videos" ))){
            $(".mz-l-paginatedlist-footer").hide();
            $(".mz-pagingcontrols").hide(); 
        }
        
        // add power reviews to product list on render
        if(Hypr.getThemeSetting('managePowerReview')) window.productlistView.on('render', PowerReviewsWidget.writeProductListBoxes);
        
         

        $(document).on("facetview", function(){
            avoidScrollJump();
            $("html, body").animate({scrollTop: $('.mz-l-paginatedlist-list').offset().top - 200},1000);
            $('.preloader').hide();
            $('body').css('overflow','auto');
            factedroducts = require.mozuData('facetedproducts'); 
            model = new FacetingModels.Category(factedroducts);
            window.productlistView = new ProductListView({model:model});
            window.productlistView.render();  
            if(Hypr.getThemeSetting('managePowerReview')) PowerReviewsWidget.writeProductListBoxes();
             function $_GET(param) {
                var vars = {};
                window.location.href.replace( location.hash, '' ).replace( 
                    /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
                    function( m, key, value ) { // callback 
                        vars[key] = value !== undefined ? value : '';
                    }
                );
            
                if ( param ) {
                    return vars[param] ? vars[param] : null;    
                }
                return vars;
                }
                
                var name = $_GET('facetValueFilter');
                if(name !== null ){
                    var temparray=name.split("&");
                    for(var i=0; i<temparray.length;i++){ 
                        var splitarray=temparray[i].split(":");
                        if(splitarray[0]=="tenant~resource-classification"){
                            $("[data-mz-type]").removeClass("active"); 
                            $("[data-mz-type='"+splitarray[1].replace(/[^a-zA-Z ]/g, "")+"']").addClass("active");
                        }
                    }    
                }           
            $('select').selectpicker();
            segmentval(); 
            var ss = $(".mz-productlist-tiled").find(".mz-productlist-item");
            if(ss.length < 1){
                $(document).find(".filtersection").remove(); 
            }
            
        });
        $(document).on('click', '.mz-backorder-popup button', function (e) {
            $(e.currentTarget).parents('.mz-backorder-popup').fadeOut(500);
        });
        $(document).on('click', 'button.addtocart', function(e){
            productlistView.addToCart(e);
        });

        $(document).on('click', '[backorderbutton]', function(e){  
           window.productlistView.backorderbutton(e);
        });  

        function segmentval(){
            var pricelabel = $(document).find("#customersegmentval").val();
            var priceval = $(document).find("#customersegmentvallabel").val();
            if((pricelabel !== undefined)&&(priceval !== undefined)){
                var csale = $(document).find(".customersaleprice").text();
                $(document).find(".customersaleprice").each(function(){
                    $(this).text(priceval+":");
                    $(this).show();
                });
            }
            $(document).find(".customersaleprice").each(function(){
                $(this).show();
            });
        }

        
        $(document).on('click', '[mz-quick-add-to-cart]', function(e){
           window.productlistView.addtocart(e);
        });
        $(document).on('click', 'button.addtocart', function(e){
           window.productlistView.addtocart(e);
        });
        
        
        //filter header floating
        
        avoidScrollJump();
        
        function avoidScrollJump() {
            $('.mz-mobile.plpbreadcrumbsss-wrap').css({'min-height': $('.mz-mobile.plpbreadcrumbsss').height()});
            $('.plpbreadcrumb-wrap').css({'min-height': $('.plpbreadcrumb').height()});
            $('.slidebar-container-wrap').css({'min-height': $('.slidebar-container').height()});
        }
        
        $(window).bind('scroll', function() {
            var navHeight = ($( window ).width() > 767 ? $('.plpbreadcrumb-wrap').offset().top - 102: $('.plpbreadcrumbsss-wrap').offset().top - 90);
            if ($(window).scrollTop() > navHeight) {
                addHeaderFixed();
            }
            else {
                removeHeaderFixed();
            }
        });
       
        function addHeaderFixed() {
            if($( window ).width() > 767)
            {
                $('.plpbreadcrumb').addClass('plp-header-fixed');
                $(".slidebar-container").addClass('fixed');
            }
            else
                $('.plpbreadcrumbsss').addClass('plp-header-fixed');
        }
        
        function removeHeaderFixed() { 
            if($( window ).width() > 767)
            {
                $('.plpbreadcrumb').removeClass('plp-header-fixed'); 
                $(".slidebar-container").removeClass('fixed');
            }
            else 
                $('.plpbreadcrumbsss').removeClass('plp-header-fixed');            
        }
        
        $(document).on('click','.facetapply', function (e) {     
            $(this).parents('.mz-facetingform').slideUp();
            avoidScrollJump();
        });    

         
        $(document).on('change','.mz-facetingform-value', function (e) {
            var checked=0;
            if (($(window).width()) > 767) {
                $(".mz-facetingform-facet input:checkbox:checked").each(function(){
                    checked++;
                });
                if(checked > 0){
                    $('.mz-l-sidebar').find('.facetapply').removeAttr('disabled');    
                }else{
                    $('.mz-l-sidebar').find('.facetapply').attr('disabled','disabled');    
                }
            }else{
                $(".mz-facetingform-facet-mobile input:checkbox:checked").each(function(){
                    checked++;
                });
                if(checked > 0){
                    $('.mz-mobile-facets').find('.facetapply').removeAttr('disabled');    
                }else{
                    $('.mz-mobile-facets').find('.facetapply').attr('disabled','disabled');    
                }
            }
            
        });  
         
        $(document).on('click','[jb-mobSort]',function (e) {
            $('.mz-pagesort-mobile').fadeIn(); 
            $('body').css('overflow','hidden');
        });
        
        
        $(document).on('click','.tz-mobrefine', function(e) { 
            $('.mz-mobile-facets .mz-l-sidebaritem-new ul.mz-facetingform-facet-mobile').hide();
            if($('.mz-mobile-facets .mz-l-sidebaritem-new').first().find(".selected span").hasClass("mz-close-facet")){
                $('.mz-mobile-facets .mz-l-sidebaritem-new').first().find(".selected span").removeClass("mz-close-facet");
                $('.mz-mobile-facets .mz-l-sidebaritem-new').first().find(".selected span").addClass("mz-open-facet");
            }
            $('.mz-mobile-facets .mz-l-sidebaritem-new').first().find('ul.mz-facetingform-facet-mobile').show();
            $("[mz-mobile-facets]").fadeIn();
            $('body').css('overflow','hidden');
        });


        $(document).find('ul.mz-facetingform-facet-mobile').slideUp();

        $(document).on('click',".mz-mobile-facets .mz-l-sidebaritem-new h4", function(e){

            //$(this).closest('.mz-l-sidebaritem-new').find('ul.mz-facetingform-facet').slideDown();
            if($(this).find('span').hasClass("mz-open-facet"))
            {
                $(this).closest('.mz-l-sidebaritem-new').find('ul.mz-facetingform-facet-mobile').slideUp();
                $(this).find('span').removeClass('mz-open-facet').addClass('mz-close-facet');
            }
            else
            {
                $('.mz-l-sidebaritem-new ul.mz-facetingform-facet-mobile').slideUp();
                $('.mz-l-sidebaritem-new h4 span').removeClass('mz-open-facet').addClass('mz-close-facet');
                $(this).find('span').removeClass('mz-close-facet').addClass('mz-open-facet'); 
                $(this).closest('.mz-l-sidebaritem-new').find('ul.mz-facetingform-facet-mobile').slideDown();
            }
        });
        
        /* page sort popup hide*/
        $(document).on("click",'.jb-mobile-sort-icon',function(e){
            $('[data-mz-mobile-page-sort]').fadeOut();
            $('body').css('overflow','scroll');
        });
        
        $(document).on("click", '.tzPopup-exit',function(e){
            $("[mz-mobile-facets]").fadeOut();
            $('body').css('overflow','scroll');  
        });
       
        $(document).on("click", '.update-sortBy',function(e){
           $(this).parent().children().each(function(){
                if($(this).hasClass("selected")){
                    $(this).removeClass("selected");
                }
            });
            $(this).addClass('selected');
            $(this).parent().css("opacity","0.5");
        });
        
        $(document).on("click",'.mz-facetingform-clearall',function(e){
            $(".mz-facetform-selected").removeClass("mz-facetform-selected");
        });  
        
       // Technology icon alignment calculation
        function alignTechIcon(elem, contectElem){
            var iconPosition = $(contectElem).position().left - elem.position().left,
                contentWidth = $(contectElem).children("p").width(),
                safePx = 25;
            if($(contectElem).children("p").length > 0) {
                //align left
                if(iconPosition < elem.width()/2) {
                    if(elem.width() - iconPosition < contentWidth)
                    {
                        $(contectElem).children("p").css({'left': "-"+Math.floor(contentWidth - (elem.width() - iconPosition) + safePx)+"px" });
                    }
                    else {
                        $(contectElem).children("p").css({'left': "0" });
                    }
                }
                //align right
                else {
                    if( contentWidth < iconPosition ) {
                        $(contectElem).children("p").css({'right': "0", "left": "auto" });
                    }
                    else {
                        $(contectElem).children("p").css({'right': "-"+Math.floor(contentWidth - iconPosition + safePx)+"px", "left": "auto" });                        
                    }
                }
            }
            else {

            }
        }
       
        $('.feature-images').children("span").hover(function (e) {
            if(!$(this).hasClass('aligned'))
                alignTechIcon($(this).parents('.feature-images'), $(this));
            $(this).addClass('aligned');
            $(this).children("p").fadeIn(200);
            $(this).addClass('on');
            if($(this).children("p").length === 0) {
                $(this).removeClass('on');
            }
        }, function () {
            $(this).children("p").fadeOut(200);
        });
        
        function $_GET(param) {
        var vars = {};
        window.location.href.replace( location.hash, '' ).replace( 
            /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
            function( m, key, value ) { // callback
                vars[key] = value !== undefined ? value : '';
            }
        );
    
        if ( param ) {
            return vars[param] ? vars[param] : null;    
        }
        return vars;
        }
        
        var name = $_GET('facetValueFilter');
        if(name !== null ){
            var temparray=name.split("&");
            for(var i=0; i<temparray.length;i++){ 
                var splitarray=temparray[i].split(":");
                if(splitarray[0]=="tenant~resource-classification"){
                    $("[data-mz-type]").removeClass("active"); 
                    $("[data-mz-type='"+splitarray[1].replace(/[^a-zA-Z ]/g, "")+"']").addClass("active");
                }
            }    
        }  
    });
});




