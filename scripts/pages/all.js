define(['modules/jquery-mozu'], function($){

	$(document).ready(function () {
        var imgpath=$('.mz-storebranding').find('.mz-cms-image-maintain').attr('src');
		$('.mz-mob-logo').find('#mob-logo').attr('src',imgpath);
		
		//-------------------------------Search mobile  po-up----------------
        $('.sb-mobile-only .icon-search').on('click', function(e) {   
            e.preventDefault();
            $('.mz-mob-search-popup').show(); 
        });
        $('.mz-closebutton').on('click',function(){
            $('.mz-mob-search-popup').hide();
        });
        
        $('.mz-head-menu a').on('click', function(e){			
			e.preventDefault();	
			$('.mz-l-pagecontent').toggleClass('mz-hidepage');
			$('.mz-pagefooter').toggleClass('mz-hidepage');
			$('.mz-mobile-nav').toggleClass('leftside');
			$('.mz-l-pagewrapper').toggleClass('rightside');
			$('body').toggleClass('body-left');
		});
    
		if (matchMedia('only screen and (min-width:1px) and (max-width: 767px)').matches){ 
             $('.mz-droparrow').on('click',function(e){
                e.preventDefault();
                $(e.currentTarget).next().addClass('subactive').css({'display':'block','margin-right':'0px','visibility':'visible','float':'left'});
               $('.mz-droparrow').parents('.mz-sitenav-list').children('li').addClass('mz-parentdeactive');
                $(e.currentTarget).parents('.mz-sitenav-item').removeClass('mz-parentdeactive');
                if( $(e.currentTarget).parents('.mz-sitenav-item').removeClass('mz-parentdeactive')){
                    $('.subactive').first().css('display','block');
                    $('.backbutton').css('display','block');  
                }
                $('.backbutton').on('click',function(){
                     $('.mz-droparrow').parents('.mz-sitenav-list').children('li').removeClass('mz-parentdeactive');
                      $('.mz-droparrow').next().removeClass('subactive').css({'display':'none','margin-right':'0px','width':'100%','visibility':'hidden'});
                        $('.backbutton').css('display','none'); 
                 });
             });      
		}

		if($(".order-date-dump")){
            var orderDate = $(".order-date-dump").text(), dateSplit = orderDate.split(/["]/), showDate = new Date(dateSplit[1]);
            $('.order-date').text(" "+showDate.toLocaleDateString()+" " + showDate.toLocaleTimeString());   
		}
		$('.mz-column-head').on('click', function(e) {		
			e.preventDefault();			
                if (matchMedia('only screen and (max-width: 767px)').matches){   
					if($(this).hasClass('active')){
						$('.active').siblings('li').slideToggle("fast");
						$('.mz-column-head').removeClass('active');						
					}else{
						$('.active').siblings('li').slideToggle("fast");
						$('.mz-column-head').removeClass('active');
						$(this).addClass('active');
						$(this).siblings('li').slideToggle("fast");	
					}   
				}
		});
	
});
	
});
