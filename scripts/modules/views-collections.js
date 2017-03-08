

/**
 * Unidirectional dispatch-driven collection views, for your pleasure.
 */


define([
    'modules/jquery-mozu',
    'backbone',
    'underscore',
    'modules/url-dispatcher',
    'modules/intent-emitter',
    'modules/get-partial-view','pages/product-listing',
    'modules/models-faceting'
], function($,Backbone, _, UrlDispatcher, IntentEmitter, getPartialView,ProductListViews,FacetingModels) {
  
    function factory(conf) {

        var _$body = conf.$body;
        var _dispatcher = UrlDispatcher;
        var ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND';

        function updateUi(response) {
            var url = response.canonicalUrl;
            _$body.html(response.body);
            if (url) _dispatcher.replace(url);
            _$body.removeClass('mz-loading');
             
            
           /* Re-render Click Event on Apply Filters */
            $('.facetapply').click(function(e) {
                applyFilter();
            }); 
             $(document).trigger("facetview"); 
            /* End of Re-render Click Event on Apply Filters */
         
        } 

        function showError(error) {
           
            _$body.find('[data-mz-messages]').text(error.message);
        }

        function intentToUrl(e) {
            var elm = e.target;
            var url, parser;
            if (elm.tagName.toLowerCase() === "select") {
                elm = elm.options[elm.selectedIndex];
            }
            url = elm.getAttribute('data-mz-url') || elm.getAttribute('href') || '';
            if(require.mozuData('pagecontext').pageType === "search"){    
                if (url && url[0] != "/") { 
                      /* jshint ignore:start */

                    if(url === "javascript:void(0)" ){
                       
                        var queryParams = $.deparam();
                        queryParams.facetValueFilter ="";
                         
                        url = window.location.pathname+"?"+$.param(queryParams);
                    }else{
                       parser = document.createElement('a');
                        parser.href = url;
                        url = window.location.pathname + parser.search; 
                    }
                    /* jshint ignore:end */
                }    
            }else{
                if (url && url[0] != "/") {
                    parser = document.createElement('a');
                    parser.href = url;
                    url = window.location.pathname + parser.search;
                }    
            }
            return url;
        }

        var navigationIntents = IntentEmitter(
            _$body,
            [

                'change [data-mz-pagingcontrols]',
                'click [data-mz-pagenumbers] a',
                'click a[data-mz-facet-value]',
                'click [data-mz-action="clearFacets"]',
                'change [data-mz-value="pageSize"]',
                'change [data-mz-value="sortBy"]',
                'click .update-sortBy'

            ],
            intentToUrl
        );
       
       var facetIntents = IntentEmitter(
            _$body,
            [
                'click .facetapply'
            ],
            applyFilter
        );
        
        
       
        navigationIntents.on('data', function(url, e) {
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                 $('.preloader').show();
                e.preventDefault();
            }
        });

        _dispatcher.onChange(function(url) {
            getPartialView(url, conf.template).then(updateUi, showError);
        });
        
        
        function applyFilter(e) {
            // Show Loader
            $(document).find('.preloader').show();

            var url_build="";
            var flag=false;

            var filter_value = [];
            
            var desk = require.mozuData('pagecontext'); 
            var query = "";
            var queryParams = $.deparam();
            query = queryParams.query;
            if (($(window).width()) > 767) {
                
                $(".mz-facetingform-facet input:checkbox:checked").each(function(){
                 var self= $(this);
                if ($.inArray(this.getAttribute('data-mz-facet-value'), filter_value) < 0) {
                    filter_value.push(this.getAttribute('data-mz-facet-value'));

                    var url_data = this.getAttribute('data-mz-facet')+':'+this.getAttribute('data-mz-facet-value');
                    if(!flag)
                    {
                        if(desk.pageType === "search"){
                            
                            url_build = url_data;
                            flag=true;// To trace if first query string added
                        }else{
                            
                            url_build = url_data;
                            flag=true;// To trace if first query string added
                        }
                    }
                    else
                    {
                        url_build = url_build+','+url_data;
                    } 
                }
 
                });
            }
            else{
                $(".mz-facetingform-facet-mobile input:checkbox:checked").each(function(){

                if ($.inArray(this.getAttribute('data-mz-facet-value'), filter_value) < 0) {
                    filter_value.push(this.getAttribute('data-mz-facet-value'));

                    var url_data = this.getAttribute('data-mz-facet')+':'+this.getAttribute('data-mz-facet-value');
                    if(!flag)
                    {
                        if(desk.pageType === "search"){
                            url_build = url_data;
                              
                            flag=true;// To trace if first query string added
                        }else{
                            url_build = url_data;
                            
                            flag=true;// To trace if first query string added
                        }
                    }
                    else
                    {
                        url_build = url_build+','+url_data;
                    } 
                }
 
                });
            }   
            queryParams.facetValueFilter=url_build;  
            url_build = window.location.pathname+"?"+$.param(queryParams);
             if (url_build && _dispatcher.send(url_build)) {
                _$body.addClass('mz-loading');
             }

          

        }

        
 
        $(function() {
            $(document).on('change', '.mz-facetingform-value', function() {

                var ck_id = $(this).is(':checked');
                var flt_val = $(this).data('mz-facet-value');

                if (!$(this).is(':checked')) {
                    $('[data-mz-facet-value="'+ flt_val +'"]').attr('checked', false);
                   
                }
            });
        }); 

    }
 
    return {
        createFacetedCollectionViews: factory
    };

});




















