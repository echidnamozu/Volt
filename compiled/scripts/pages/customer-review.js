define(['modules/jquery-mozu',  'underscore','hyprlive',"widgets/powerreviews",'modules/api',"modules/models-faceting"],function($,_,Hypr,PowerReviewsWidget,api,FacetingModels){
   
   var ProductListView = Backbone.MozuView.extend({ 
        templateName: 'modules/product/featuredProductNew'
   });
    var QOModel  = Backbone.MozuModel.extend({}); 
   var CustomSlider = {
       init:function(container){
           var self = this;
           self.container = container;
           self.pageSize = 4;
           self.currentPage=1;
           self.startIndex=0;
           self.totalItems = self.container.find('li').length;
           self.totalPage = Math.ceil(self.totalItems/self.pageSize);
           self.pos = $('#mz-drop-zone-top-rated').offset().top;
           self.bindEvents();
           self.showPage();
       },
       bindEvents: function(){
         var self = this;
         $('.prevNav').click(function(){
             self.prev();
         }); 
         $('.nextNav').click(function(){
             self.next();
         });
       },
       showPage: function(){
           var self= this;
           self.startIndex = (self.currentPage-1)*self.pageSize;
          var sdata = (self.currentPage === self.totalPage)?$('.nextNav').addClass("navDisabled"):$('.nextNav').removeClass("navDisabled");
           var sdat =(self.currentPage === 1)?$('.prevNav').addClass("navDisabled"):$('.prevNav').removeClass("navDisabled");
           self.container.find('li').hide();
           for( var i = self.startIndex;i < (self.startIndex+self.pageSize); i++){
                self.container.find('li').eq(i).show();
          }
       },
       next:function(){
           var self= this;
           if(self.currentPage < self.totalPage){
                self.currentPage+=1;
                self.showPage();
           }
          $('html,body').animate({
            scrollTop: self.pos - 100
          },1000);
       },
       prev: function(){
           var self= this;
           if(self.currentPage > 1){
            self.currentPage-=1;
            self.showPage();
           }
          $('html,body').animate({
            scrollTop: self.pos - 100
          },1000);
       }
   };
   
   $(function(){
         CustomSlider.init($(".mz-productlist-list"));
   });
});




