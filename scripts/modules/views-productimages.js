define(['modules/jquery-mozu', 'underscore', "modules/backbone-mozu", 'hyprlive', 'modules/modal', "shim!vendor/owl.carousel[jQuery=jquery]", "shim!vendor/jquery.elevatezoom[jQuery=jquery]", "shim!vendor/jquery.bxslider[jQuery=jquery]>jquery"], function ($, _, Backbone, Hypr, ModalWindow) {
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
    
    var ProductPageImagesView = Backbone.MozuView.extend({
        templateName: 'modules/product/product-images',
        events: {
            'click [data-mz-productimage-thumb]': 'switchImage'
        }, 
        switchImage: function (e) {
            var $thumb = $(e.currentTarget),
                replaceMax = new RegExp("max="+Hypr.getThemeSetting('itemListingThumbSize'),"g"),
                desktopMax = "max="+Hypr.getThemeSetting('productMainImagesizeDesktop');
            this.selectedImageIx = $thumb.data('mz-productimage-thumb');
            this.selectedImageUrl = $thumb.find('.mz-productimages-thumbimage').attr('src').replace(replaceMax, desktopMax);
            this.updateMainImage($thumb, desktopMax);
            return false;
        },
        updateMainImage: function (thumbClick, desktopMaxForZoom) {
            if($(window).width() >767) {
                if(thumbClick)
                {
                    this.$('[data-mz-productimage-main]')
                        .prop('src', this.selectedImageUrl);
                    this.$('[data-mz-productimage-main]').data('zoom-image', this.selectedImageUrl.replace(desktopMaxForZoom, "max="+Hypr.getThemeSetting('productMainImagesizeZoom')));
                }
                if(this.$('[data-mz-productimage-main]').length !==0 )
                    this.$('[data-mz-productimage-main]').data('zoom-image', this.$('[data-mz-productimage-main]').data('zoom-image').replace(/[\r\n]/g, ""));
                
                //remove old zoom
                $('.zoomContainer').remove();
                
                //Zoom initiate
                $('.mz-productimages-main .mz-productimages-mainimage').on('mouseover', function(){
                    $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
                });
                  
                //auto zoom effect initiate for tablet
                if($(window).width() >767 && $(window).width() < 1025) {
                    $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
                }
            }
            else {
                if( $('.mz-productimages-thumbs').find('.mz-productimages-thumb').length > 1 ) {
                    $('.mz-productimages-thumbs').owlCarousel({  
                        dots: false,
                        autoplay:false, 
                        showNavPreview: false,
                        responsive : {    
                            640 : {
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumb').length > 1 ? true : false),
                                loop: true
                            },
                            300 : {
                                loop: true,
                                items: 1,
                                dots: true,
                                nav: ($('.mz-productimages-thumb').length > 1 ? true : false)
                            }
                        },    
                        nav: ($('.mz-productimages-thumb').length > 4 ? true : false),
                        addClassActive:true,
                        navThumbImg: false
                    });
                }
            
            }
            $('.mz-productimages-thumbs').find('.mz-productimages-thumb').css({'visibility':"visible"});
        },
        render: function () {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.updateMainImage();
            
            // BX slider for desktop gallery
            if($(window).width() >767) {
                if( $('.mz-productimages-thumbs').find('.mz-productimages-thumb').length > 1 ) {
                    $('.mz-productimages-thumbs').bxSlider({
                        infiniteLoop: false,
                        minSlides: 4,
                        touchEnabled: false,
                        mode: 'vertical',
                        moveSlides: 1,
                        slideWidth: 82,
                        pager: false
                    });
                }
            }
            
            //Zoom initiate
            $('.mz-productimages-main .mz-productimages-mainimage').on('mouseover', function(){
                $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
            });
            //auto zoom effect initiate for tablet
            if($(window).width() >767 && $(window).width() < 1025) {
                $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
            }
            //Show product gallery
            $( ".loader-product" ).hide();
            $( ".mz-productimages-thumbs" ).fadeTo(1000,1);
            $('.mz-productimages-main .mz-productimages-mainimage').fadeTo(1000,1);
            
            $('.videoicon.video-thumb').on('click', function (e) {
                e.preventDefault();
                vmodal = new videoPopup(($(this).parent().find('img').attr('data-video') ? $(this).parent().find('img').attr('data-video') : $(this).siblings().attr('data-video')));

                $('body').css({
                    'overflowY': 'hidden',
                    '-ms-overflow-y': "hidden"
                });
                if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
                    var currentPos = $(window).scrollTop();
                    window.onscroll = function () {
                        if ($(window).width() < 1025) {
                            $(window).scrollTop(currentPos);
                        }
                    };
                }
     });             
                $('.feature-images').children("span").on('mouseover',function (e) {
                    $(this).addClass('on');
                    if($(this).children("p").length === 0) {
                        $(this).removeClass('on');
                    }
                });
          
        }
    });
    $(document).ready(function(){

        //zoom effect initiate
        $('.mz-productimages-main .mz-productimages-mainimage').on('mouseover', function(){
            $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
        });
        
        //auto zoom effect initiate for tablet
        if($(window).width() >767 && $(window).width() < 1025) {
            $('.mz-productimages-main .mz-productimages-mainimage').elevateZoom();
        }
    });
    return {
        ProductPageImagesView: ProductPageImagesView
    };

});