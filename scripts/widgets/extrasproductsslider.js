require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($, Hypr, Backbone, api) { 
        var QOModel  = Backbone.MozuModel.extend({});
            $(document).ready(function(){
         $(".productandextrasproductsslider-main-desc p").each(function(){ 
               $(this).text(function(index, currentText) {
                return currentText.substr(0, 135) + "...."; 
                 });
            });
        $('[productandextrasproductsslider-main-wraper]').owlCarousel({  
                loop:true,
                margin:10,
                dots: true,
                autoplay:false, 
                showNavPreview: true,
                //animateIn: 'fadeIn',
                //animateOut: 'fadeOut',     
                items:1,
                nav:true,
                lazyLoad : true,
                addClassActive:true,
                navThumbImg: true
            });
            $('[productandextrasproductsslider-extras]').each(function(){
               if($(this).find("[productandextrasproductsslider-extras-sub]").length ==1 ){
                    $(this).owlCarousel({ 
                    loop:false,
                    margin:10,
                    dots: true,
                    autoplay:false, 
                    showNavPreview: false,
                    autoplayTimeout:3000,
                    autoplayHoverPause:true,
                    //animateIn: 'fadeIn',
                    animateOut: 'fadeOut',
                    lazyLoad : true,
                    responsive : {
                        1024 : {
                            items: 2
                        },
                        768 : {
                            items: 1
                        },
                        640 : {
                            items: 1
                        },
                        300 : {
                            items: 1
                        }
                    },
                    navThumbImg: true
                    
                });         
               }else{
                    $(this).owlCarousel({ 
                    loop:true,
                    margin:10,
                    dots: true,
                    autoplay:false, 
                    showNavPreview: false,
                    autoplayTimeout:3000,
                    autoplayHoverPause:true,
                    //animateIn: 'fadeIn',
                    animateOut: 'fadeOut',
                    lazyLoad : true,
                    responsive : {
                        1024 : {
                            items: 2
                        },
                        768 : {
                            items: 1
                        },
                        640 : {
                            items: 1
                        },
                        300 : {
                            items: 1
                        }
                    },
                    navThumbImg: true
                    
                });
               } 
            });
             
            
        });
    });









