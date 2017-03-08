require(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu', 'hyprlive', 'modules/api', 'modules/models-product', 'modules/cart-monitor', 'modules/modal','shim!vendor/owl.carousel[jquery=jQuery]','pages/product-listing'],
function ($, _, Backbone, Hypr, Api, ProductModels, CartMonitor, ModalWindow,ProductListViews) {
 
    var cartviewinfo = Backbone.MozuView.extend({
         templateName: "modules/cartbyos",
     
    }); 
       
    var QOModel  = Backbone.MozuModel.extend({}); 
 
     $(document).ready(function () {

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
      
     
     $(document).on("click",".mz-productdetail-addtowiishlist",function(e){ 
     var activelinkuserconfig=$(".showdiv").data("mz-row");
       var activedotuserconfig=$(".showdiv").find(".owl-dots div.active").index();  
            var obj= e.currentTarget;
            var customProObjuserconfig = {};
            var optValueuserconfig={};
            var subobjuserconfig=window.accountmodel.toJSON().productCode;
            $.each(window.accountmodel.getConfiguredOptions(), function (i, v) {
                        customProObjuserconfig[v.attributeFQN] = v.value;
                    });
            Api.get('product', subobjuserconfig).then(function(sdkProduct) {
                             var PRODUCT = new ProductModels.Product(sdkProduct.data);  
                                        if (!require.mozuData("pagecontext").user.isAnonymous) {
                                            $.each(customProObjuserconfig, function (i, v) {
                                                option = PRODUCT.get('options').get(i);
                                                option.set('value', v);
                                            });
                                                PRODUCT.addToWishlist();
                                                PRODUCT.on("addedtowishlist", function(attr) {  
                                                $(obj).text("Added to wishlist"); 
                                               
                                            });  
                                            
                                          
                                            
                                            
                                        } 
                             });
     });
     
     $(document).on("click","[data-mz-action='guestCustomWishlist']",function(e){ 
                    var obj= e.currentTarget;
                    $('[data-mz-role="modal-close"]').trigger('click');
                    $("#tz-cart-dialog").remove();
                    $(".cart-overlay").remove(); 

                    $('[data-mz-loginpopup]').trigger('click');

                    //randomstring for verification
                    var randomString = Math.random().toString(36).substr(2, 8),
                        customProObj = {};

                    $.each(window.accountmodel.getConfiguredOptions(), function (i, v) {
                        customProObj[v.attributeFQN] = v.value;
                    });

                    if (history.pushState && "" !== $.param(customProObj)) {
                        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                            newDate = new Date();

                        newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                        window.history.pushState({ 
                            path: newurl 
                        }, '', newurl);
                        document.cookie = "guestWishListconfig=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                        document.cookie="guestchecklist="+window.accountmodel.toJSON().productCode; 
                        document.cookie = "guestWishListinfo=" + window.accountmodel.toJSON().productCode + ";expires=" + newDate.toUTCString() + ";/";
                        var activelink=$(".showdiv").data("mz-row");
                        document.cookie = "activelink=" + activelink + ";expires=" + newDate.toUTCString() + ";/";
                        var activedot=$(".showdiv").find(".owl-dots div.active").index();  
                        document.cookie = "activedot=" + activedot + ";expires=" + newDate.toUTCString() + ";/";
                    }
                      var objj = window.accountmodel.getConfiguredOptions();
                      var newobj = []; 
                      _.each(objj, function (objoptions) {
                        var optv = window.accountmodel.get('options').get(objoptions.attributeFQN);
                        if (optv.attributes.attributeFQN != "tenant~color") {
                            if (optv.attributes.attributeFQN != "tenant~lead-wire")
                            {
                                optv.unset("value");
                            }
                        }   
                    });
     });
         $(document).find('[data-mz-action="guestCustomWishlist"]').on('click', function (e) {

                    //close the custom overlay
                    
         });
        
         Api.request("get","/api/commerce/carts/current/items").then(function(response){
             Api.get('cartsummary').then(function(summary) { 
                    total =  summary.data.total.toFixed(2);
                    response.total=total; 
                    var cartViewinfo= new cartviewinfo({
                        el: $('.cartcontainer'),
                        model: new QOModel(response)
                         
                     });   
            cartViewinfo.render();
         });
         });
         
         $(document).on("click", "a#guestwishlist", function (e) {   
         
           var obj = e.currentTarget;
            var pcode=$(this).data("mz-productcode"); 
                     var randomString = Math.random().toString(36).substr(2, 8);
                $('[data-mz-loginpopup]').trigger('click');
                if (history.pushState) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + pcode,
                        newDate = new Date();

                    newDate.setTime(newDate.getTime() + (10 * 60 * 1000));

                    window.history.pushState({
                        path: newurl
                    }, '', newurl); 
                    document.cookie = "guestWishList=" + pcode + ";expires=" + newDate.toUTCString() + ";/";
                    var activelink=$(obj).parents(".showdiv").data("mz-row");
                    document.cookie = "activelink=" + activelink + ";expires=" + newDate.toUTCString() + ";/";
                    var activedot=$(obj).parents(".showdiv").find(".owl-dots div.active").index();  
                    document.cookie = "activedot=" + activedot + ";expires=" + newDate.toUTCString() + ";/";
                }
         
         });
            
           $(document).on("click", "a#add-to-wishlist", function (e) { 
               var obj= e.currentTarget;
                        var pcode=$(this).data("mz-productcode");
                    //alert(pcode);  
                         Api.get('product', pcode).then(function(sdkProduct) {
                             var PRODUCT = new ProductModels.Product(sdkProduct.data);
                              PRODUCT.addToWishlist();
                                PRODUCT.on('addedtowishlist',function(a,b,c){
                                         $(obj).text('ADDED TO WHISLIST');
                                         
                                         
                                    });  
                        });  
                      
                    
                });
                $(document).on("click", "a#add-to-wishlistpopup", function (e) { 
                    var obj= e.currentTarget;
                    $(obj).parent().find(".customcart").trigger("click");
                });
                $("#add-to-wishlistpop").on('click', function (e) {
        
                    if(require.mozuData("user").isAnonymous){
                        //close the custom overlay
                        $('[data-mz-role="modal-close"]').trigger('click');
                        $("#tz-cart-dialog").remove();
                        $(".cart-overlay").remove();
    
                        $('[data-mz-loginpopup]').trigger('click');
    
                        //randomstring for verification
                        var randomString = Math.random().toString(36).substr(2, 8),
                            customProObj = {};
    
                        $.each(self.cartViewObj.getConfiguredOptions(), function (i, v) {
                            customProObj[v.attributeFQN] = v.value;
                        });
    
                            if (history.pushState && "" !== $.param(customProObj)) {
                                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + randomString,
                                    newDate = new Date();
        
                                newDate.setTime(newDate.getTime() + (10 * 60 * 1000));
        
                                window.history.pushState({
                                    path: newurl
                                }, '', newurl);
                                document.cookie = "guestWishList=" + randomString + "|" + $.param(customProObj) + ";expires=" + newDate.toUTCString() + ";/";
                        }     
                    }
                    
                   
                    
                });


        
        $(document).on('click',".accordion .accordion-header h3", function(e){

            if($(this).hasClass("active"))
            {
                $(this).closest('.accordion').find('span.mz-acc-open').hide();
                $(this).closest('.accordion').find('span.mz-acc-icon').show();
                $(this).closest('.accordion').find('.accordion-content').slideUp();
                $(this).removeClass('active');
            }
            else
            {
                $(this).parents(".mz-content-widget-inner-wrap").find('span.mz-acc-open').hide();
                $(this).parents(".mz-content-widget-inner-wrap").find('span.mz-acc-icon').show();
                $(this).parents(".mz-content-widget-inner-wrap").find('h3').removeClass('active');
                $(this).parents(".mz-content-widget-inner-wrap").find('.accordion-content').slideUp();
                $(this).closest('.accordion').find('span.mz-acc-open').show(); 
                $(this).closest('.accordion').find('span.mz-acc-icon').hide();   
                $(this).addClass('active');
                $(this).closest('.accordion').find('.accordion-content').slideDown();
            }
        });

        $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li').first().addClass('active');
        $('.prev-btn').hide();
        $('.left-nav span.mz-acc-icon').hide();

        _initbtn = $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li').first();
        
        changebtnname(_initbtn);  

        if( ($( window ).width()) < 767 ){
            $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li').removeClass('active');
            $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li input').prop("checked", false);
            $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li input').first().prop("checked", true);
            $('.nav-buttons, .right-content, .right-image').hide();
        }

        function changebtnname(element)
        {
            nxt = element.next();
            prv = element.prev();
            if(nxt.length === 0)
            {
                $('.next-btn').hide();
            }
            else
            {
                var nextbtntext= nxt.text().split('.');
                var nextbtnattr= nxt.attr('id');
                var x = (nextbtntext.length > 0) ? nextbtntext[1].trim() : nxt.text();
               
                if( ($( window ).width()) < 767 ){
                    if(x.length > 20 && $('.next-btn').width() < 130)
                    {
                        $('.next-btn').css({'padding':'5px 20px 5px 25px'}); 
                    }
                    else
                    {
                        if(x.length > 24 && $('.next-btn').width() < 150)
                            $('.next-btn').css({'padding':'5px 20px 5px 15px'});
                        else
                            $('.next-btn').css({'padding':'15px 25px'}); 
                    }
                }
                $('.next-btn').text(x);
                $('.next-btn').attr('data-mz-next',nextbtnattr);
            }
            if(prv.length === 0)
            {
                $('.prev-btn').hide();
            }
            else
            {
                var prevbtntext= prv.text().split('.');
                var prevbtnattr= prv.attr('id');
                var y = (prevbtntext.length > 0) ? prevbtntext[1].trim() : prv.text();
                

                if( ($( window ).width()) < 767 ){
                    
                    if(y.length > 20 && $('.prev-btn').width() < 130)
                    {
                        $('.prev-btn').css({'padding':'5px 25px 5px 20px'}); 
                    }
                    else
                    {
                        if(y.length > 24 && $('.prev-btn').width() < 150)
                            $('.prev-btn').css({'padding':'5px 15px 5px 20px'}); 
                        else
                            $('.prev-btn').css({'padding':'15px 25px'});
                    }
                }
                $('.prev-btn').text(y);
                $('.prev-btn').attr('data-mz-next',prevbtnattr);
            }
        }
        function display(idname)
        {
            _this=$('.mz-byos .left-nav #mz-drop-zone-byos-left ol li#'+idname);

            if( ($( window ).width()) < 767 ){
                if(_this.hasClass('active'))
                {
                    _this.removeClass('active');
                    $('#for-mobile').show();
                    _this.siblings('li').show();
                    $('.left-nav .mz-acc-icon').hide();
                    $('.nav-buttons, .right-content, .right-image').hide();
                    _this.siblings('li').find('input').prop("checked", false);
                    _this.find('span').find('input').prop("checked", true);
                    return false;
                }
                else
                {
                    _this.siblings('li').hide();
                    _this.show();
                    $('#for-mobile').hide();
                    $('.left-nav .mz-acc-icon').show();
                    $('.nav-buttons, .right-content, .right-image').show();
                    $('.left-nav span.mz-acc-icon').show();
                }
            }

            $('.mz-byos .left-nav #mz-drop-zone-byos-left ol li').removeClass('active');
            _this.addClass('active'); 
            $(document).find("[data-mz-row]").removeClass('showdiv');
            $(document).find("[data-mz-row='"+idname+"']").addClass('showdiv');
            $('.next-btn, .prev-btn').show();
            

            if($(document).find("[data-mz-row='"+idname+"']").find(".byosproduct").children().length > 1){
                
                $(document).find("[data-mz-row='"+idname+"']").find(".byosproduct").addClass('owl-carousel').owlCarousel({ 
                    autowidth:true,
                    items:1, 
                    singleItem:true,
                    navigation:true       
                }); 
                
                $(document).find("[data-mz-row='"+idname+"']").find(".byosproduct").on('changed.owl.carousel', function(event) {
                    var currentItem = event.item.index;
                    var Items = event.item.count;
                    var _this = $(this);
                    if(currentItem === 0)
                    {
                        _this.find('.owl-controls .owl-nav .owl-prev').css({'border-color':'#d3d2d2'});
                    }
                    else
                    {
                        _this.find('.owl-controls .owl-nav .owl-prev').css({'border-color':'#656262'});
                    }
                    if(currentItem === Items-1)
                    {
                        _this.find('.owl-controls .owl-nav .owl-next').css({'border-color':'#d3d2d2'});
                    }
                    else
                    {
                        _this.find('.owl-controls .owl-nav .owl-next').css({'border-color':'#656262'});
                    }
                });
            }

            if(idname!="row1" && idname!="row9" && idname!="row10"){  
                $(document).find("[data-mz-row='"+idname+"']").find(".Categorytitle").text(_this.data('mz-title')+"- Top Picks");    
                $(document).find("[data-mz-row='"+idname+"']").find("#shopall").text("Shop all "+ _this.data('mz-title'));    
                $(document).find("[data-mz-row='"+idname+"']").find("#shopall").attr("href","/c/"+_this.data('mz-code'));
            }else if(idname=="row10"){
                  
            Api.request("get","/api/commerce/carts/current/items").then(function(response){
                     Api.get('cartsummary').then(function(summary) { 
                        total =  summary.data.total.toFixed(2);
                        response.total=total; 
                        var cartViewinfo= new cartviewinfo({
                            el: $('.cartcontainer'),
                            model: new QOModel(response)
                             
                        });   
                    cartViewinfo.render();
                });
            });
         
            } 
            if(idname=="row9" || idname=="row10")
            {
                $('.right-content').hide();
            }
            else
            {
                $('.right-content').show();
            }

            changebtnname(_this);

               
        }
         
        $(document).on('click',".mz-byos .left-nav #mz-drop-zone-byos-left ol li", function(e){
            var idname=$(this).attr('id');
            display(idname);
            $('html, body').animate({scrollTop: 0},600);     
        });


        $(document).on('click',".next-btn, .prev-btn", function(e){
            e.preventDefault();
            var idname=$(this).attr('data-mz-next');
            display(idname);      
            $('html, body').animate({scrollTop: 0},600);
        });
        $(document).on('click',"#gs-btn", function(e){
            e.preventDefault();
            $('.byos').show();
            $('.byos-get-started').hide();
            $('html, body').animate({scrollTop: 0},600);
        });
        
        $("[mzd-quick-add-to-cart]").click(function(event){ 
            var me=event.target;
            $(this).addClass("is-processing"); 
            event.stopPropagation();
           var productCode=$(this).attr("mzd-quick-add-to-cart");
            Api.get('product', productCode).then(function(sdkProduct) {
                var PRODUCT = new ProductModels.Product(sdkProduct.data);
                PRODUCT.addToCart(1);
                PRODUCT.on('addedtocart', function(attr) {  
                    $(me).removeClass("is-processing");
                    CartMonitor.updateCart(); 
                });  
                PRODUCT.on('error', function (badPromise, xhr, requestConf) {
                     
                     
                        
                      alert("out of stock");  
                         
                    
                }); 
            });
            
        }); 
        
        $(document).on('click', '.mz-backorder-popup button', function (e) {  
            if($(e.currentTarget).attr("mzd-quick-add-to-cart")){
                $(".byosproduct").find("[mzd-quick-add-to-cart='"+$(e.currentTarget).attr("mzd-quick-add-to-cart")+"']").trigger("click");          
            }
            $(".byos-backorder").fadeOut(500); 
            $(".byos-backorder").html('');
            
        });
        
        $(document).on('click', '[backorderbutton]', function(e){  
            $(".byos-backorder").html($(e.currentTarget).parents(".mz-button-listing").prev().html());
            $(".byos-backorder").fadeIn(500);
        });  
        
            
         if ("undefined" != typeof $.cookie("guestWishList")) {


                    $('.byos-get-started').hide();
                    $('.byos').show();

                    var cookieData = $.cookie("guestWishList").split('|'),
                        optValue = {},
                        option,
                        activelink=$.cookie("activelink").split('|'),
                        activedot=$.cookie("activedot").split('|'),
                        thisModel = this.model;
                        
                    if (cookieData[0] == location.search.replace('?', '')) { 
                        //alert(cookieData[0]);
                    }
                  display(activelink);  
                
                  $(document).find("[data-mz-row='"+activelink+"']").find(".byosproduct").find(".owl-dot:eq('"+activedot+"')").trigger("click");
                  $(document).find("[data-mz-row='"+activelink+"']").find("[data-mz-productcode='"+cookieData[0]+"']").trigger("click");   
                  $.removeCookie("guestWishList");
                  $.removeCookie("activelink");
                  $.removeCookie("activedot");  
                  
             
                }else if ("undefined" != typeof $.cookie("guestWishListconfig")) {
                    var optValueconfig = {};
                    var activelinkconfig=$.cookie("activelink").split('|'),
                         activedotconfig=$.cookie("activedot").split('|'), 
                         obj=$.cookie("guestWishListconfig").split('|');
                        var subobj=$.cookie("guestchecklist");
                          Api.get('product', subobj).then(function(sdkProduct) {
                             var PRODUCT = new ProductModels.Product(sdkProduct.data); 
                                if (obj[0] == location.search.replace('?', '')) {
                                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '';
            
                                    if (obj.length == 2) {
                                        obj[1].split("&").map(function (value) {
                                            optValueconfig[value.split("=")[0]] = value.split("=")[1];
                                        });
            
                                        if (!require.mozuData("pagecontext").user.isAnonymous) {
            
                                            $.each(optValueconfig, function (i, v) {
                                                option = PRODUCT.get('options').get(i);
                                                option.set('value', v);
                                            });
            
                                                PRODUCT.addToWishlist();
                                                PRODUCT.on("addedtowishlist", function(attr) {  
                                                $('.byos-get-started').hide();
                                                $('.byos').show();
                                                display(activelinkconfig);  
                                                
                                                $(document).find("[data-mz-row='"+activelinkconfig+"']").find(".byosproduct").find(".owl-dot:eq('"+activedotconfig+"')").trigger("click");
                                                $(document).find("[data-mz-row='"+activelinkconfig+"']").find("[data-mz-productcode='"+subobj+"']").text("Added to wishlist"); 
                                                
                                                  document.cookie = "guestWishListconfig=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            document.cookie = "guestchecklist=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            document.cookie = "guestWishListinfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            document.cookie = "activelink=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            document.cookie = "activedot=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            
                                            
                                            window.history.pushState({
                                                path: newurl
                                            }, '', newurl);
                                            });  
                                            
                                          
                                            
                                            
                                        }
            
                                    } else { 
                                        if (!require.mozuData("pagecontext").user.isAnonymous) {
                                            PRODUCT.addToWishlist();
                                            document.cookie = "guestWishListconfig=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                                            window.history.pushState({
                                                path: newurl
                                            }, '', newurl);
                                        }
                                    }
                                }
                             
                          }); 
                        
                }
     });
}); 





