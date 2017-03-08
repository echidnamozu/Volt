require([
    "modules/jquery-mozu", "modules/backbone-mozu",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($,Backbone) {
   
    $(document).ready(function() {
        if($('.mz-newsimage-mainimage').length > 1) {
            $('.newsImgs-innerwrap').owlCarousel({
                loop: true,
                nav: false,
                items: 1,  
                autoplay: true,
                lazyLoad : true
            });  
        }
        $('.newsImgs-innerwrap').css({ 'background-image': "none"});
    });  
});