require([
    "modules/jquery-mozu", "modules/backbone-mozu",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($,Backbone) {
   
    $(document).ready(function() {
        if($('.mz-articleimage-mainimage').length > 1) {
            $('.articleImgs-innerwrap').owlCarousel({
                loop: true,
                nav: false,
                items: 1,  
                autoplay: true,
                lazyLoad : true
            });  
        }
        $('.articleImgs-innerwrap').css({ 'background-image': "none"});

        function scrolltoelement(elename)
        {
            if(elename !== "" && elename !== undefined && elename !== " ")
            {
                var offtop = $("."+elename).offset().top;
                $('html, body').animate({
                    scrollTop: offtop - 140
                }, 1000); 
            }
        }

        if(require.mozuData('product').productType === "Article type")
        {

            scrolltoelement(window.location.hash.substr(1));


            $(document).on('click',".anchor-scroll", function(e){
                e.preventDefault();
                var offs = $(this).attr('href');
                scrolltoelement(offs);
                return false;
            });


        }
    });
});