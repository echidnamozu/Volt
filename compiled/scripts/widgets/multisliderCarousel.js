require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($, Hypr, Backbone, api) {
	 

    $(document).ready(function(){
       
            var data =  require.mozuData('desgin_categories');
            loadData();
            function loadData(){
                var length;
                var lenNew= data.length;
                length=lenNew;
                var templength=0;
                var arrayOfData = [], result = [];
                var i = 0;  
                var j=0;
                var arraydata=[];
                $(data).each(function(index,catId){ 
                    var temphtml="";
                    var temp1html="";
                      var productfig="";
                    var categorydetailsurl = '/api/commerce/catalog/storefront/categories/'+catId+'?allowInactive=true';     
                    api.request('GET',categorydetailsurl).then(function(dataretrived){
                        //console.log(dataretrived);
                        
                        temphtml+="<div class='slides'><div class='mz-text'>  <h3 class='getinspired'>Get Inspired By <label class='designfrom'>Designs from</label> <label class='amppro'>AMP<sup>&reg;</sup> Pros</label></h3></div>";
                temphtml+="<div class='multislideparent'><div class='columns  leftslide'><a href=''><figure><img src='"+dataretrived.content.categoryImages[0].imageUrl+"' class='leftslide' alt='product' /></figure></a><p class='para-name'>"+dataretrived.content.name+"</p><p class='para-desc'>"+dataretrived.content.description+"</p><div class='mz-visit'><a href='' title='VISIT PROJECT PORTFOLIO'>VISIT PROJECT PORTFOLIO</a></div></div>";
                        
                        api.request('GET',"/api/commerce/catalog/storefront/productsearch/search/?startIndex=0&pageSize=200&filter=categoryId+eq+"+catId).then(function(dataretrived1){
                            for( var i=0;i<dataretrived1.items.length;i++){ 
                              templength=i+1;
                               //console.log("length==>"+arrayOfData.length);
                              
                               if(arrayOfData.length===0 ){
                                temphtml+="<div class='rightslide columns'><div class='subsliders animateslider'>";   
                               }else if(i===0) {
                                   temphtml+="<div class='rightslide columns'><div class='subsliders medium-7 columns'>";
                               }
                                arrayOfData.push(1); 
                                if(i===0){
                                    productfig+="<div class='minidata'><p class='gray-txt'>"+templength+"</p>";        
                                }else{
                                    productfig+="<div class='minidata'><p class='gray-txt'>"+templength+"</p>";    
                                }
                                
                                productfig+="<a href='/p/"+dataretrived1.items[i].productCode+"'><figure><img src='"+dataretrived1.items[i].content.productImages[0].imageUrl+"' class='medium-2' alt='Sub - product' /></figure></a><p class='icon-img'><a href='/p/"+dataretrived1.items[i].productCode+"' target='_blank' title='"+dataretrived1.items[i].content.productName+"'>"+dataretrived1.items[i].content.productName+"</a></p>";
                                productfig+="<p class='price'>"+"$"+dataretrived1.items[i].price.price+"</p>";
                                productfig+="<p class='pricedetails'>"+dataretrived1.items[i].content.productShortDescription+"</p><p><a href='/p/"+dataretrived1.items[i].productCode+"' class='shopnow' title='SHOP NOW'>SHOP NOW</a></p></div>";
                                temphtml+=productfig;
                                productfig="";
                            }
                            temphtml+="</div></div></div>";
                             $('.bg-totalpro-slide').append(temphtml);
                            arraydata.push(productfig); 
                            j++;
                              if (arraydata.length === lenNew) {
                                    runSlideShow();
                                     
        $("#mz-drop-zone-mutlislider").find(".owl-next-new").click(function(){
             setTimeout(function(){  removeSlider(); }, 100);
        });
        $("#mz-drop-zone-mutlislider").find(".owl-prev-new").click(function(){
             setTimeout(function(){  removeSlider(); }, 100);
        });
                                }
                            
                    }); 
               
       
                    },function(dataError){
                        
                    });
                 
                  j++;
                });
                  
            }
    });
    function removeSlider(){
        if ($('.animateslider').hasClass("owl-carousel")) {
   $('.animateslider').owlCarousel({
        touchDrag: false,
        mouseDrag: false
    });
   
   $('.animateslider').each(function(){
       $(this).data('owlCarousel').destroy();
   $(this).removeClass('owl-carousel owl-loaded');
    $(this).find('.owl-stage-outer').children().unwrap();
   $(this).removeData();    
   });
   
}
        
        
             //var owl = $('.animateslider');
             //owl.data('owlCarousel').destroy(); 
             $(".animateslider").removeClass("animateslider");
             $(".owl-stage-outer").find(".active").find('.subsliders').addClass("animateslider");
             addSubcarousel(); 
    }
    function addSubcarousel(){
                    var owl = $('.animateslider');
            /*        owl.owlCarousel({
                        items:1,
                itemsCustom:      [[0, 1], [480,1], [700, 1], [1000, 1],[1025,1]],
                autoplay:true,
                loop:true,
                margin:10,
               // autoPlay: 3000,
                dots:true,
                nav:true,
                afterInit: function() {
               // $('.vt-slider').css({ 'display': 'block' });
                //$('.vt-slider2').css({ 'display': 'block' });
                }
            })*/
            
            owl.owlCarousel({
               
                loop:true,
                margin:10,
               // nav:true,
                dots: true,
                autoplay:true, 
                showNavPreview: false,
                items:1, 
               onInitialized :function(){
                  // console.log($(".animateslider").find(".minidata"));
                   //$(".animateslider").find(".minidata").css("display","block");
               }
                //enableResizeTime: 500
            });
           
        
    }
 function runSlideShow(){ 
   
           var owlDsk = $('.bg-totalpro-slide');
      
           
              /* owlDsk.owlCarousel({
                itemsCustom:      [[0, 1], [480,1], [700, 1], [1000, 1],[1025,1]],
                items:1,
                loop:true,
                margin:10,
               // autoPlay: 3000,
               addClassActive:true,
               dots: false,
                nav:true,
                navText:["prev","next"],
                 onChange: function(){
                     alert(1);
                removeSlider();
                }
            });*/
           
           
           /* owlDsk.owlCarousel({
               center:true,
                loop:true, 
                margin:10,
                navigation:true,
                navigationText : ["prev","next"],
                dots: false,
                 addClassActive:true,
                 showNavPreview: true,
                 slideSpeed: 1200,
                paginationSpeed : 1000,
                rewindNav: false, 
                rewindSpeed: 1500,
                afterMove: function(){
                removeSlider();},
                
                itemsCustom:      [[0, 1], [480,1], [700, 1], [1000, 1],[1025,1]],
               /* responsive:{
                    0:{,
                        items:1
                    },
                    600:{
                        items:1
                    },
                    1000:{
                        items:1
                    }
                }, 
                enableResizeTime: 500
            });*/ 
    owlDsk.owlCarousel({
                center:true,
                loop:true,
                margin:10,
                nav:true,
               // dots: true,
                addClassActive:true,
                autoplay:false,
                items:1,
                showNavPreview: true,
                navClass: ['owl-prev owl-prev-new', 'owl-next owl-next-new'],
                responsive:{
                    0:{
                        items:1
                    },
                    600:{
                        items:1
                    },
                    1000:{
                        items:1
                    }
                },
                onDragged:function(){
                    setTimeout(function(){  removeSlider(); }, 1000);
                 
                }, 
                
               // enableResizeTime: 500
            });
            
     addSubcarousel();         
        
      
        }
       
});







































































