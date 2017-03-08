define(['jquery', 'vendor/jquery-plugin-factory'], function($, PluginFactory) {
  var Tabs;

  // TODO: Should change from class selectors to role selectors
  Tabs = function(element, options) {
    var me = this;

    this.$element = $(element);

    this.$tabs = this.$element.find('.mz-tabs__link');

    this.$containers = this.$element.find('.mz-tab');
    
    /* Changes By Mozu dev For Active Tab content */
     var hashValue = window.location.hash;
     if(hashValue!==""){
        var ftab_id = hashValue.split('#')[1];
         this.open(ftab_id);
    }else{
        if(this.$element.find('.is-active')!==undefined){
           this.open(this.$element.find('.is-active').data('mz-tabs-id'));
            
        }else{
            this.open(this.$tabs.first().data('mz-tabs-id'));
        }
    }

    this.$tabs.on('click tap', function() {
      me.handleClickTap(this);
    });
    var self = this;
    $(window).on('hashchange', function(e){
         var hashValue = window.location.hash;
        if(hashValue!==""){
            var ftab_id = hashValue.split('#')[1];
             self.open(ftab_id);
             window.scrollTo(0, 0); 
        }else{
            self.open(self.$tabs.first().data('mz-tabs-id'));
        }
    });
   
  };

  Tabs.ACTIVE_CLASS = 'is-active';

  $.extend(Tabs.prototype, {
    handleClickTap: function(tab) {
      var $tab = $(tab),
        tabId = $tab.data('mz-tabs-id');
        if(history.pushState) {
            history.pushState(null, null, '#'+tabId);
        }
        else {
            location.hash = '#'+tabId;
        }
      this.open(tabId);
    },
    
    open: function(tabId, scrollTo) {
      this._deactivate();
      this._activate(tabId);
      if (!scrollTo) return;
      $('html, body').animate({
        scrollTop: this.$element.offset().top - 10
      }, 300);
    },
    _deactivate: function() { 
      if (this.$tabs.filter('.' + Tabs.ACTIVE_CLASS).data('mz-tabs-id') == 'videos') {
        $('body').trigger('productVideoHidden');
      }
      this.$tabs.removeClass(Tabs.ACTIVE_CLASS);
      this.$containers.removeClass(Tabs.ACTIVE_CLASS);
    },
    _activate: function(tabId) {
      this.$element.find('[data-mz-tabs-id="' + tabId + '"]').addClass(Tabs.ACTIVE_CLASS);
      $(".mz-l-carousel").trigger('owl.goTo', 0); 
       var owl = $(".owl-carousel").data('owlCarousel');
    } 
  });

  PluginFactory(Tabs, 'seismic.mzTabs');
  
  $(document).ready(function() {
    $('.mz-tabs').mzTabs();
  });
});
