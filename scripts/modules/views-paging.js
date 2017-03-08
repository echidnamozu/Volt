/**
 * Can be used on any Backbone.MozuModel that has had the paging mixin in mixins-paging added to it.
 */
define(['modules/jquery-mozu', 'underscore', 'modules/backbone-mozu'], function($, _, Backbone) {

    var PagingBaseView = Backbone.MozuView.extend({
        initialize: function() {
            var me = this;
            if (!this.model._isPaged) {
                throw "Cannot bind a Paging view to a model that does not have the Paging mixin!";
            }

            //handle browser's back button to make sure startIndex is updated.
            Backbone.history.on('route', function () {
                me.model.syncIndex(Backbone.history.fragment);
            });
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
            this.$('select').each(function() {
                var $this = $(this);
                $this.val($this.find('option[selected]').val());
            });
        }
    });

    var PagingControlsView = PagingBaseView.extend({
        templateName: 'modules/common/paging-controls',
        autoUpdate: ['pageSize'],
        updatePageSize: function(e) {
            var newSize = parseInt($(e.currentTarget).val(), 10),
            currentSize = this.model.get('pageSize');
            if (isNaN(newSize)) throw new SyntaxError("Cannot set page size to a non-number!");
            if (newSize !== currentSize) {
                this.model.set('pageSize', newSize);
                this.model.set("startIndex", 0);
            }
        }
    });

    var PageNumbersView = PagingBaseView.extend({
        templateName: 'modules/common/page-numbers',
        previous: function(e) {
            e.preventDefault();
            $(".preloader").show();
            return this.model.previousPage().then(scrollToTop);
        },
        next: function(e) {
            e.preventDefault();
            $(".preloader").show();
            return this.model.nextPage().then(scrollToTop);
        },
        page: function(e) {
            e.preventDefault();
            $(".preloader").show();
            return this.model.setPage(parseInt($(e.currentTarget).data('mz-page-num'), 10) || 1);
        }
    });

    var scrollToTop = function() {
        
        $(".preloader").hide();
         $("html, body").animate({ scrollTop: 0 }, "medium");
       
    };

    var TopScrollingPageNumbersView = PageNumbersView.extend({
        previous: function() {
            return PageNumbersView.prototype.previous.apply(this, arguments).then(scrollToTop);
        },
        next: function() {
            return PageNumbersView.prototype.next.apply(this, arguments).then(scrollToTop);
        },
        page: function() {
            return PageNumbersView.prototype.page.apply(this, arguments).then(scrollToTop);
        }
    });

    var PageSortView = PagingBaseView.extend({
        templateName: 'modules/common/page-sort',
        updateSortBy: function(e) {
            return this.model.sortBy($(e.currentTarget).val());
        }
    });

    var PageSortMobileView = PagingBaseView.extend({
        templateName: 'modules/common/page-sort-mobile',
        updateSortBy: function(e) {
            if(e.target.getAttribute('value') === "undefined")
                return this.model.sortBy("");
            else
                return this.model.sortBy(e.target.getAttribute('value'));
        },
        
        hideSortPopup: function(e){
            e.preventDefault();
            $('[data-mz-mobile-page-sort]').fadeOut();
        }
    });
 
    var MobileSelectedFiltersView = PagingBaseView.extend({
        templateName: 'modules/common/mob-selected-fiter-values',
        getRenderContext: function(){
            var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments); 
            var filterdSelections = [];
            $(c.model.facets).each(function(ky,val){
                var arr = _.filter(val.values,function(obj){
                    return obj.isApplied;
                });
                if(arr.length>0)
                    filterdSelections.push(arr);
            });
            if(filterdSelections.length>0){
                c.model.filterdSelections = true;
            }else{
                c.model.filterdSelections = false;
            }
            return c;
        },
        render:function(e){
            Backbone.MozuView.prototype.render.apply(this);
        },
        clearFacet: function (e) {
            this.model.setFacetValue($(e.currentTarget).data('mz-facet'),$(e.currentTarget).data('mz-facet-value'),false);//"Facets").findWhere({ field: $(e.currentTarget).data('mz-facet') }).empty();
        },
        clearFacets: function () {
            this.model.clearAllFacets();
        },
    });
    
    return {
        PagingControls: PagingControlsView,
        PageNumbers: PageNumbersView,
        TopScrollingPageNumbers: TopScrollingPageNumbersView,
        PageSortView: PageSortView,
        PageSortMobileView: PageSortMobileView,
        MobileSelectedFilters: MobileSelectedFiltersView
    };

});