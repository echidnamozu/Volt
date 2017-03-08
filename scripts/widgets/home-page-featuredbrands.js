require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api"], function ($, Hypr, Backbone, api) {
	 
    $(document).ready(function(){
           
            var data =  require.mozuData('home_featured_categories');
            loadData();
            setInterval(function () {
                if(typeof  require.mozuData('home_featured_categories') != 'undefined')
                {
                    if( data.length !=  require.mozuData('home_featured_categories').length){
                        data =  require.mozuData('home_featured_categories');
                        loadData();
                    }else{
                        var tempData = require.mozuData('home_featured_categories');
                        var stopLoop = true;
                        $(data).each(function(index,id){
                            if(id != tempData[index] && stopLoop){
                                data =  require.mozuData('home_featured_categories');
                                loadData();
                                stopLoop = false;
                            }
                        });
                    }    
                }
          }, 1000);
            function loadData(){
                var length = data.length;
                var arrayOfData = [], result = [];
                var i = 0;          
                $(data).each(function(index,catId){ 
                    var categorydetailsurl = '/api/commerce/catalog/storefront/categories/'+catId+'?allowInactive=true';    
                    api.request('GET',categorydetailsurl).then(function(dataretrived){
                        dataretrived.content.categoryId =dataretrived.categoryId;
                        if(dataretrived.content.categoryImages[0])dataretrived.content.logo = dataretrived.content.categoryImages[0].imageUrl; 
                        arrayOfData[i++] = dataretrived.content;
                        if(arrayOfData.length == length){
                        
                            data.forEach(function(key) {
                            var found = false;
                                arrayOfData = arrayOfData.filter(function(item) {
                                    if(!found && item.categoryId == key) {
                                        result.push(item);
                                        found = true;
                                        return false;
                                    } else 
                                        return true;
                                });
                            });
                            $('#home_featured_categories').empty();            
                            $('#home_featured_categories').append(Hypr.getTemplate('modules/homepage-brands-listing').render({model: result}));
                        }
                        
                    },function(dataError){ console.error(dataError); });
                });
            }
    });
});
