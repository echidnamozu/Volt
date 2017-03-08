require([
    "modules/jquery-mozu", "modules/backbone-mozu",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($,Backbone) {
   
    $(document).ready(function() {

        if($('.video-linkcontainer-item').length > 1) {
            $('.video-linkcontainer-item').fadeIn(200); 
            $('.video-linkcontainer').owlCarousel({
                loop: true, 
                nav: false,
                items: 1,  
                autoplay: false,
            });  
        }   
        $('.videoImgs-innerwrap').css({ 'background-image': "none"});
        $('.products-list-item').fadeIn(300);
        $('.products-list').css({ 'background-image': "none"});
        $('.project-products').owlCarousel({
            loop: false,
            nav: true,  
            responsive : {  
                1280 : {
                    items: 5,
                    nav: ($('.products-list-item').length <=5 ? false : true)
                },
                1024 : {
                    items: 4,
                    nav: ($('.products-list-item').length <=4 ? false : true)
                },
                768 : {
                    items: 3,
                    nav: ($('.products-list-item').length <=3 ? false : true)
                },
                640 : {
                    items: 2,
                    nav: ($('.products-list-item').length <=2 ? false : true)
                },
                300 : {
                    items: 1,
                    nav: ($('.products-list-item').length <=1 ? false : true)
                }
            },
            autoplay: false,
            dots: false,
            margin: 20
        });
        // add power reviews to product list on render
        //if(Hypr.getThemeSetting('managePowerReview'))PowerReviewsWidget.writeProductListBoxes();
    });  
});