require([
    "modules/jquery-mozu", 
    "hyprlive", 
    "modules/backbone-mozu", 
    "modules/api",
    "shim!vendor/owl.carousel[jquery=jQuery]>jQuery"], function ($, Hypr, Backbone, api) {
	 
    $(document).ready(function(){
            var data =  require.mozuData('promotionalproducts');
             loadData();
            function loadData(){
                var length = data.length, templength=0, arrayOfData = [], result = [], i = 0, j=0, arraydata=[];
                 $(data).each(function(index,catId){ 
                    var temphtml="", temp1html="", productfig="", categorydetailsurl = '/api/commerce/catalog/storefront/products/'+catId+'?allowInactive=true';     
                    api.request('GET',categorydetailsurl).then(function(dataretrived){
                         arraydata.push(dataretrived);
                         arrayOfData.push(1);
                         if( data.length == arrayOfData.length){
                             $('.promotionalProductContainer').append(Hypr.getTemplate('modules/promotionalProductWidget').render({model: arraydata})); 
                         }
                    });
                 });
            }
    }); 
});
