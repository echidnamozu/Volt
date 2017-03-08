define(['modules/jquery-mozu', 'hyprlive', 'modules/modal', 'modules/api', 'modules/models-cart', 'modules/models-product',
"shim!vendor/jquery.swinxy[jquery=jQuery]", "shim!vendor/jquery.jscrollpane[jquery=jQuery]",
"shim!vendor/jquery.hoverIntent.minified[jquery=jQuery]","vendor/jquery-cookie","shim!vendor/owl.carousel[jquery=jQuery]" ],

function($, Hypr, ModalWindow, Api, CartModels, ProductModels) {   
    
   var userinfo=require.mozuData("user");
    var confidentialLink=Hypr.getThemeSetting("confidentialCateogry");
   
       
    var vmodalTemplate = Hypr.getTemplate('modules/common/video-pop-up'),
        videoPopup, 
        getRenderProductContext=function (substituteModel) {
            var model = (substituteModel || this.model).toJSON({ helpers: true });
            return {
                Model: model,
                model: model
            }; 
        },      
        vmodal,videoModel = Backbone.MozuModel.extend({});
        videoPopup = function(link) {
            var self = this,vmodel = new videoModel(), resjson ={};
           
            if((link.match('^http://')) || (link.match('^https://'))) {
                resjson.video = link; 
            } else {
                resjson.video = "//"+link; 
            }
            vmodel.set(resjson);
            this.model = vmodel;
            self.render(vmodalTemplate.render(getRenderProductContext(vmodel)));                            
        };
        $.extend(videoPopup.prototype = new ModalWindow(), {
            constructor: videoPopup,
            render: function(html) {
            var $modal = $(html);
                    this.loadWrapper($modal.appendTo('body'));
                    this.bindClose();
                    this.open(); 
            },
        }); 
        //-------------------------Page Loader --------------------------------------
        $(window).on('load',function () {
            $('#box-overlay').hide();
            $('#box-loading').hide(); 
        });  
        $(document).ready(function(){
          var pgetype=require.mozuData('pagecontext').pageType;
          var obj= require.mozuData("user");
          var pcodee=require.mozuData('pagecontext').productCode;
          var ptype="";
          var flagval=false;
            if(require.mozuData('pagecontext').metaTitle=="Product Index"){
                
                $(".norecord").parent().hide().addClass("hiddenindex");
                $(".norecord").parent().prev().hide().addClass("hiddenindex"); 
            }

            if(require.mozuData('pagecontext').metaTitle == "Product Documents"){

                
                $(".lifetime-warranty-details").each(function(){
                    
                    $(this).find(".cathead").each(function(){  
                        if($(this).find(".emptydiv").length > 0){
                            $(this).hide();
                            $(this).parent().hide();
                        }
                    });
                    $(this).find(".maincat").each(function(){
                        if($(this).find(".emptydiv").length > 0){
                            $(this).hide();
                            $(this).parent().prev().hide();
                        }
                    });
                    $(this).find("[empty]").each(function(){
                        $(this).hide();
                        if($(this).parent().find(".products-accordion-content").length === 1){
                            $(this).parent().parent().hide();
                            if($(this).parent().hasClass("maincat")){
                                $(this).parents(".maincat").parent().hide();
                                $(this).parents(".maincat").parent().prev().hide();   
                            }
                        }else{
                            if($(this).parent().find(".data").length === 0){
                                $(this).parent().parent().hide();
                                if($(this).parent().hasClass("maincat")){
                                    $(this).parents(".maincat").parent().hide();
                                    $(this).parents(".maincat").parent().prev().hide();   
                                }  
                            }                         
                        }
                        
                    });
                    
                });
            }    

            $('.parent_category2').each(function(){
                   
                var catid=$(this).attr("Catid");
                if($("[parentid='"+catid+"']").not(".hiddenindex").length === 0){
                    $(this).hide().addClass("hiddenindex");
                }
            });  
            $(".index-accordion").each(function(){
                if($(this).find("[parentid]").not(".hiddenindex").length === 0){  
                    $(this).hide().addClass("hiddenindex");
                    if($(this).prev().hasClass("parent_category")){
                        $(this).prev().hide().addClass("hiddenindex");
                    }
                }
            });
            
          var objuser= require.mozuData("user");
            if((objuser.isAnonymous === true) && (objuser.isAuthenticated === false)){
                $(".loggedin").css("display","none");
            }else{
                $(".loggedout").css("display","none");
            }
            if(!require.mozuData("pagecontext").isSecure){
	    var url = require.mozuData("pagecontext").secureHost+"/signinform";
                $(".loggedout").find("a").attr("href", url);
            }else{
                if((require.mozuData("pagecontext").title === "SignInForm")||(require.mozuData("pagecontext").title === "SignUpForm")){
                    $(".loggedout").find("a").removeAttr("data-mz-loginpopup");
                }
            }
            if((require.mozuData("pagecontext").title === "SignInForm")||(require.mozuData("pagecontext").title === "SignUpForm")){
                if(!require.mozuData("pagecontext").isSecure){
                    window.location = require.mozuData("pagecontext").secureHost; 
                }
            }
            var urlcheck1 = !window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase();
  
   
            if($('#mz-drop-zone-becomeampro').is(':empty')&&($('#mz-drop-zone-becomeampro').is(':empty'))){
                $('.bg-amppro').hide();
            }
            
            $(document).on('click','.view-account',function(e){
                $(".mz-navmobile #mz-orderhistory").trigger("click");  
            });  
            
            $(document).on('click', '.mz-product-next', function(e) {
                var optionSelected = false, obj = $(this).closest('.mz-productoptions-optioncontainer').find(".Optioncontainer");
                
                optionSelected = checkOptionSelected(obj);
                
                if (optionSelected === true) {
                    $(this).closest(".Optioncontainer").addClass('closeContainer');
                    $(this).closest('.mz-productoptions-optioncontainer').addClass("closestate");
                    if($(this).closest('.mz-productoptions-optioncontainer').next().attr("autoselectinfo")===undefined){ 
                        $(this).closest('.mz-productoptions-optioncontainer').next().find(".Optioncontainer").removeClass("closeContainer");
                        $(this).closest('.mz-productoptions-optioncontainer').next().removeClass("closestate");
                        $(this).closest('.mz-productoptions-optioncontainer').next().find('.option-container-heading').find("a").addClass("expand-collapse-btn");
                        var value=e.currentTarget;
                        $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").removeClass("selectopt");
                        $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find(".option_field").css("border-left", "1px solid #dedede");
                        if($(value).text().trim()=="Finish"){
                            $(this).parents('#tz-cart-dialog').find('#add-to-wishlist').removeAttr('disabled');
                            $(this).parents('#tz-cart-dialog').find('#add-to-cart').removeAttr('disabled'); 
                        }     
                    }else{
                         $(this).closest('.mz-productoptions-optioncontainer').next().find(".mz-productoptions-option").click();
                          $(this).closest('.mz-productoptions-optioncontainer').next().find(".mz-product-next").removeAttr("disabled").trigger("click");
                    }
                    
                }
                if($(this).parents(".options-content").length > 0){
                    var pid = $(this).parents(".mz-qo-product-details").find(".mz-qo-product-loader").attr("loader");
                    if(pid !== undefined){
                        $(window).scrollTop($("[loader='"+pid+"']").parent().offset().top);
                    }  
                }

            }); 
            
            $(document).on('click','.search-anchor', function(event) {
                event.preventDefault();
                var target = "#" + this.getAttribute('data-target');
                $('html, body').animate({
                    scrollTop: $(target).offset().top-300
                }, 2000);
            }); 
                
            $('[data-mz-loginpopup]').on("click", function(){
                $('body').css({'height':$(window).height() , 'overflowY': "hidden", 'position': 'relative', '-ms-overflow-y': "hidden"});
                var currentPos = $(window).scrollTop();
            });
            
            $('[data-mz-signup]').on("click", function(){
                $('body').css({'height':$(window).height() , 'overflowY': "hidden", 'position': 'relative','-ms-overflow-y': "hidden"});
                var currentPos = $(window).scrollTop();
            });
            
            $('[data-mz-role="modal-close"]').on('click', function() {
                $('body').css({'height':'auto', 'position': 'static', 'overflowY': "auto", '-ms-overflow-y':"auto"}); 
            });
            
            $(document).on('click','.mz-productoptions-option',function(e){
                var data = e.currentTarget;
                $(data).parents(".mz-productoptions-optioncontainer").find('.mz-product-next').removeAttr("disabled");
            });
                
            function checkOptionSelected(obj) {
                var selected = false;
                $(obj).find(".options").each(function() {
                    if ($(this).find(".mz-productoptions-option").is(':checked')) {
                        selected = true;
                    }
                }); 
                return selected;
            }
            
            $(document).on('click', '.option-container-heading', function(e) { 
                
                if($(this).find("a").hasClass("expand-collapse-btn")){
                    
                    if ($(this).closest('.mz-productoptions-optioncontainer').find(".Optioncontainer").hasClass('closeContainer')) {
                        $(this).closest('.mz-productoptions-optioncontainer').find(".Optioncontainer").removeClass("closeContainer");
                        $(this).closest('.mz-productoptions-optioncontainer').removeClass("closestate");
                        if($(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").text() !== ""){
                            $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").addClass("selectopt");    
                            $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find(".option_field").css("border-left", "none");
                        }
                    } else {
                        $(this).closest('.mz-productoptions-optioncontainer').find(".Optioncontainer").addClass("closeContainer");
                        $(this).closest('.mz-productoptions-optioncontainer').addClass("closestate");
                        if($(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").text() !== ""){
                            $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find("#selectmain").removeClass("selectopt"); 
                            $(this).closest('.mz-productoptions-optioncontainer').find(".option-container-heading").find(".option_field").css("border-left", "1px solid #dedede");
                        }    
                    }
                    if($(this).parent().next("div").hasClass("mz-productoptions-optioncontainer")){
                        $(this).parent().nextAll("div").find(".Optioncontainer").addClass("closeContainer");
                        $(this).parent().nextAll("div").addClass("closestate");
                        $(this).parent().prevAll("div").find(".Optioncontainer").addClass("closeContainer");
                        $(this).parent().prevAll("div").addClass("closestate");
                        
                    }
                    if($(this).parent().prev("div").hasClass("mz-productoptions-optioncontainer")){
                        $(this).parent().prevAll("div").find(".Optioncontainer").addClass("closeContainer");
                        $(this).parent().prevAll("div").addClass("closestate");
                        $(this).parent().prevAll("div").find(".Optioncontainer").addClass("closeContainer");
                        $(this).parent().prevAll("div").addClass("closestate");
                        
                    }
                }    
             });
            
            if(($( window ).width() > 1024)&&(!require.mozuData('pagecontext').isTablet))
            {   /*
                alert($(".mz-sitenav-sub:hidden").length);
                $(this).find('.mz-sitenav-sub:hidden').css({
                    "max-height": "5000px", 
                    "padding": "20px 0",  
                    "border-width": "2px 0 10px 0",
                    "display":"none"
                });
                alert($(".mz-sitenav-sub:hidden").length);
                 
        
                $(".mz-sitenav-item-inner").hover(function(e) { 
                        $(this).find('.mz-sitenav-sub').stop(true, false).delay(300).fadeIn(300);
                        $(this).find('.mz-sitenav-sub').css({"z-index": "9"});
                    },function() { 
                        $(this).find('.mz-sitenav-sub').stop(true, false).delay(600).fadeOut(0);
                        $(this).find('.mz-sitenav-sub').css({"z-index": "0"});
                });
                */
            }
            
            else if (($( window ).width() > 767 && $( window ).width() <= 1024) ||(require.mozuData('pagecontext').isTablet)) {
                $(".mz-sitenav-link").on("click",function(e) {
                    var obj=e.target;
                    if($(obj).hasClass("activelink")){
                            $(obj).removeClass("activelink"); 
                            if ($('.mz-sitenav-link').hasClass('activelink')) {
                            // $('.mz-sitenav-sub').slideUp();
                            $('.mz-sitenav-link').removeClass('activelink');
                            $('.mz-droparrow').removeClass('active'); 
                        }  
                    }else{
                      // e.stopPropagation();     
                    e.preventDefault(); 
                        // $(this).siblings('.mz-sitenav-sub').fadeToggle(300);
                        $(e.target).parents('.mz-sitenav-item').siblings().find('.mz-sitenav-link').each(function()  {
                            // $(this).siblings('.mz-subnav.mz-sitenav-sub').fadeOut(300);
                            $(e.target).parents('.mz-sitenav-item').siblings().find('.mz-sitenav-link').removeClass("activelink"); 
                        });
                        $(obj).addClass("activelink");   
                    }
                    
                });
                /*$('html').click(function (e) {
                    /if (e.target.parentElement && e.target.parentElement.className.trim() == "mz-sitenav-item-inner" ) {
                    } else {
                        if ($('.mz-sitenav-link').hasClass('activelink')) { 
                            // $('.mz-sitenav-sub').slideUp();
                            $('.mz-sitenav-link').removeClass('activelink');
                            $('.mz-droparrow').removeClass('active'); 
                        } 
                    }
                });*/
                 
            }
        
           //-------------------------MOBILE MENU --------------------------------------
        if( ($( window ).width()) < 767 ){
        
            $(document).on("click","#page-wrapper", function(event) {
                //event.preventDefault();   
                if($(this).hasClass("rightside")){
                    $('.mz-mobile-nav').toggleClass('leftside');
                    $('.mz-l-pagewrapper').toggleClass('rightside'); 
                    $('body').toggleClass('body-left'); 
                    $('html').toggleClass('body-left');
                    $(".mz-sitenav-sub").removeClass("mz-subactive");
                    $('.mz-parentdeactive').removeClass("mz-parentdeactive");
                    return false; 
                }
            });



            /*Challenges mobile accordion*/
        
            $(".mz-voltchallenge_contentinner h5").click(function () {
                if($(this).hasClass("open-state")){
                    $(this).removeClass("open-state");
                    $(this).parent().find("ul").slideUp();
                }else{
                    $(".mz-voltchallenge_contentinner ul").slideUp(); 
                    $(".mz-voltchallenge_contentinner  h5").removeClass("open-state");
                    $(this).addClass("open-state");
                    $(this).parent().find("ul").slideDown();
                }
            });
            $("#mz-drop-zone-factory_Content .factory-text h2").click(function () {
                
                if($(this).closest('.factory-text').find('p').hasClass("mz-class"))
                {
                    $(this).closest('.factory-text').find('p').toggleClass('mz-class');
                    $(this).closest('.factory-text').find('p').slideUp();
                }
                else
                {
                    $('#mz-drop-zone-factory_Content .factory-text p').removeClass('mz-class');
                    $('#mz-drop-zone-factory_Content .factory-text p').slideUp();
                    $(this).closest('.factory-text').find('p').toggleClass('mz-class');   
                    $(this).closest('.factory-text').find('p').slideDown();
                }
            });
           
        var clickMenuToggle =1;
        $('.icon-menu,.mobile-nav-arrow').on('click', function(e) {     
            e.preventDefault();
            $(this).toggleClass('forMobile');
            $('.megaMenuMain').toggleClass('forMobile');
           if(clickMenuToggle % 2 === 1) {
               $('body').css({'height': $( window ).height(), 'overflow':'hidden'});
           }
           else {
               $('body').css({'height': 'auto', 'overflow':'auto'});
           }
           clickMenuToggle++;
            return false;
        });
              
        $('.mz-sitenav-sub-list').on('click', function(e) { 
            $(this).children('.mz-sitenav-sub-title').removeAttr("href");
            
             if(parseInt($(this).children('ul').css('max-height')) > 0) {
                $(this).find('ul').css({'max-height': 0});
                $(this).find('.mz-sitenav-sub-title').css({'background': "url('../../resources/images/icons/mega-menu-mobile-list-inner-plus.png') no-repeat right center"});
             }
             else if(parseInt($(this).children('ul').css('max-height')) === 0) {
                $(this).find('ul').css({'max-height': 5000});
                $(this).siblings().find('ul').animate({'max-height': 0});
                $(this).find('.mz-sitenav-sub-title').css({'background': "url('../../resources/images/icons/mega-menu-mobile-list-inner-link.png') no-repeat right center"});
                $(this).siblings().find('.mz-sitenav-sub-title').css({'background': "url('../../resources/images/icons/mega-menu-mobile-list-inner-plus.png') no-repeat right center"});
                
             }
            
            
        });
         
        $('.mz-sitenav-link').click(function(){
            if($(this).parents().hasClass("forMobile"))
            {
                $(this).parent().toggleClass('activeMenu');
                $(this).toggleClass('activeTitle');
                
                $(this).siblings('.mz-sitenav-sub').css({
                    'height': $( window ).height()-100,
                    'overflow-x': 'hidden'
                });
                if($(this).parent().hasClass("activeMenu"))
                {
                    $(this).siblings('.mz-sitenav-sub').show(0);
                    $(this).parents('.megaMenuMain.forMobile').css({
                        'background-color' : "#f3f3f3"
                    });
                }
                else {
                    $(this).siblings('.mz-sitenav-sub').hide(0);
                    $(this).parents('.megaMenuMain.forMobile').css({
                        'background-color' : "#292929"
                    });
                }
            }
        });    
    }

            
        //------------------------- MOBILE MENU --------------------------------------  
        //------------------------- MOBILE SEARCH --------------------------------------
        $('.icon-search').on('click', function(e) {         
            e.preventDefault();
            $('header.mz-mobile.mz-pageheader.mz-ampheade').css('z-index','inherit');
            $('.header-intro').css('z-index','inherit');
            $('.search-site').show("fast",function nextshow(){
                $('.mz-searchbox-input').focus();
            }); 
        });  
        
        $('.mz-searchclose').on('click', function(e) {          
            e.preventDefault();
            $('header.mz-mobile.mz-pageheader.mz-ampheade').css('z-index','9999999');
            $('.header-intro').css('z-index','999999');
            $('.search-site').hide();
            $('.mz-searchbox-input').val('');
        });
        
        var urlcheck= !window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase() ;
        if( ($( window ).width()) > 767 ){ 
            $(".accordionwidget").find('.acc-close').removeClass("acc-close").addClass("acc-open");
            $(".accordionwidget").find('.content').show();
        }
        else
        {
            $(".accordionwidget").find('.acc-open').removeClass("acc-open").addClass("acc-close");
            $(".accordionwidget").find('.content').hide();
        }
        $(".acc-close, .acc-open").click(function(){
           if( ($( window ).width()) < 767 ){ 
                if(!($(this).closest(".accordionwidget").children().hasClass("acc-open"))){
                    $('.acc-open').removeClass("acc-open").addClass("acc-close");
                    $(".accordionwidget").find('.content').slideUp();
                    $(this).closest(".accordionwidget").find('.acc-close').removeClass("acc-close").addClass("acc-open");
                    $(this).closest(".accordionwidget").find('.content').slideDown('slow',function(){
                        var post=$(this).offset(),top;
                        if(!window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase() === 'c') {
                            top=post.top-260;
                        }else{
                            top=post.top-210;    
                        }
                        $(window).scrollTop(top);     
                    }); 
                }else{
                    $('.acc-open').removeClass("acc-open").addClass("acc-close");
                    $(".accordionwidget").find('.content').slideUp();
                }
            }

        });
        
        
        $(".mlinks").click(function(){
            if(!($(this).closest(".columns").find(".mobileArrow").hasClass("arrow_open"))){
                $('.arrow_open').removeClass("arrow_open").addClass("arrow_close");
                $(".columns").find('.links').slideUp();
                $(".columns .mlinks").find('h3').css({'background': '#2e2e2e'});
                $(this).closest(".columns").find('.arrow_close').removeClass("arrow_close").addClass("arrow_open");
                $(this).closest(".columns").find('.links').slideDown();
                $(this).closest(".columns").find('h3').css({'background': '#262626'});
            }else{
                $('.arrow_open').removeClass("arrow_open").addClass("arrow_close");
                $(".columns").find('.links').slideUp();
                $(this).find('h3').css({'background': '#2e2e2e'});
            }
    });
    
    $("<style type='text/css' id='dynamic' />").appendTo("head");
    
    
    $('.mz-droparrow').on('mouseenter',function(e){
        e.preventDefault();
        var leftV = ($(this).offset().left + $(this).width()/2)- ($('.mz-sitenav-list').offset().left) ;
        $("#dynamic").text(".mz-subnav-content:after{left:" +leftV+ "px;}");
    });
    var makeShow=function(){
        $(this).find('.mz-droparrow').addClass('active');
        $(this).find('.mz-sitenav-sub').addClass('active');
        $(this).find('.mz-sitenav-sub').slideToggle(400);
    },
    makeHide=function(){
        $(this).find('.mz-droparrow').removeClass('active');
        $(this).find('.mz-sitenav-sub').removeClass('active');
        $(this).find('.mz-sitenav-sub').hide();
    };
    
    var userData=require.mozuData("user");
    
    if(userData.isAnonymous === false ){
        $(".contactus-anonymous").css("display","none");
        $(".phone-no").css("display","block");
    }else{
         $(".contactus-anonymous").css("display","block");
         $(".phone-no").css("display","none");
    }
    
    if( ($(window).width()) > 767 ){
        $('.mz-sitenav-item-inner:has(.mz-droparrow)').hoverIntent({
            over: makeShow,
            out:makeHide
        });          
    }
     
    $(window).resize(function(){
        if( ($( window ).width()) < 767 ){
            $('.mz-sitenav-item-inner:has(.mz-droparrow)').hoverIntent({
                over: makeHide,
                out:makeHide
            });
            $('.mz-bck').on('click', function(e) {
                e.preventDefault();
                $('.mz-sitenav-list').find('.mz-subnav').removeClass('mz-subactive');
                $('.mz-sitenav-list').find('.mz-sitenav-item').removeClass('mz-parentdeactive');
                $('.mz-bck').hide();
            });
            $('.mz-sitenav-item-inner > .mz-sitenav-link').on('click', function(e) {
                //e.preventDefault(); 
                if($(this).parents().hasClass('leftside')){
                    if( $(this).hasClass('mz-droparrow')){
                        $(this).next().addClass('mz-subactive');
                        $(this).parents('.mz-sitenav-list').children('li').addClass('mz-parentdeactive');
                        $('.mz-bck').show();    
                        $('.mz-head-menu').show();
                    }
                    else{
                        var navlink = $(this).attr('href'), httpfind = navlink.indexOf('http');
                        if(httpfind === 0){
                            window.open(navlink,'_blank');   
                        }else{
                            window.location = navlink;        
                        }
                    }
                }
            });
            $('.mz-sitenav-item .mz-sitenav-linktitle').on('click', function(e) {           
                        
                if($(this).parents().hasClass('mz-mobile-global-nav')){
                        if($(this).parent().hasClass('active')){
                            $('.active').siblings('li').slideToggle("fast");
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).removeClass('mz-minus');
                        }else{
                            $('.active').siblings('li').slideToggle("fast");
                            $('.active').find('span').removeClass('mz-minus');
                            $('.mz-sitenav-item').removeClass('active');
                            $(this).toggleClass('mz-minus');
                            $(this).parent().addClass('active');
                            $(this).parent().siblings('li').slideToggle("fast");    
                        } 
                } 
            });
            $(document).on("click","#page-wrapper", function(event) {
           
            if($(this).hasClass("rightside")){
                $('.mz-mobile-nav').toggleClass('leftside');
                $('.mz-l-pagewrapper').toggleClass('rightside'); 
                $('body').toggleClass('body-left'); 
                $('html').toggleClass('body-left');
                $(".mz-sitenav-sub").removeClass("mz-subactive");
                $('.mz-parentdeactive').removeClass("mz-parentdeactive");
                return false; 
                }
            });   
            
            //mega menu mobile
            if($('.megaMenuMain').hasClass('forMobile')) {
                $('.mz-sitenav-item-inner.activeMenu').find('.mz-subnav.mz-sitenav-sub').css({
                    'height': $( window ).height()-100,
                    'overflow-x': 'hidden'
                });
            }
            
        }else{
            $('.mz-sitenav-item-inner:has(.mz-droparrow)').hoverIntent({
                over: makeShow,
                out:makeHide
            });
        }
    });
     
    if($(".aspotcontianer").find(".featured-article").find("a").length > 1){
            
        $(".aspotcontianer").owlCarousel({  
                center:true,
                loop:true,
                margin:10,
                nav:true,
                dots: true,
                autoplay:true, 
                animateOut: 'fadeOut',
                items:1,
                responsive:{
              
                },
        }); 
    }
            
    $('.mz-tips .mz-cms-image-cover').on('click', function(e) {
        e.preventDefault();
        /* jshint ignore:start */
        if ($(this).attr('href') !== "" && $(this).attr('href')) {
            if ($(this).attr('data-thom')) {
                imodal = new imagePopup($(this).attr('href'));
            } else {
                vmodal = new videoPopup($(this).attr('href'));
            }
        }
        /* jshint ignore:end */
    });

    $('.mz-tips .mz-actionbtn').on('click', function(e) {
        e.preventDefault();
        if (!($('.mz-tips .mz-actionbtn div').hasClass('ui-droppable'))) {
            if ($(this).siblings('div.mz-video').find('.mz-cms-video-cover').length > 0) {
                var emblink = $(this).siblings('div.mz-video').find('.mz-cms-video-player').attr('src');
                vmodal = new videoPopup(emblink);
            } else {
                $(this).siblings('div.mz-video').find('.mz-cms-image-cover').trigger("click");
            }
        }
    });
    $('.videoicon').on('click', function(e) {       
        e.preventDefault();
        $('body').css({'overflowY': 'hidden', '-ms-overflow-y': "hidden"});
        if(navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
            var currentPos = $(window).scrollTop();
            window.onscroll=function(){
                    if($(window).width() < 1025) {
                        $(window).scrollTop(currentPos);
                    }
                };
        }
        vmodal = new videoPopup(($(this).parent().find('img').attr('data-video')? $(this).parent().find('img').attr('data-video') : $(this).siblings().attr('data-video') ));                 
    });
    $(document).on('click','.video-icon-play', function(e) {      
        e.preventDefault();

        vmodal = new videoPopup(($(this).parent().find('img').attr('data-video')? $(this).parent().find('img').attr('data-video') : $(this).siblings().attr('data-video') ));                 
    });
    $('.learn-video-icon').on('click', function(e) {       
         e.preventDefault();
        vmodal = new videoPopup(($(this).parent().find('img').attr('data-video')? $(this).parent().find('img').attr('data-video') : $(this).siblings().attr('data-video') ));                 
    });
    $(document).on('click', '.mz-filter-btn',function(e) {  
        e.preventDefault();
        $('.mz-filter-btn').toggleClass('mz-minus');
        $('.mz-l-sidebar').find('.facetapply').attr('disabled','disabled');
        $('.mz-l-sidebar').slideToggle("slow"); 
        $('.mz-l-sidebar').parent().toggleClass('borderchange'); 
    });

    var widt= $('.searchboxstle').width(), opa=$('.searchboxstle').css("opacity");
            
    hideShowGlobleHeader();
    });

    var Headerheight = $("#vt-header .bg-header").height(), HeaderMainopacity = $("#vt-header").css('opacity'), Headeropacity = $("#vt-header .bg-header").css('opacity');
    var HeaderIntroOpcity = $(".header-intro").css('opcaity'), navTop = $('.mz-temp-sitenav').css('top');
    
    $(window).scroll(function(){
        var urlcheck=!window.location.pathname.split("/")[2] ? "" : window.location.pathname.split("/")[2].toLowerCase();
        var urlcheck1=!window.location.pathname.split("/")[1] ? "" : window.location.pathname.split("/")[1].toLowerCase();
        hideShowGlobleHeader();
    });
    
    //globle floating header
    function hideShowGlobleHeader() {
        if ($(document).scrollTop() >= 101) {
            $('#mz-drop-zone-promotionalslot').delay(200).css({
                'max-height': "0"
            });
            $('.mz-l-pagecontent').css({
                'padding-top': "105px"
            });
            $('ul.megaMenuMain').delay(200).css({
                'top': '69px'
            });
            $('.mz-ampheade').addClass('removebghead');
            $('.mz-home-nav').addClass('removebghead');
            $('#vt-header-right').stop(true).fadeOut(100, function() {
                $('#vt-additional-header').stop(true).slideUp(100, function() { 
                    $('#vt-header-right').stop(true).slideUp("slow");
                });
            });
            $("#vt-header").stop().animate({
                'min-height': "54px",
                opacity: 1
            }, 1);
            $('.mz-temp-sitenav').stop().animate({}, 1);
        } else {

            $('#mz-drop-zone-promotionalslot').css({
                'max-height': "100px"
            });
            $('.mz-l-pagecontent').delay(500).css({
                'padding-top': "135px"
            });

            $('ul.megaMenuMain').css({
                'top': '98px'
            });

            $('.mz-temp-sitenav').stop().animate({
                top: navTop,
                opacity: 1,
            }, 1);
            $('#vt-additional-header').stop(true).fadeOut(200, function () {
                $('#vt-header-right').stop(true).fadeIn(300, function () {
                    $('#vt-additional-header').stop(true).slideUp();
                });
            });
            $('.header-intro').removeClass('removebghead');
            $('.mz-ampheade').removeClass('removebghead');
            $('.mz-home-nav').removeClass('removebghead');
        }
    }


    var lazyLoadImage = function(){
    /* Lazy load - it will replace img src with data-src attributes **/
        $(document).find(".mz-productlisting-image").each(function(index,el){
                    // Getting jquery window seector
                    var win = $(window);
                    // Storing top and left scroll position of window
                    var viewport = {
                        top : win.scrollTop(),     
                        left : win.scrollLeft()
                    };
                    // Getting the right and bottom position of the view port
                    viewport.right = ((viewport.left + win.width()) * 2);   
                    viewport.bottom = ((viewport.top + win.height()) * 2);
                    // Geting element boundary informations
                    var bounds = $(el).find("img").offset();
                    // calculating the bottom and right position of the element
                    bounds.right = bounds.left + $(el).find("img").outerWidth();
                    bounds.bottom = bounds.top + $(el).find("img").outerHeight();
                    // checking if any part of the element is not out side the view
                    // Check 1 : element left edge is above view port right edge
                    // Check 2 : element right edge is below view port left edge
                    // Check 3 : element top edge is above view port bottom
                    // Check 4 : element bottom edget is view port bottom
                    var isVisible = (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));

                    if(isVisible){
                        // If image is updated with src attribute, donot process again
                        if(!$(el).find("img").attr('src')){
                                $(el).find("img").attr('src',$(el).find("img").attr('data-src'));
                        }
                    }
        });
    };
    
    //Bronto Email Subscription code
   
    
    var BrontEmail = function() {
        this.inputField = "bronto-email-subscription";
        this.errorClass = "empty-val";
        this.successClass = "success-msg-on-submit";
        this.successMsg = "Thanks for subscribing";
        this.footer = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.brontodirectadd+'" width="0" height="0" border="0" alt=""/>';
        this.article = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.articlelist+'" width="0" height="0" border="0" alt=""/>';
        this.video = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.video+'" width="0" height="0" border="0" alt=""/>';
        this.news = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.news+'" width="0" height="0" border="0" alt=""/>';
        this.promo = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.promo+'" width="0" height="0" border="0" alt=""/>';
        this.allsubscribelist = '<img src="//'+$.debug(1).site.themeSettings.brontodirectaddDomainurl+'/public/?q=direct_add&fn=Public_DirectAddForm&id='+$.debug(1).site.themeSettings.brontodirectaddId+'&email=example@example.com&createCookie=1&list2='+$.debug(1).site.themeSettings.allsubscribelist+'" width="0" height="0" border="0" alt=""/>';
    };
    $.extend(BrontEmail.prototype, {
        init: function(el) {    
            var self = this;
            this.$el = $(el);
            this.loading = false;   
            this.$el.first().parent().find(".bronto-email-pdp").on('keyup', function(e){
                if (e.which === 13) {
                    self.buildBrontodirect(e);
                }
            });   
            this.$el.last().parent().parent().find(".bronto-footer-sub").on('keyup', function(e){
                if (e.which === 13) {
                    self.buildBrontodirect(e);
                }
            });
            this.$el.on('click', $.proxy(this.buildBrontodirect, this)); 
            $(document).on('keyup','#'+this.inputField,function(e) { 
                if (e.which !== 13) {    
                    $(this).removeClass(self.errorClass); 
                }       
            });
            if($.debug(1).pagecontext.isDebugMode) console.log("Bronto Email subscribe initialised");
            if($.debug(1).pagecontext.isDebugMode) console.log("Bronto Direct url: ",this.img);
        },
        getemailValue: function(e) {
            if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                if($(e.currentTarget).attr("data-val")){   
                    return  $.trim($(e.currentTarget).parent().find("input[type='text']").val());
                }else{
                    return  $.trim($(e.currentTarget).parent().parent().find("input[type='text']").val());
                }
            }else{
                return  $.trim($(e.currentTarget).val());     
            }
        },
        validateEmail: function($email,e) {
            var emailReg = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            return ($email) ? emailReg.test($email) : this.showError($email,e);
        },
        showError: function(email,e) {     
            if($.debug(1).pagecontext.isDebugMode) console.log("Error: Field value is empty or doesn't valid email address");
            if(!email){
                if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                    if($(e.currentTarget).attr("data-val")){
                        $(e.currentTarget).parent().find("input[type='text']").removeClass(this.errorClass).addClass(this.errorClass);    
                    }else{
                        $(e.currentTarget).parent().parent().find("input[type='text']").removeClass(this.errorClass).addClass(this.errorClass);    
                    }
                }else{
                    $(e.currentTarget).removeClass(this.errorClass).addClass(this.errorClass);        
                }
                this.shakeErrofield(e);   
            }  
            return false;
        },
        buildBrontodirect: function(e) {     
            e.preventDefault();
            var sdata, emails;
            var self = this;
            if(this.$el.length > 1){
                if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                    sdata = $(e.currentTarget);   
                }else{
                    sdata = $(e.currentTarget).parent().find(".bronto-subscription-btn");    
                }
            }else{
                sdata = this.$el;
            }
            var data = this.getemailValue(e);  
            if($.debug(1).pagecontext.isDebugMode) console.log("Click event",e);
            var inputVal = this.validateEmail(data,e);
            if($.debug(1).pagecontext.isDebugMode) console.log("Email ID :", this.getemailValue(e), "Validation Result: ",inputVal);// jshint ignore:line
            if(sdata.attr("data-val") === "article" ){
                (inputVal) ? self.constructBronttag(self.replaceUrl(self.article,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                setTimeout(function(){ 
                    (inputVal) ? self.constructBronttag(self.replaceUrl(self.allsubscribelist,'email',data),e) : self.showError(emails,e);// jshint ignore:line
                }, 3000);
            }else if(sdata.attr("data-val") === "news"){
                (inputVal) ? self.constructBronttag(self.replaceUrl(self.news,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                setTimeout(function(){ 
                    (inputVal) ? self.constructBronttag(self.replaceUrl(self.allsubscribelist,'email',data),e) : self.showError(emails,e);// jshint ignore:line
                }, 3000);
            }else if(sdata.attr("data-val") === "video"){
                (inputVal) ? self.constructBronttag(self.replaceUrl(self.video,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                setTimeout(function(){ 
                    (inputVal) ? self.constructBronttag(self.replaceUrl(self.allsubscribelist,'email',data),e) : self.showError(emails,e);// jshint ignore:line
                }, 3000);
            }else if(sdata.attr("data-val") === "promo"){
                (inputVal) ? self.constructBronttag(self.replaceUrl(self.promo,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                setTimeout(function(){ 
                    (inputVal) ? self.constructBronttag(self.replaceUrl(self.allsubscribelist,'email',data),e) : self.showError(emails,e);// jshint ignore:line
                }, 3000);
            }else{
                (inputVal) ? self.constructBronttag(self.replaceUrl(self.footer,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                setTimeout(function(){   
                    (inputVal) ? self.constructBronttag(self.replaceUrl(self.allsubscribelist,'email',data),e) : self.showError(emails,e);// jshint ignore:line    
                }, 3000);
                
            }  
        },
        replaceUrl: function(url, paramName, paramValue) {
            var pattern = new RegExp('('+paramName+'=).*?(&|$)');
            var newUrl=url;
            var newParamValue = encodeURIComponent(paramValue);
            if(url.search(pattern)>=0){
                newUrl = url.replace(pattern,'$1' + newParamValue + '$2');
            }
            else{
                newUrl = newUrl + (newUrl.indexOf('?')>0 ? '&' : '?') + paramName + '=' + paramValue ;
            }
            return newUrl;
        },
        shakeErrofield: function(e) {  
            var i, l = 20;    
            
            if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                if($(e.currentTarget).attr("data-val")){
                    for(i = 0; i < 10; i++ )
                    $(e.currentTarget).parent().find("input[type='text']").animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 50);  
                }else{
                    for( i = 0; i < 10; i++ )
                    $(e.currentTarget).parent().parent().find("input[type='text']").animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 50);  
                }
            }else{
                for( i = 0; i < 10; i++ )
                $(e.currentTarget).animate( { 'margin-left': "+=" + ( l = -l ) + 'px' }, 50);  
            }
            
        },
        constructBronttag: function(url,e) {
            if($.debug(1).pagecontext.isDebugMode) console.log("URL:", url);
            $('.bronto-email-subscription').remove();$('body').append(url);  
            var sdata;
            if(this.$el.length > 1){
                if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                    sdata = $(e.currentTarget);   
                }else{
                    sdata = $(e.currentTarget).parent().find(".bronto-subscription-btn");    
                }
            }else{
                sdata = this.$el;
            }
            if($.debug(1).pagecontext.isDebugMode) console.log("Success: Email address is updated with Bronto Direct add");
            if($(e.currentTarget).hasClass("bronto-subscription-btn")){
                if(sdata.attr("data-val") === undefined){
                    $(e.currentTarget).parent().parent().find("input[type='text']").val("");
                    $(e.currentTarget).parent().parent().find('.'+this.successClass).html(this.successMsg).show();   
                }else{
                    $(e.currentTarget).parent().find("input[type='text']").val("");
                    $(e.currentTarget).parent().find('.'+this.successClass).html(this.successMsg).show();   
                }
            }else{
                $(e.currentTarget).val("");
                $(e.currentTarget).parent().find('.'+this.successClass).html(this.successMsg).show();   
            }
            
        }
    });
    $(document).ready(function() {
        var popover = new BrontEmail();
            popover.init('.bronto-subscription-btn');

            // calling lazy load on page load first time
            lazyLoadImage();
            // calling lazy load on window srocll
            window.addEventListener('scroll',function() {
                lazyLoadImage();
            });
            
            $(".index-accordion .index-accordion-header h3").first().addClass('active');
            $(".index-accordion .index-accordion-header h3").first().find('span.mz-acc-icon').hide();
            $(".index-accordion .index-accordion-header h3").first().find('span.mz-acc-open').show();
            $(".index-accordion .index-accordion-content").first().show();

            $(".accordion.calc .article-header h3").first().find('span.mz-acc-icon').hide();
            $(".accordion.calc .article-header h3").first().find('span.mz-acc-open').show();
            $(".accordion.calc .article-content").first().show();
         
    });
    var tempdataversion=Math.random();
     
   // require(["pages/common"]);   
});
 




