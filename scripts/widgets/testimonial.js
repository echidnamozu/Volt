require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api"], function ($, Hypr, Backbone, api) {
    $(document).ready(function(){
        var arraydata=[];
        var result=[];
            var data =  require.mozuData('testimonialcateogries');
              $(data).each(function(index,catId){ 
                 var categorydetailsurl = '/api/commerce/catalog/storefront/categories/'+catId+'?allowInactive=true';     
                    api.request('GET',categorydetailsurl).then(function(dataretrived){
                        dataretrived.content.id=catId;
                      result.push(dataretrived.content); 
                    arraydata.push(1);
                     if(arraydata.length==data.length){
                      $('.testimonialdata').append(Hypr.getTemplate('modules/testimonialwidget').render({model: result}));
     
                    }
                    });
              });
    });
    
});





































