require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($, Hypr, Backbone, api) {

    $(document).ready(function(){
        // console.log($('[homepagecaraousel]'));
        if($('[homepagecaraousel]').find("img").length > 1){
            var owl = $('[homepagecaraousel]');
            owl.owlCarousel({
                center:true,
                loop:true,
               // margin:10,
                nav:true,
                dots: true,
                autoplay: true, 
                animateIn: 'fadeIn',
               animateOut: 'fadeOut',
                items:1,
                lazyLoad : true,  
                responsive:{
                },              
            });
            
            $('.pause-control').on('click',function(){
                togglePausePlayBtn($(this));
            }); 
            $('.owl-prev').on('click',function(){
                if($('.pause-control').hasClass('paused'))
                {
                    togglePausePlayBtn($('.pause-control'));
                }
            }); 
            $('.owl-next').on('click',function(){
                if($('.pause-control').hasClass('paused'))
                {
                    togglePausePlayBtn($('.pause-control'));
                }
            });
            
            $('.pause-control').fadeIn(500);
            
        }
        function togglePausePlayBtn($this) {
            if($this.hasClass('paused'))
            {
                $this.removeClass('paused').addClass('playing');
                owl.trigger('play.owl.autoplay',[1000]);
            }
            else if($this.hasClass('playing'))
            {
                $this.removeClass('playing').addClass('paused');
                owl.trigger('stop.owl.autoplay');
            }
        }
    });

});

