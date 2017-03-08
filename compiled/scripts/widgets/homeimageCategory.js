require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api",
    "underscore"], function ($, Hypr, Backbone, api, _) {

    $(document).ready(function(){
        var arraydata=[], result=[], rslt1=[], data =  require.mozuData('image_categories');
              $(data).each(function(index,catId){ 
                 var categorydetailsurl = '/api/commerce/catalog/storefront/categories/'+catId+'?allowInactive=true';     
                    api.request('GET',categorydetailsurl).then(function(dataretrived){
                      rslt1.push(dataretrived);
                      dataretrived.content.id = dataretrived.categoryId;
                       dataretrived.content.displayed=dataretrived.isDisplayed;
                      result.push(dataretrived.content); 
                      arraydata.push(1);
                    if(arraydata.length==data.length){
                        var filteredItem = {};
                        var newArray = [];
                        $(data).each(function(key,val){
                            filteredItem = _.where(result, {id: val});
                            if(filteredItem[0].displayed===true){
                                newArray.push(filteredItem[0]);    
                            }
                        });
                        $('.homecateogry').append(Hypr.getTemplate('modules/cateogrywidget').render({model: newArray}));
                    }
                    });
              });
    });
});


